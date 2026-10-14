from typing import Optional, Dict, Any, List
import httpx
from app.core.config import settings


class TMDBService:
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY.strip() if settings.TMDB_API_KEY else ""
        self.base_url = settings.TMDB_BASE_URL.rstrip("/")
        self.image_base_url = settings.TMDB_IMAGE_BASE_URL.rstrip("/")
        self.is_enabled = bool(self.api_key)

    async def get_movie_details(self, tmdb_id: int) -> Optional[Dict[str, Any]]:
        """Optionally fetch live movie details from TMDB if API key is provided."""
        if not self.is_enabled:
            return None

        url = f"{self.base_url}/movie/{tmdb_id}"
        headers = {"accept": "application/json"}
        params = {"api_key": self.api_key}

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url, headers=headers, params=params)
                if res.status_code == 200:
                    data = res.json()
                    poster_p = data.get("poster_path")
                    backdrop_p = data.get("backdrop_path")
                    return {
                        "movie_id": data.get("id"),
                        "title": data.get("title"),
                        "overview": data.get("overview", ""),
                        "genres": [g["name"] for g in data.get("genres", [])],
                        "release_date": data.get("release_date"),
                        "vote_average": data.get("vote_average", 0.0),
                        "vote_count": data.get("vote_count", 0),
                        "popularity": data.get("popularity", 0.0),
                        "poster_path": poster_p,
                        "backdrop_path": backdrop_p,
                        "poster_url": f"{self.image_base_url}/w500{poster_p}" if poster_p else "",
                        "backdrop_url": f"{self.image_base_url}/original{backdrop_p}" if backdrop_p else "",
                        "data_source": "tmdb_api"
                    }
        except Exception as e:
            print(f"TMDB API request failed: {e}")
            return None
        return None
