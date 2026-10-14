from typing import List, Optional
from pydantic import BaseModel, Field


class MovieBase(BaseModel):
    movie_id: int
    title: str
    overview: str
    genres: List[str]
    release_date: Optional[str] = None
    vote_average: float = Field(..., ge=0.0, le=10.0)
    vote_count: int = Field(..., ge=0)
    popularity: float = Field(..., ge=0.0)
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    weighted_rating: Optional[float] = None


class MovieSummary(MovieBase):
    pass


class MovieDetail(MovieBase):
    in_watchlist: bool = False
    data_source: str = "sample_dataset"  # "sample_dataset" or "tmdb_api"


class PaginatedMovies(BaseModel):
    items: List[MovieSummary]
    total: int
    page: int
    page_size: int
    total_pages: int
