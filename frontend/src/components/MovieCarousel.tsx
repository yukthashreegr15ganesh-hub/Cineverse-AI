import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';
import { PosterSkeleton } from './PosterSkeleton';

interface MovieCarouselProps {
  title: string;
  description?: string;
  badge?: string;
  movies: Movie[];
  watchlistIds?: Set<number>;
  onToggleWatchlist?: (movieId: number) => void;
  isLoading?: boolean;
  showWeightedScore?: boolean;
}

export const MovieCarousel: React.FC<MovieCarouselProps> = ({
  title,
  description,
  badge,
  movies,
  watchlistIds = new Set(),
  onToggleWatchlist,
  isLoading = false,
  showWeightedScore = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!isLoading && (!movies || movies.length === 0)) {
    return null;
  }

  return (
    <section className="relative my-8 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-display">
              {title}
            </h2>
            {badge && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {/* Scroll Nav Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#151928] hover:bg-purple-600/30 text-slate-300 hover:text-white border border-white/5 hover:border-purple-500/40 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#151928] hover:bg-purple-600/30 text-slate-300 hover:text-white border border-white/5 hover:border-purple-500/40 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 -mx-1"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <PosterSkeleton key={i} />)
          : movies.map((movie) => (
              <MovieCard
                key={movie.movie_id}
                movie={movie}
                isInWatchlist={watchlistIds.has(movie.movie_id)}
                onToggleWatchlist={onToggleWatchlist}
                showWeightedScore={showWeightedScore}
              />
            ))}
      </div>
    </section>
  );
};
