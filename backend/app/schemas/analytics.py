from typing import List, Dict, Any
from pydantic import BaseModel


class GenreCount(BaseModel):
    genre: str
    count: int


class RatingBin(BaseModel):
    range_label: str
    count: int


class ScatterPoint(BaseModel):
    movie_id: int
    title: str
    vote_average: float
    vote_count: int
    weighted_rating: float
    popularity: float


class AnalyticsOverview(BaseModel):
    total_movies: int
    collection_mean_rating: float
    min_rating: float
    max_rating: float
    average_vote_count: float
    genre_distribution: List[GenreCount]
    rating_distribution: List[RatingBin]
    top_by_weighted: List[Dict[str, Any]]
    top_by_popularity: List[Dict[str, Any]]
    scatter_data: List[ScatterPoint]
