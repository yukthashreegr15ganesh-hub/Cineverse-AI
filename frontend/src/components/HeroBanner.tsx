import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Movie } from '../types/movie';
import { ImageWithFallback } from './ImageWithFallback';
import { formatYear, formatRating, getRatingColor } from '../utils/formatters';

interface HeroBannerProps {
  movies: Movie[];
  watchlistIds?: Set<number>;
  onToggleWatchlist?: (movieId: number) => void;
  onOpenExplainer?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movies,
  watchlistIds = new Set(),
  onToggleWatchlist,
  onOpenExplainer,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const heroMovies = movies.slice(0, 5);
  const currentMovie = heroMovies[currentIndex] || movies[0];

  useEffect(() => {
    if (heroMovies.length <= 1 || isPaused) return;

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [heroMovies.length, isPaused]);

  if (!currentMovie) return null;

  const isInWatchlist = watchlistIds.has(currentMovie.movie_id);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
  };

  return (
    <div
      className="relative w-full h-[75vh] min-h-[500px] max-h-[700px] bg-[#07090e] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Backdrop with Gradient Overlays */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={currentMovie.backdrop_url || currentMovie.poster_url}
          alt={currentMovie.title}
          fallbackTitle={currentMovie.title}
          className="w-full h-full object-cover transform scale-105 transition-all duration-1000 ease-out"
        />
        {/* Gradients to guarantee text readability & blend seamlessly into dark background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/80 to-transparent w-full md:w-3/4" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end pb-16 px-4 md:px-8">
        <div className="max-w-2xl space-y-4 animate-fade-in">
          {/* Metadata Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold backdrop-blur-md border ${getRatingColor(
                currentMovie.vote_average
              )}`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{formatRating(currentMovie.vote_average)}</span>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-slate-200 backdrop-blur-md border border-white/10">
              {formatYear(currentMovie.release_date)}
            </span>

            <span className="text-xs text-slate-300 font-mono">
              {currentMovie.vote_count.toLocaleString()} community votes
            </span>

            {currentMovie.weighted_rating && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3 h-3" />
                WR {currentMovie.weighted_rating.toFixed(2)}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-display drop-shadow-md">
            {currentMovie.title}
          </h1>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 pt-1">
            {currentMovie.genres.map((g) => (
              <span
                key={g}
                className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-900/80 text-purple-300 border border-purple-500/20"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-sm md:text-base text-slate-300 line-clamp-3 leading-relaxed drop-shadow">
            {currentMovie.overview}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={`/movie/${currentMovie.movie_id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Explore Movie
            </Link>

            <button
              onClick={() => onToggleWatchlist && onToggleWatchlist(currentMovie.movie_id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm backdrop-blur-md transition-all border ${
                isInWatchlist
                  ? 'bg-purple-950/80 text-purple-200 border-purple-500/50 hover:bg-purple-900'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              {isInWatchlist ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-purple-400" />
                  Saved to Watchlist
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Add to Watchlist
                </>
              )}
            </button>

            {onOpenExplainer && (
              <button
                onClick={onOpenExplainer}
                title="View Weighted Algorithm Mechanics"
                className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
              >
                <Info className="w-3.5 h-3.5 text-purple-400" />
                <span>Algorithm Insight</span>
              </button>
            )}
          </div>
        </div>

        {/* Carousel Slide Indicators and Controls */}
        <div className="absolute bottom-6 right-4 md:right-8 flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            {heroMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-6 bg-purple-500' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              aria-label="Previous featured movie"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 hover:bg-purple-600/40 text-white border border-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next featured movie"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 hover:bg-purple-600/40 text-white border border-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
