import os
import re
from pathlib import Path
from typing import List, Optional, Tuple
import pandas as pd
import numpy as np

from app.core.config import settings
from app.schemas.movie import MovieSummary


class DatasetService:
    def __init__(self, csv_path: Optional[str] = None):
        self.csv_path = csv_path or settings.DATASET_PATH
        self.df: pd.DataFrame = pd.DataFrame()
        self._load_and_validate()

    def _load_and_validate(self):
        """Loads and sanitizes the movie dataset."""
        if not os.path.exists(self.csv_path):
            # Fallback to local default if specified file not found
            alt_path = Path(__file__).resolve().parent.parent.parent / "data" / "sample_movies.csv"
            if os.path.exists(alt_path):
                self.csv_path = str(alt_path)
            else:
                self.df = self._create_emergency_dataframe()
                return

        try:
            df = pd.read_csv(self.csv_path)
        except Exception as e:
            print(f"Error loading CSV {self.csv_path}: {e}")
            self.df = self._create_emergency_dataframe()
            return

        # Ensure required columns exist
        required_cols = [
            "movie_id", "title", "overview", "genres",
            "vote_average", "vote_count", "popularity"
        ]
        for col in required_cols:
            if col not in df.columns:
                df[col] = None

        # Clean duplicates based on movie_id
        df = df.drop_duplicates(subset=["movie_id"]).copy()

        # Numeric conversions and validations
        df["movie_id"] = pd.to_numeric(df["movie_id"], errors="coerce").fillna(0).astype(int)
        df = df[df["movie_id"] > 0]

        df["title"] = df["title"].fillna("Untitled Movie").astype(str)
        df["overview"] = df["overview"].fillna("No overview available.").astype(str)
        df["genres"] = df["genres"].fillna("Drama").astype(str)
        
        df["vote_average"] = pd.to_numeric(df["vote_average"], errors="coerce").fillna(5.0)
        df["vote_average"] = df["vote_average"].clip(0.0, 10.0)

        df["vote_count"] = pd.to_numeric(df["vote_count"], errors="coerce").fillna(0).astype(int)
        df["vote_count"] = df["vote_count"].clip(lower=0)

        df["popularity"] = pd.to_numeric(df["popularity"], errors="coerce").fillna(10.0)
        df["popularity"] = df["popularity"].clip(lower=0.0)

        # Release date validation
        if "release_date" not in df.columns:
            df["release_date"] = "2020-01-01"
        else:
            df["release_date"] = df["release_date"].fillna("2020-01-01").astype(str)

        if "poster_path" not in df.columns:
            df["poster_path"] = ""
        else:
            df["poster_path"] = df["poster_path"].fillna("").astype(str)

        if "backdrop_path" not in df.columns:
            df["backdrop_path"] = ""
        else:
            df["backdrop_path"] = df["backdrop_path"].fillna("").astype(str)

        # Build parsed genres list
        df["genre_list"] = df["genres"].apply(self._parse_genres)

        # Compute full URLs
        df["poster_url"] = df["poster_path"].apply(self._format_poster_url)
        df["backdrop_url"] = df["backdrop_path"].apply(self._format_backdrop_url)

        self.df = df.reset_index(drop=True)

    def _create_emergency_dataframe(self) -> pd.DataFrame:
        """Fallback in case no dataset exists at all."""
        data = {
            "movie_id": [1, 2],
            "title": ["Inception", "The Dark Knight"],
            "overview": ["A dream heist adventure.", "The Dark Knight faces the Joker."],
            "genres": ["Action|Sci-Fi", "Action|Crime"],
            "release_date": ["2010-07-16", "2008-07-18"],
            "vote_average": [8.4, 8.5],
            "vote_count": [34000, 30000],
            "popularity": [98.5, 105.2],
            "poster_path": ["/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", "/qJ2tW6WMUDux911r6m7haRef0WH.jpg"],
            "backdrop_path": ["/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg", "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg"],
        }
        df = pd.DataFrame(data)
        df["genre_list"] = df["genres"].apply(self._parse_genres)
        df["poster_url"] = df["poster_path"].apply(self._format_poster_url)
        df["backdrop_url"] = df["backdrop_path"].apply(self._format_backdrop_url)
        return df

    @staticmethod
    def _parse_genres(val: str) -> List[str]:
        if not val or not isinstance(val, str):
            return ["Drama"]
        parts = re.split(r"[|,;/]", val)
        return [p.strip() for p in parts if p.strip()]

    @staticmethod
    def _format_poster_url(path: str) -> str:
        if not path:
            return ""
        if path.startswith("http") or path.startswith("/posters/"):
            return path
        clean = path if path.startswith("/") else f"/{path}"
        return f"{settings.TMDB_IMAGE_BASE_URL}/w500{clean}"

    @staticmethod
    def _format_backdrop_url(path: str) -> str:
        if not path:
            return ""
        if path.startswith("http") or path.startswith("/posters/"):
            return path
        clean = path if path.startswith("/") else f"/{path}"
        return f"{settings.TMDB_IMAGE_BASE_URL}/original{clean}"

    def get_all_movies_df(self) -> pd.DataFrame:
        return self.df.copy()

    def get_all_genres(self) -> List[str]:
        all_genres = set()
        for g_list in self.df["genre_list"]:
            for g in g_list:
                all_genres.add(g)
        return sorted(list(all_genres))

    def get_movie_by_id(self, movie_id: int) -> Optional[dict]:
        match = self.df[self.df["movie_id"] == movie_id]
        if match.empty:
            return None
        row = match.iloc[0]
        return self._row_to_dict(row)

    def search_movies(self, query: str, limit: int = 15) -> List[dict]:
        if not query or not query.strip():
            return []
        q = query.strip().lower()
        matched = self.df[
            self.df["title"].str.lower().str.contains(q, regex=False) |
            self.df["overview"].str.lower().str.contains(q, regex=False)
        ].sort_values(by="popularity", ascending=False).head(limit)

        return [self._row_to_dict(r) for _, r in matched.iterrows()]

    def filter_movies(
        self,
        q: Optional[str] = None,
        genre: Optional[str] = None,
        min_rating: Optional[float] = None,
        min_votes: Optional[int] = None,
        year: Optional[int] = None,
        sort_by: str = "popularity",
        order: str = "desc",
        page: int = 1,
        page_size: int = 12
    ) -> Tuple[List[dict], int]:
        df = self.df.copy()

        if q and q.strip():
            query_lower = q.strip().lower()
            df = df[
                df["title"].str.lower().str.contains(query_lower, regex=False) |
                df["overview"].str.lower().str.contains(query_lower, regex=False)
            ]

        if genre and genre.strip() and genre.lower() != "all":
            g_target = genre.strip().lower()
            df = df[df["genre_list"].apply(lambda gl: any(g.lower() == g_target for g in gl))]

        if min_rating is not None and min_rating > 0:
            df = df[df["vote_average"] >= min_rating]

        if min_votes is not None and min_votes > 0:
            df = df[df["vote_count"] >= min_votes]

        if year is not None and year > 1900:
            df = df[df["release_date"].str.startswith(str(year))]

        ascending = order.lower() == "asc"
        if sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=ascending)
        elif sort_by == "release_date":
            df = df.sort_values(by="release_date", ascending=ascending)
        else:
            df = df.sort_values(by="popularity", ascending=ascending)

        total = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_df = df.iloc[start_idx:end_idx]

        return [self._row_to_dict(r) for _, r in page_df.iterrows()], total

    def _row_to_dict(self, row: pd.Series) -> dict:
        return {
            "movie_id": int(row["movie_id"]),
            "title": str(row["title"]),
            "overview": str(row["overview"]),
            "genres": list(row["genre_list"]),
            "release_date": str(row["release_date"]),
            "vote_average": round(float(row["vote_average"]), 2),
            "vote_count": int(row["vote_count"]),
            "popularity": round(float(row["popularity"]), 2),
            "poster_path": str(row.get("poster_path", "")),
            "backdrop_path": str(row.get("backdrop_path", "")),
            "poster_url": str(row.get("poster_url", "")),
            "backdrop_url": str(row.get("backdrop_url", "")),
            "weighted_rating": round(float(row["weighted_rating"]), 3) if "weighted_rating" in row and pd.notnull(row["weighted_rating"]) else None
        }
