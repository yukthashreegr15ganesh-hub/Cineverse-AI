import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Calendar,
  Users,
  Database,
  Calculator,
} from 'lucide-react';
import { MovieDetail, Movie, ScoreExplanation } from '../types/movie';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { MovieCard } from '../components/MovieCard';
import { api } from '../services/api';
import { formatYear, formatRating, getRatingColor } from '../utils/formatters';

interface MovieDetailPageProps {
  watchlistIds: Set<number>;
  onToggleWatchlist: (movieId: number) => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({
  watchlistIds,
  onToggleWatchlist,
}) => {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0', 10);

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [explanation, setExplanation] = useState<ScoreExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadMovieData() {
      if (!movieId) return;
      try {
        setLoading(true);
        setError(null);
        const [detailData, similarData, explainData] = await Promise.all([
          api.getMovieDetail(movieId),
          api.getSimilarMovies(movieId, 6),
          api.explainScore(movieId).catch(() => null),
        ]);

        if (isMounted) {
          setMovie(detailData);
          setSimilarMovies(similarData);
          setExplanation(explainData);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load movie details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMovieData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-mono">Loading movie records...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 max-w-xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <p className="text-sm text-slate-400">{error || 'Requested movie is not in our database.'}</p>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>
    );
  }

  const isInWatchlist = watchlistIds.has(movie.movie_id);

  return (
    <div className="min-h-screen pb-20 bg-[#07090e]">
      {/* Backdrop Header */}
      <div className="relative w-full h-[55vh] min-h-[420px] max-h-[600px] overflow-hidden">
        <ImageWithFallback
          src={movie.backdrop_url || movie.poster_url}
          alt={movie.title}
          fallbackTitle={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-black/40" />

        {/* Back Link */}
        <div className="absolute top-24 left-4 md:left-8 z-20">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 text-xs backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-44 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Poster Column */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="w-56 md:w-full mx-auto rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-900/20 bg-[#0d101c]">
              <div className="aspect-[2/3] w-full">
                <ImageWithFallback
                  src={movie.poster_url}
                  alt={movie.title}
                  fallbackTitle={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Watchlist CTA Button */}
            <div className="mt-4">
              <button
                onClick={() => onToggleWatchlist(movie.movie_id)}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isInWatchlist
                    ? 'bg-purple-950 text-purple-200 border border-purple-500 hover:bg-purple-900'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                }`}
              >
                {isInWatchlist ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-purple-400" />
                    In Your Watchlist
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Add to Watchlist
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metadata & Overview Column */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold border ${getRatingColor(
                    movie.vote_average
                  )}`}
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>{formatRating(movie.vote_average)}</span>
                </div>

                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  {formatYear(movie.release_date)}
                </span>

                <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  {movie.vote_count.toLocaleString()} votes
                </span>

                <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  Pop {movie.popularity.toFixed(1)}
                </span>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  <Database className="w-3 h-3 inline mr-1" />
                  {movie.data_source === 'tmdb_api' ? 'TMDB Live' : 'Curated Dataset'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-black text-white font-display">
                {movie.title}
              </h1>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-3">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                Synopsis
              </h3>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                {movie.overview}
              </p>
            </div>

            {/* Weighted Rating Formula Breakdown for this Movie */}
            {explanation && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c101c] to-[#121626] border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white font-display">
                      IMDb Weighted Rating Evaluation
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                      WR {explanation.weighted_rating.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {explanation.shrinkage_effect}
                </p>

                {/* Progress bar showing balance of Audience Rating vs Dataset Mean */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      Audience Rating R ({explanation.R_vote_average.toFixed(1)}):{' '}
                      <strong className="text-purple-300">{explanation.weight_R_percent}%</strong>
                    </span>
                    <span>
                      Dataset Mean C ({explanation.C_collection_mean.toFixed(2)}):{' '}
                      <strong className="text-amber-300">{explanation.weight_C_percent}%</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${explanation.weight_R_percent}%` }}
                      className="bg-purple-500 h-full"
                    />
                    <div
                      style={{ width: `${explanation.weight_C_percent}%` }}
                      className="bg-amber-500 h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Movies by Genre */}
        {similarMovies.length > 0 && (
          <div className="mt-16 pt-10 border-t border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white font-display">
                  Similar By Genre & Style
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Movies that share overlapping genres ({movie.genres.slice(0, 2).join(', ')}), ranked by audience popularity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {similarMovies.map((sim) => (
                <MovieCard
                  key={sim.movie_id}
                  movie={sim}
                  isInWatchlist={watchlistIds.has(sim.movie_id)}
                  onToggleWatchlist={onToggleWatchlist}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
