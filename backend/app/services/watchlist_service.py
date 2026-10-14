import sqlite3
import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from app.core.config import settings
from app.services.dataset_service import DatasetService


class WatchlistService:
    def __init__(self, db_path: Optional[str] = None, dataset_service: Optional[DatasetService] = None):
        self.db_path = db_path or settings.DATABASE_PATH
        self.dataset_service = dataset_service
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS watchlist (
                    movie_id INTEGER PRIMARY KEY,
                    added_at TEXT NOT NULL
                )
            """)
            conn.commit()

    def add_to_watchlist(self, movie_id: int) -> bool:
        now_str = datetime.utcnow().isoformat() + "Z"
        try:
            with self._get_connection() as conn:
                conn.execute(
                    "INSERT OR IGNORE INTO watchlist (movie_id, added_at) VALUES (?, ?)",
                    (movie_id, now_str)
                )
                conn.commit()
            return True
        except Exception as e:
            print(f"Error adding to watchlist: {e}")
            return False

    def remove_from_watchlist(self, movie_id: int) -> bool:
        try:
            with self._get_connection() as conn:
                cursor = conn.execute("DELETE FROM watchlist WHERE movie_id = ?", (movie_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error removing from watchlist: {e}")
            return False

    def is_in_watchlist(self, movie_id: int) -> bool:
        with self._get_connection() as conn:
            row = conn.execute("SELECT 1 FROM watchlist WHERE movie_id = ?", (movie_id,)).fetchone()
            return row is not None

    def get_all_watchlist_items(self) -> List[dict]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT movie_id, added_at FROM watchlist ORDER BY added_at DESC").fetchall()

        items = []
        for r in rows:
            movie_id = int(r["movie_id"])
            movie_data = None
            if self.dataset_service:
                movie_data = self.dataset_service.get_movie_by_id(movie_id)
            items.append({
                "movie_id": movie_id,
                "added_at": r["added_at"],
                "movie": movie_data
            })
        return items

    def clear(self):
        """Helper for test suites."""
        with self._get_connection() as conn:
            conn.execute("DELETE FROM watchlist")
            conn.commit()
