from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Cineverse AI"
    assert data["dataset_movies"] > 0


def test_get_genres():
    response = client.get("/api/genres")
    assert response.status_code == 200
    genres = response.json()
    assert isinstance(genres, list)
    assert "Sci-Fi" in genres or "Action" in genres


def test_get_movies_paginated():
    response = client.get("/api/movies?page=1&page_size=6")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 6
    assert data["total"] > 6
    assert data["page"] == 1


def test_get_movie_detail_and_404():
    # Valid movie
    response = client.get("/api/movies/1")
    assert response.status_code == 200
    movie = response.json()
    assert movie["movie_id"] == 1
    assert "title" in movie
    assert "genres" in movie
    assert "weighted_rating" in movie

    # Invalid movie 404
    resp_404 = client.get("/api/movies/999999")
    assert resp_404.status_code == 404


def test_weighted_recommendation_endpoint():
    response = client.get("/api/recommendations/weighted?limit=8")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "IMDb Weighted Rating (IMDb WR)"
    assert len(data["movies"]) <= 8
    assert "metrics" in data
    assert "formula" in data["metrics"]


def test_homepage_sections():
    response = client.get("/api/sections")
    assert response.status_code == 200
    sections = response.json()
    assert len(sections) >= 5
    ids = [s["id"] for s in sections]
    assert "popular_collection" in ids
    assert "top_weighted" in ids


def test_analytics_endpoint():
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_movies"] > 0
    assert len(data["genre_distribution"]) > 0
    assert len(data["rating_distribution"]) > 0
    assert len(data["scatter_data"]) > 0


def test_search_endpoint():
    response = client.get("/api/search?q=Dark")
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert any("dark" in r["title"].lower() for r in results)
