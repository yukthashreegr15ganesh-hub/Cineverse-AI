import math
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import settings
from app.schemas.movie import MovieSummary, MovieDetail, PaginatedMovies
from app.schemas.recommendation import RecommendationResponse, MovieSection, FormulaMetrics
from app.schemas.watchlist import WatchlistResponse, WatchlistCreate, WatchlistItem
from app.schemas.analytics import AnalyticsOverview, GenreCount, RatingBin, ScatterPoint
from app.services.dataset_service import DatasetService
from app.services.recommendation_engine import RecommendationEngine
from app.services.watchlist_service import WatchlistService
from app.services.tmdb_service import TMDBService

router = APIRouter(prefix="/api")

# Singletons initialized in main.py or module
dataset_service = DatasetService()
rec_engine = RecommendationEngine(dataset_service)
watchlist_service = WatchlistService(dataset_service=dataset_service)
tmdb_service = TMDBService()


@router.get("/health")
def health_check():
    df = dataset_service.get_all_movies_df()
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "dataset_movies": len(df),
        "tmdb_adapter_active": tmdb_service.is_enabled,
        "watchlist_source": "sqlite"
    }


@router.get("/genres", response_model=List[str])
def get_genres():
    return dataset_service.get_all_genres()


@router.get("/movies", response_model=PaginatedMovies)
def get_movies(
    q: Optional[str] = Query(None, description="Search query in title and synopsis"),
    genre: Optional[str] = Query(None, description="Genre filter"),
    min_rating: Optional[float] = Query(None, ge=0.0, le=10.0, description="Minimum rating"),
    min_votes: Optional[int] = Query(None, ge=0, description="Minimum vote count"),
    year: Optional[int] = Query(None, description="Release year"),
    sort_by: str = Query("popularity", description="Sort by field: popularity, vote_average, weighted_rating, release_date"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=100, description="Items per page")
):
    # Compute weighted rating on the fly if user sorts by weighted_rating
    if sort_by == "weighted_rating":
        # Run recommendation engine ranking
        movies, _ = rec_engine.get_weighted_recommendations(
            genre=genre,
            limit=1000
        )
        if q and q.strip():
            query_lower = q.strip().lower()
            movies = [m for m in movies if query_lower in m["title"].lower() or query_lower in m["overview"].lower()]
        if min_rating:
            movies = [m for m in movies if m["vote_average"] >= min_rating]
        if min_votes:
            movies = [m for m in movies if m["vote_count"] >= min_votes]
        if year:
            movies = [m for m in movies if m["release_date"].startswith(str(year))]

        if order.lower() == "asc":
            movies.reverse()

        total = len(movies)
        start_idx = (page - 1) * page_size
        paged_items = movies[start_idx:start_idx + page_size]
        total_pages = max(1, math.ceil(total / page_size))
        return {
            "items": paged_items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    items, total = dataset_service.filter_movies(
        q=q,
        genre=genre,
        min_rating=min_rating,
        min_votes=min_votes,
        year=year,
        sort_by=sort_by,
        order=order,
        page=page,
        page_size=page_size
    )
    total_pages = max(1, math.ceil(total / page_size))
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/movies/{movie_id}", response_model=MovieDetail)
async def get_movie_detail(movie_id: int):
    # Try TMDB if enabled
    if tmdb_service.is_enabled:
        tmdb_data = await tmdb_service.get_movie_details(movie_id)
        if tmdb_data:
            in_w = watchlist_service.is_in_watchlist(movie_id)
            return {**tmdb_data, "in_watchlist": in_w}

    movie = dataset_service.get_movie_by_id(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail=f"Movie with ID {movie_id} was not found.")

    # Calculate weighted rating for detail view
    explanation = rec_engine.explain_score(movie_id)
    if explanation:
        movie["weighted_rating"] = explanation["weighted_rating"]

    in_w = watchlist_service.is_in_watchlist(movie_id)
    return {
        **movie,
        "in_watchlist": in_w,
        "data_source": "sample_dataset"
    }


@router.get("/movies/{movie_id}/similar", response_model=List[MovieSummary])
def get_similar_movies(movie_id: int, limit: int = Query(6, ge=1, le=20)):
    movie = dataset_service.get_movie_by_id(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail=f"Movie with ID {movie_id} not found.")
    return rec_engine.get_similar_by_genre(movie_id, limit=limit)


@router.get("/recommendations/weighted", response_model=RecommendationResponse)
def get_weighted_recommendations(
    m_threshold: Optional[float] = Query(None, description="Explicit minimum vote count threshold (m)"),
    quantile: Optional[float] = Query(0.60, ge=0.0, le=1.0, description="Quantile percentile for m threshold"),
    genre: Optional[str] = Query(None, description="Optional genre constraint"),
    limit: int = Query(15, ge=1, le=50, description="Number of results")
):
    movies, metrics = rec_engine.get_weighted_recommendations(
        m_threshold=m_threshold,
        quantile=quantile,
        genre=genre,
        limit=limit
    )
    return {
        "algorithm": "IMDb Weighted Rating (IMDb WR)",
        "is_personalized": False,
        "metrics": metrics,
        "total_eligible": len(movies),
        "movies": movies
    }


@router.get("/recommendations/popular", response_model=List[MovieSummary])
def get_popular_recommendations(
    limit: int = Query(15, ge=1, le=50),
    genre: Optional[str] = Query(None)
):
    return rec_engine.get_most_popular(limit=limit, genre=genre)


@router.get("/recommendations/top-rated", response_model=List[MovieSummary])
def get_top_rated_recommendations(
    limit: int = Query(15, ge=1, le=50),
    genre: Optional[str] = Query(None)
):
    return rec_engine.get_top_rated_raw(limit=limit, genre=genre)


@router.get("/recommendations/hidden-gems", response_model=List[MovieSummary])
def get_hidden_gems_recommendations(limit: int = Query(15, ge=1, le=50)):
    return rec_engine.get_hidden_gems(limit=limit)


@router.get("/recommendations/explain/{movie_id}")
def explain_movie_score(
    movie_id: int,
    m_threshold: Optional[float] = Query(None, description="Optional custom minimum vote threshold")
):
    explanation = rec_engine.explain_score(movie_id, m_threshold=m_threshold)
    if not explanation:
        raise HTTPException(status_code=404, detail=f"Movie with ID {movie_id} not found.")
    return explanation


@router.get("/sections", response_model=List[MovieSection])
def get_homepage_sections():
    """Generates all cinematic homepage discovery rows with transparent ranking rules."""
    weighted_top, _ = rec_engine.get_weighted_recommendations(limit=12)
    popular = rec_engine.get_most_popular(limit=12)
    hidden_gems = rec_engine.get_hidden_gems(limit=12)
    sci_fi = rec_engine.get_genre_picks("Sci-Fi", limit=12)
    action = rec_engine.get_genre_picks("Action", limit=12)
    comedy = rec_engine.get_genre_picks("Comedy", limit=12)
    thriller = rec_engine.get_genre_picks("Thriller", limit=12)

    sections = [
        MovieSection(
            id="popular_collection",
            title="Popular in Our Collection",
            description="Movies currently commanding high community interest and viewing frequency.",
            badge="Trending Score",
            movies=popular
        ),
        MovieSection(
            id="top_weighted",
            title="Critically Acclaimed (Weighted Rating)",
            description="Ranked using the IMDB weighted rating formula WR = (v/(v+m))*R + (m/(v+m))*C to filter low-vote bias.",
            badge="Formula Verified",
            movies=weighted_top
        ),
        MovieSection(
            id="hidden_gems",
            title="Hidden Gems",
            description="High user ratings (>= 7.2) with moderate vote counts (< 6,000) that deserve a wider spotlight.",
            badge="Underrated",
            movies=hidden_gems
        ),
        MovieSection(
            id="sci_fi",
            title="Science Fiction Worlds",
            description="Visions of distant galaxies, artificial minds, and mind-bending speculative realities.",
            badge="Sci-Fi",
            movies=sci_fi
        ),
        MovieSection(
            id="action",
            title="High-Octane Action",
            description="Spectacular choreography, thrilling chases, and relentless momentum.",
            badge="Action",
            movies=action
        ),
        MovieSection(
            id="thriller",
            title="Mystery & Psychological Thrillers",
            description="Tense narratives, unexpected revelations, and labyrinthine plot twists.",
            badge="Mystery",
            movies=thriller
        ),
        MovieSection(
            id="comedy",
            title="Comedy & Animation Favorites",
            description="Vibrant storytelling, witty humor, and heartwarming artistic journeys.",
            badge="Entertainment",
            movies=comedy
        ),
    ]
    return sections


@router.get("/search", response_model=List[MovieSummary])
def quick_search(q: str = Query(..., min_length=1, description="Movie title or keyword")):
    return dataset_service.search_movies(q, limit=10)


@router.get("/watchlist", response_model=WatchlistResponse)
def get_watchlist():
    items = watchlist_service.get_all_watchlist_items()
    return {
        "items": items,
        "total": len(items)
    }


@router.post("/watchlist", status_code=status.HTTP_201_CREATED)
def add_to_watchlist(payload: WatchlistCreate):
    movie = dataset_service.get_movie_by_id(payload.movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie does not exist in dataset.")
    success = watchlist_service.add_to_watchlist(payload.movie_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save movie to watchlist.")
    return {"message": "Movie successfully added to watchlist", "movie_id": payload.movie_id}


@router.delete("/watchlist/{movie_id}")
def remove_from_watchlist(movie_id: int):
    success = watchlist_service.remove_from_watchlist(movie_id)
    if not success:
        raise HTTPException(status_code=404, detail="Movie not found in watchlist.")
    return {"message": "Movie successfully removed from watchlist", "movie_id": movie_id}


@router.get("/analytics", response_model=AnalyticsOverview)
def get_analytics():
    df = dataset_service.get_all_movies_df()
    if df.empty:
        raise HTTPException(status_code=404, detail="No movie data available for analytics.")

    total = len(df)
    mean_rating = round(float(df["vote_average"].mean()), 2)
    min_rating = round(float(df["vote_average"].min()), 2)
    max_rating = round(float(df["vote_average"].max()), 2)
    avg_votes = round(float(df["vote_count"].mean()), 1)

    # Genre counts
    genre_map = {}
    for glist in df["genre_list"]:
        for g in glist:
            genre_map[g] = genre_map.get(g, 0) + 1
    genre_distribution = [
        GenreCount(genre=k, count=v)
        for k, v in sorted(genre_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # Rating distribution bins [0-5, 5-6, 6-7, 7-8, 8-9, 9-10]
    bins = [
        ("0.0 - 5.9", len(df[df["vote_average"] < 6.0])),
        ("6.0 - 6.9", len(df[(df["vote_average"] >= 6.0) & (df["vote_average"] < 7.0)])),
        ("7.0 - 7.9", len(df[(df["vote_average"] >= 7.0) & (df["vote_average"] < 8.0)])),
        ("8.0 - 8.4", len(df[(df["vote_average"] >= 8.0) & (df["vote_average"] < 8.5)])),
        ("8.5 - 10.0", len(df[df["vote_average"] >= 8.5])),
    ]
    rating_distribution = [RatingBin(range_label=b[0], count=b[1]) for b in bins]

    # Top by weighted rating vs top by popularity
    top_weighted, _ = rec_engine.get_weighted_recommendations(limit=10)
    top_weighted_list = [
        {"title": m["title"], "score": m.get("weighted_rating", m["vote_average"]), "votes": m["vote_count"]}
        for m in top_weighted
    ]

    top_pop = rec_engine.get_most_popular(limit=10)
    top_pop_list = [
        {"title": m["title"], "score": m["popularity"], "rating": m["vote_average"]}
        for m in top_pop
    ]

    # Scatter points (vote_average vs vote_count)
    m_val = float(df["vote_count"].quantile(0.60))
    C_val = mean_rating
    scatter_pts = []
    for _, r in df.iterrows():
        v = float(r["vote_count"])
        R = float(r["vote_average"])
        wr = (v / (v + m_val)) * R + (m_val / (v + m_val)) * C_val if (v + m_val) > 0 else C_val
        scatter_pts.append(
            ScatterPoint(
                movie_id=int(r["movie_id"]),
                title=str(r["title"]),
                vote_average=round(R, 2),
                vote_count=int(v),
                weighted_rating=round(wr, 2),
                popularity=round(float(r["popularity"]), 2)
            )
        )

    return AnalyticsOverview(
        total_movies=total,
        collection_mean_rating=mean_rating,
        min_rating=min_rating,
        max_rating=max_rating,
        average_vote_count=avg_votes,
        genre_distribution=genre_distribution,
        rating_distribution=rating_distribution,
        top_by_weighted=top_weighted_list,
        top_by_popularity=top_pop_list,
        scatter_data=scatter_pts
    )
