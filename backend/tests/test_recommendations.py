import pytest
import pandas as pd
from app.services.dataset_service import DatasetService
from app.services.recommendation_engine import RecommendationEngine


def test_weighted_rating_known_math():
    """Verify WR = (v / (v + m)) * R + (m / (v + m)) * C with hand-calculated test cases."""
    service = DatasetService()
    engine = RecommendationEngine(service)

    # Test Case 1: Equal weights (v = 1000, m = 1000, R = 8.0, C = 6.0) -> Expected: 7.0
    df = pd.DataFrame({
        "vote_count": [1000.0],
        "vote_average": [8.0]
    })
    result = engine.compute_weighted_rating_series(df, m=1000.0, C=6.0)
    assert pytest.approx(result.iloc[0], 0.001) == 7.0

    # Test Case 2: Extreme small sample bias (v = 10, m = 1000, R = 10.0, C = 6.0)
    # WR = (10 / 1010) * 10 + (1000 / 1010) * 6 = (100 / 1010) + (6000 / 1010) = 6100 / 1010 ≈ 6.0396
    # Shows the movie with 10.0 perfect rating gets pulled down close to the mean 6.0!
    df2 = pd.DataFrame({
        "vote_count": [10.0],
        "vote_average": [10.0]
    })
    result2 = engine.compute_weighted_rating_series(df2, m=1000.0, C=6.0)
    assert pytest.approx(result2.iloc[0], 0.001) == (6100.0 / 1010.0)

    # Test Case 3: Massive votes (v = 100,000, m = 1000, R = 8.5, C = 6.0) -> nearly 8.5
    df3 = pd.DataFrame({
        "vote_count": [100000.0],
        "vote_average": [8.5]
    })
    result3 = engine.compute_weighted_rating_series(df3, m=1000.0, C=6.0)
    expected3 = (100000 / 101000) * 8.5 + (1000 / 101000) * 6.0
    assert pytest.approx(result3.iloc[0], 0.001) == expected3


def test_empty_dataset_handling(tmp_path):
    """Engine gracefully handles empty dataset without crashing."""
    empty_csv = tmp_path / "empty.csv"
    empty_csv.write_text("movie_id,title,overview,genres,vote_average,vote_count,popularity\n")

    service = DatasetService(csv_path=str(empty_csv))
    engine = RecommendationEngine(service)

    recs, metrics = engine.get_weighted_recommendations()
    assert recs == []
    assert metrics["m_threshold"] == 0.0


def test_genre_filter_in_recommendations():
    service = DatasetService()
    engine = RecommendationEngine(service)

    recs, metrics = engine.get_weighted_recommendations(genre="Sci-Fi", limit=5)
    assert len(recs) > 0
    for movie in recs:
        assert any("sci-fi" in g.lower() for g in movie["genres"])


def test_explain_score_returns_accurate_components():
    service = DatasetService()
    engine = RecommendationEngine(service)

    # Check movie 1 (Inception)
    explanation = engine.explain_score(1)
    assert explanation is not None
    assert explanation["movie_id"] == 1
    assert "v_vote_count" in explanation
    assert "R_vote_average" in explanation
    assert "C_collection_mean" in explanation
    assert "weight_R_percent" in explanation
    assert "weight_C_percent" in explanation
    assert explanation["weight_R_percent"] + explanation["weight_C_percent"] == pytest.approx(100.0, 0.1)


def test_hidden_gems_criteria():
    service = DatasetService()
    engine = RecommendationEngine(service)

    gems = engine.get_hidden_gems(limit=10)
    assert len(gems) > 0
    for gem in gems:
        assert gem["vote_average"] >= 7.0
