from typing import List, Optional
from pydantic import BaseModel
from app.schemas.movie import MovieSummary


class FormulaMetrics(BaseModel):
    m_threshold: float
    c_mean_rating: float
    formula: str = "WR = (v / (v + m)) * R + (m / (v + m)) * C"
    description: str = (
        "IMDb Weighted Rating algorithm: penalizes movies with very few votes by shrinking "
        "their score towards the collection mean rating C, while allowing movies with higher "
        "vote counts to be primarily driven by their true average rating R."
    )


class RecommendationResponse(BaseModel):
    algorithm: str
    is_personalized: bool = False
    metrics: FormulaMetrics
    total_eligible: int
    movies: List[MovieSummary]


class MovieSection(BaseModel):
    id: str
    title: str
    description: str
    badge: Optional[str] = None
    movies: List[MovieSummary]
