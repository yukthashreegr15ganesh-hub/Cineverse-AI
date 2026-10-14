from typing import List, Optional, Tuple, Dict, Any
import numpy as np
import pandas as pd
from app.services.dataset_service import DatasetService


class RecommendationEngine:
    def __init__(self, dataset_service: DatasetService):
        self.dataset_service = dataset_service

    def compute_weighted_rating_series(
        self,
        df: pd.DataFrame,
        m: float,
        C: float
    ) -> pd.Series:
        """
        Computes IMDB Weighted Rating (WR):
        WR = (v / (v + m)) * R + (m / (v + m)) * C
        Where:
        - v: number of votes for the movie
        - m: minimum vote threshold
        - R: movie's average rating
        - C: mean rating of the entire collection
        """
        v = df["vote_count"].astype(float)
        R = df["vote_average"].astype(float)

        # Avoid division by zero when both v and m are 0
        denominator = v + m
        # If denominator is 0, default to C
        mask_zero = denominator == 0

        wr = (v / denominator) * R + (m / denominator) * C
        wr = wr.mask(mask_zero, C)
        return wr

    def get_weighted_recommendations(
        self,
        m_threshold: Optional[float] = None,
        quantile: Optional[float] = 0.60,
        genre: Optional[str] = None,
        limit: int = 15
    ) -> Tuple[List[dict], Dict[str, Any]]:
        """
        Calculates and returns top movies ranked by Weighted Rating.
        Filters movies with vote_count >= m.
        """
        df = self.dataset_service.get_all_movies_df()

        if df.empty:
            return [], {
                "m_threshold": 0.0,
                "c_mean_rating": 0.0,
                "formula": "WR = (v / (v + m)) * R + (m / (v + m)) * C",
                "description": "Dataset is empty."
            }

        # Filter by genre if specified
        if genre and genre.strip() and genre.lower() != "all":
            g_target = genre.strip().lower()
            df = df[df["genre_list"].apply(lambda gl: any(g.lower() == g_target for g in gl))]

        if df.empty:
            return [], {
                "m_threshold": 0.0,
                "c_mean_rating": 0.0,
                "formula": "WR = (v / (v + m)) * R + (m / (v + m)) * C",
                "description": f"No movies found matching genre '{genre}'."
            }

        # Calculate C: mean rating across all movies in this collection
        C = float(df["vote_average"].mean())

        # Determine m threshold
        if m_threshold is not None and m_threshold > 0:
            m = float(m_threshold)
        elif quantile is not None:
            q = max(0.0, min(1.0, quantile))
            m = float(df["vote_count"].quantile(q))
        else:
            m = float(df["vote_count"].quantile(0.60))

        # Qualified movies must have at least m votes
        qualified = df[df["vote_count"] >= m].copy()

        # If strict m filters out everything, fall back to all movies
        if qualified.empty:
            qualified = df.copy()
            m = float(qualified["vote_count"].min())

        # Compute WR
        qualified["weighted_rating"] = self.compute_weighted_rating_series(qualified, m, C)

        # Deterministic sorting: weighted_rating descending, then vote_count descending, then movie_id ascending
        qualified = qualified.sort_values(
            by=["weighted_rating", "vote_count", "movie_id"],
            ascending=[False, False, True]
        )

        results = [self.dataset_service._row_to_dict(r) for _, r in qualified.head(limit).iterrows()]

        metrics = {
            "m_threshold": round(m, 2),
            "c_mean_rating": round(C, 2),
            "formula": "WR = (v / (v + m)) * R + (m / (v + m)) * C",
            "description": (
                f"Collection mean rating C = {C:.2f}. Minimum vote threshold m = {m:,.0f}. "
                f"Eligible movies with vote count >= {m:,.0f} are scored and ranked. "
                "Movies with fewer votes are shrunk towards the mean C to eliminate small-sample bias."
            )
        }

        return results, metrics

    def get_most_popular(self, limit: int = 15, genre: Optional[str] = None) -> List[dict]:
        """Rank movies purely by their popularity metric."""
        df = self.dataset_service.get_all_movies_df()
        if genre and genre.strip() and genre.lower() != "all":
            g_target = genre.strip().lower()
            df = df[df["genre_list"].apply(lambda gl: any(g.lower() == g_target for g in gl))]

        df = df.sort_values(by=["popularity", "vote_count"], ascending=[False, False])
        return [self.dataset_service._row_to_dict(r) for _, r in df.head(limit).iterrows()]

    def get_top_rated_raw(self, limit: int = 15, genre: Optional[str] = None) -> List[dict]:
        """Rank movies by raw vote_average with a mild minimum threshold (>= 1000 votes)."""
        df = self.dataset_service.get_all_movies_df()
        if genre and genre.strip() and genre.lower() != "all":
            g_target = genre.strip().lower()
            df = df[df["genre_list"].apply(lambda gl: any(g.lower() == g_target for g in gl))]

        # Filter out movies with negligible votes to keep ratings credible
        filtered = df[df["vote_count"] >= 1000]
        if filtered.empty:
            filtered = df

        filtered = filtered.sort_values(by=["vote_average", "vote_count"], ascending=[False, False])
        return [self.dataset_service._row_to_dict(r) for _, r in filtered.head(limit).iterrows()]

    def get_hidden_gems(self, limit: int = 15) -> List[dict]:
        """
        Discovers 'Hidden Gems': movies with strong ratings (>= 7.2)
        and moderate vote count (< 5000 votes), preventing blockbusters from dominating.
        """
        df = self.dataset_service.get_all_movies_df()
        gems = df[(df["vote_average"] >= 7.2) & (df["vote_count"] <= 6000) & (df["vote_count"] >= 500)].copy()

        if gems.empty:
            # Fallback to lower vote count partition
            gems = df[df["vote_average"] >= 7.0]

        gems = gems.sort_values(by=["vote_average", "popularity"], ascending=[False, False])
        return [self.dataset_service._row_to_dict(r) for _, r in gems.head(limit).iterrows()]

    def get_genre_picks(self, genre: str, limit: int = 15) -> List[dict]:
        """Returns popular movies belonging to a specific genre."""
        df = self.dataset_service.get_all_movies_df()
        g_target = genre.strip().lower()
        matched = df[df["genre_list"].apply(lambda gl: any(g.lower() == g_target for g in gl))].copy()

        matched = matched.sort_values(by=["popularity", "vote_average"], ascending=[False, False])
        return [self.dataset_service._row_to_dict(r) for _, r in matched.head(limit).iterrows()]

    def get_similar_by_genre(self, movie_id: int, limit: int = 6) -> List[dict]:
        """Finds movies sharing the maximum overlapping genres with the target movie."""
        target = self.dataset_service.get_movie_by_id(movie_id)
        if not target:
            return []

        target_genres = set(target["genres"])
        df = self.dataset_service.get_all_movies_df()
        # Exclude target movie itself
        df = df[df["movie_id"] != movie_id].copy()

        def compute_overlap(row_genres: list) -> int:
            return len(target_genres.intersection(set(row_genres)))

        df["overlap"] = df["genre_list"].apply(compute_overlap)
        # Filter where overlap > 0
        df = df[df["overlap"] > 0].sort_values(
            by=["overlap", "popularity", "vote_average"],
            ascending=[False, False, False]
        )

        return [self.dataset_service._row_to_dict(r) for _, r in df.head(limit).iterrows()]

    def explain_score(self, movie_id: int, m_threshold: Optional[float] = None) -> Optional[dict]:
        """Provides a complete transparent breakdown of the weighted rating calculation for a movie."""
        movie = self.dataset_service.get_movie_by_id(movie_id)
        if not movie:
            return None

        df = self.dataset_service.get_all_movies_df()
        C = float(df["vote_average"].mean())
        m = float(m_threshold) if m_threshold and m_threshold > 0 else float(df["vote_count"].quantile(0.60))

        v = float(movie["vote_count"])
        R = float(movie["vote_average"])

        denom = v + m
        weight_r = v / denom if denom > 0 else 0.0
        weight_c = m / denom if denom > 0 else 1.0
        wr = (weight_r * R) + (weight_c * C)

        return {
            "movie_id": movie_id,
            "title": movie["title"],
            "v_vote_count": v,
            "R_vote_average": R,
            "m_threshold": round(m, 2),
            "C_collection_mean": round(C, 2),
            "weight_R_percent": round(weight_r * 100, 1),
            "weight_C_percent": round(weight_c * 100, 1),
            "weighted_rating": round(wr, 3),
            "is_above_m_threshold": v >= m,
            "shrinkage_effect": (
                f"Because this movie has {int(v):,} votes compared to threshold m={int(m):,}, "
                f"{weight_r * 100:.1f}% of its score is determined by its user rating ({R:.1f}), "
                f"and {weight_c * 100:.1f}% is pulled towards the collection average ({C:.2f})."
            )
        }
