from typing import Optional
from pydantic import BaseModel
from app.schemas.movie import MovieSummary


class WatchlistCreate(BaseModel):
    movie_id: int


class WatchlistItem(BaseModel):
    movie_id: int
    added_at: str
    movie: Optional[MovieSummary] = None


class WatchlistResponse(BaseModel):
    items: list[WatchlistItem]
    total: int
