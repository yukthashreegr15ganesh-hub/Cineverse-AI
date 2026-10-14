import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, BookmarkCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Movie } from '../types/movie';
import { ImageWithFallback } from './ImageWithFallback';
import { formatYear, formatRating, getRatingColor } from '../utils/formatters';

interface MovieCardProps {
  movie: Movie;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (movieId: number) => void;
  showWeightedScore?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isInWatchlist = false,
  onToggleWatchlist,
  showWeightedScore = false,
}) => {
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWatchlist) {
      onToggleWatchlist(movie.movie_id);
    }
  };

  const primaryGenre = movie.genres && movie.genres.length > 0 ? movie.genres[0] : null;

  return (
    <div className="group relative flex-shrink-0 w-44 md:w-52 flex flex-col rounded-xl overflow-hidden bg-[#0c101c] border border-white/5 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
      {/* Poster Media */}
      <Link to={`/movie/${movie.movie_id}`} className="block relative aspect-[2/3] w-full overflow-hidden">
        <ImageWithFallback
          src={movie.poster_url}
          alt={movie.title}
          fallbackTitle={movie.title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Ambient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c101c] via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center pointer-events-none">
          {/* Rating Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold backdrop-blur-md border ${getRatingColor(
              movie.vote_average
            )}`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>{formatRating(movie.vote_average)}</span>
          </div>

          {/* Watchlist Quick Button */}
          <button
            type="button"
            onClick={handleWatchlistClick}
            aria-label={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            className={`pointer-events-auto w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 border ${
              isInWatchlist
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/80 border-white/10'
            }`}
          >
            {isInWatchlist ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Weighted Score or Popularity Tag if enabled */}
        {showWeightedScore && movie.weighted_rating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/90 text-purple-300 border border-purple-500/40 backdrop-blur-md">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            <span>WR {movie.weighted_rating.toFixed(2)}</span>
          </div>
        )}
      </Link>

      {/* Card Info Details */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-[#0b0e18]">
        <div>
          <Link
            to={`/movie/${movie.movie_id}`}
            className="text-sm font-semibold text-slate-100 hover:text-purple-400 transition-colors line-clamp-1 title-font"
            title={movie.title}
          >
            {movie.title}
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span>{formatYear(movie.release_date)}</span>
            {primaryGenre && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="truncate max-w-[85px]">{primaryGenre}</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3 text-purple-400" />
            {movie.popularity.toFixed(0)} pop
          </span>
          <span className="text-slate-400 font-mono">
            {movie.vote_count.toLocaleString()} votes
          </span>
        </div>
      </div>
    </div>
  );
};
