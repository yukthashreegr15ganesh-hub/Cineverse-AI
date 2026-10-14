import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { api } from './services/api';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());

  // Load persisted watchlist from SQLite on mount
  useEffect(() => {
    async function loadWatchlist() {
      try {
        const res = await api.getWatchlist();
        const ids = new Set(res.items.map((it) => it.movie_id));
        setWatchlistIds(ids);
      } catch (err) {
        console.error('Failed to load initial watchlist from SQLite:', err);
      }
    }
    loadWatchlist();
  }, []);

  // Global toggle handler
  const handleToggleWatchlist = async (movieId: number) => {
    const isCurrentlySaved = watchlistIds.has(movieId);
    // Optimistic update
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(movieId);
      else next.add(movieId);
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await api.removeFromWatchlist(movieId);
      } else {
        await api.addToWatchlist(movieId);
      }
    } catch (err) {
      console.error('Watchlist mutation failed, reverting:', err);
      // Revert on error
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(movieId);
        else next.delete(movieId);
        return next;
      });
    }
  };

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 selection:bg-purple-600 selection:text-white">
        <Navbar watchlistCount={watchlistIds.size} />
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  watchlistIds={watchlistIds}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              }
            />
            <Route
              path="/discover"
              element={
                <DiscoverPage
                  watchlistIds={watchlistIds}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              }
            />
            <Route
              path="/movie/:id"
              element={
                <MovieDetailPage
                  watchlistIds={watchlistIds}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              }
            />
            <Route
              path="/watchlist"
              element={
                <WatchlistPage
                  watchlistIds={watchlistIds}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              }
            />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
