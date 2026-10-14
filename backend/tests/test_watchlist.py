import pytest
from app.services.dataset_service import DatasetService
from app.services.watchlist_service import WatchlistService


@pytest.fixture
def temp_watchlist(tmp_path):
    db_file = tmp_path / "test_watchlist.db"
    dataset = DatasetService()
    service = WatchlistService(db_path=str(db_file), dataset_service=dataset)
    yield service
    service.clear()


def test_watchlist_add_and_retrieve(temp_watchlist):
    # Initially empty
    items = temp_watchlist.get_all_watchlist_items()
    assert len(items) == 0

    # Add movie 1
    success = temp_watchlist.add_to_watchlist(1)
    assert success is True
    assert temp_watchlist.is_in_watchlist(1) is True

    items = temp_watchlist.get_all_watchlist_items()
    assert len(items) == 1
    assert items[0]["movie_id"] == 1
    assert items[0]["movie"] is not None
    assert items[0]["movie"]["title"] == "Inception"


def test_watchlist_prevent_duplicate(temp_watchlist):
    temp_watchlist.add_to_watchlist(2)
    # Add again (INSERT OR IGNORE)
    temp_watchlist.add_to_watchlist(2)

    items = temp_watchlist.get_all_watchlist_items()
    assert len(items) == 1
    assert items[0]["movie_id"] == 2


def test_watchlist_remove(temp_watchlist):
    temp_watchlist.add_to_watchlist(3)
    assert temp_watchlist.is_in_watchlist(3) is True

    removed = temp_watchlist.remove_from_watchlist(3)
    assert removed is True
    assert temp_watchlist.is_in_watchlist(3) is False

    # Remove non-existent returns False
    removed_again = temp_watchlist.remove_from_watchlist(9999)
    assert removed_again is False
