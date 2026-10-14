import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Movie } from '../types/movie';
import { MovieCard } from '../components/MovieCard';
import { PosterSkeleton } from '../components/PosterSkeleton';
import { api } from '../services/api';

interface DiscoverPageProps {
  watchlistIds: Set<number>;
  onToggleWatchlist: (movieId: number) => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  watchlistIds,
  onToggleWatchlist,
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [minVotes, setMinVotes] = useState<number>(0);
  const [sortBy, setSortBy] = useState('popularity');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Load genres once
  useEffect(() => {
    async function loadGenres() {
      try {
        const list = await api.getGenres();
        setGenres(['All', ...list]);
      } catch (err) {
        console.error('Failed to load genres:', err);
      }
    }
    loadGenres();
  }, []);

  // Fetch movies when query or filters change
  useEffect(() => {
    let isMounted = true;
    async function fetchMovies() {
      try {
        setLoading(true);
        const data = await api.getMovies({
          q: query.trim() || undefined,
          genre: selectedGenre !== 'All' ? selectedGenre : undefined,
          min_rating: minRating > 0 ? minRating : undefined,
          min_votes: minVotes > 0 ? minVotes : undefined,
          sort_by: sortBy,
          order: 'desc',
          page,
          page_size: pageSize,
        });

        if (isMounted) {
          setMovies(data.items);
          setTotal(data.total);
          setTotalPages(data.total_pages);
        }
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchMovies();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, selectedGenre, minRating, minVotes, sortBy, page]);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedGenre('All');
    setMinRating(0);
    setMinVotes(0);
    setSortBy('popularity');
    setPage(1);
  };

  const hasActiveFilters =
    query !== '' ||
    selectedGenre !== 'All' ||
    minRating > 0 ||
    minVotes > 0 ||
    sortBy !== 'popularity';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-widest mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Curated Catalog & Exploration</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white font-display">
          Discover Movies
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Search, filter by genre and vote confidence, or reorder the catalog using IMDb Bayesian Weighted Rating calculations.
        </p>
      </div>

      {/* Control / Filter Bar */}
      <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5 shadow-xl space-y-4 mb-8">
        {/* Top Search & Sorters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, overview..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141928] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#141928] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="popularity">Most Popular (Trending)</option>
              <option value="weighted_rating">Weighted Rating (IMDb WR Formula)</option>
              <option value="vote_average">Highest Raw Rating</option>
              <option value="release_date">Release Date (Newest)</option>
              <option value="vote_count">Most Voted</option>
            </select>
          </div>

          {/* Reset Filters CTA */}
          <div className="md:col-span-3 flex justify-end">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Sliders for Min Rating & Min Votes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-white/5">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Minimum Rating</span>
              <span className="text-white font-mono font-bold">
                {minRating > 0 ? `${minRating.toFixed(1)} ★` : 'Any Rating'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="9.0"
              step="0.5"
              value={minRating}
              onChange={(e) => {
                setMinRating(parseFloat(e.target.value));
                setPage(1);
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Minimum Vote Count (m)</span>
              <span className="text-white font-mono font-bold">
                {minVotes > 0 ? `${minVotes.toLocaleString()} votes` : 'Any Count'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25000"
              step="1000"
              value={minVotes}
              onChange={(e) => {
                setMinVotes(parseInt(e.target.value));
                setPage(1);
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Genre Tags Scroll */}
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs text-slate-400 flex items-center gap-1 pr-1 flex-shrink-0">
              <Filter className="w-3 h-3 text-purple-400" /> Genres:
            </span>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGenre(g);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre === g
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#141928] text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/20'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Metrics */}
      <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
        <div>
          Showing <span className="text-white font-bold">{movies.length}</span> of{' '}
          <span className="text-white font-bold">{total}</span> matching movies
        </div>
        {sortBy === 'weighted_rating' && (
          <div className="flex items-center gap-1.5 text-purple-400 font-mono text-[11px] bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
            <Sparkles className="w-3 h-3" />
            Ranked via IMDb Weighted Rating Formula
          </div>
        )}
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <PosterSkeleton key={i} />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <div key={movie.movie_id} className="w-full">
              <MovieCard
                movie={movie}
                isInWatchlist={watchlistIds.has(movie.movie_id)}
                onToggleWatchlist={onToggleWatchlist}
                showWeightedScore={sortBy === 'weighted_rating'}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl bg-[#0c101c] border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Movies Match Your Criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your minimum rating, reducing the minimum vote count threshold, or clearing the search query.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2.5 rounded-xl bg-[#141928] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-600/30 border border-white/5 transition-all"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 font-mono">
            Page <span className="text-white font-bold">{page}</span> of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2.5 rounded-xl bg-[#141928] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-600/30 border border-white/5 transition-all"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
