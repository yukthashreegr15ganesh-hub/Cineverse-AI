import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Film, ArrowRight, ShieldCheck } from 'lucide-react';
import { WatchlistItem } from '../types/movie';
import { MovieCard } from '../components/MovieCard';
import { api } from '../services/api';

interface WatchlistPageProps {
  watchlistIds: Set<number>;
  onToggleWatchlist: (movieId: number) => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  watchlistIds,
  onToggleWatchlist,
}) => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const res = await api.getWatchlist();
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [watchlistIds]);

  const validMovies = items.filter((item) => item.movie).map((item) => item.movie!);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-widest mb-1">
          <Bookmark className="w-4 h-4" />
          <span>Local Storage & SQLite Persistence</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white font-display">
              My Watchlist
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Saved movies are safely persisted into the local SQLite database. They will remain intact across browser refreshes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>{validMovies.length} Saved {validMovies.length === 1 ? 'Movie' : 'Movies'}</span>
          </div>
        </div>
      </div>

      {/* Grid or Empty State */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Loading saved watchlist records...</p>
        </div>
      ) : validMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {validMovies.map((movie) => (
            <div key={movie.movie_id} className="relative group">
              <MovieCard
                movie={movie}
                isInWatchlist={true}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl bg-[#0c101c] border border-white/5 space-y-4 max-w-xl mx-auto p-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            <Film className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white font-display">Your Watchlist is Empty</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Browse our curated collections, search for titles, and tap the bookmark icon on any movie card to pin it here for later.
          </p>
          <div className="pt-2">
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
