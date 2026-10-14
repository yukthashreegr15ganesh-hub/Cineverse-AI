import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { MovieCarousel } from '../components/MovieCarousel';
import { AlgorithmExplainerModal } from '../components/AlgorithmExplainerModal';
import { Movie, MovieSection } from '../types/movie';
import { api } from '../services/api';
import { Sparkles, Cpu } from 'lucide-react';

interface HomePageProps {
  watchlistIds: Set<number>;
  onToggleWatchlist: (movieId: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ watchlistIds, onToggleWatchlist }) => {
  const [sections, setSections] = useState<MovieSection[]>([]);
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [explainerOpen, setExplainerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeContent() {
      try {
        setIsLoading(true);
        const [sectionsData, popularData] = await Promise.all([
          api.getSections(),
          api.getPopularRecommendations(8),
        ]);
        if (isMounted) {
          setSections(sectionsData);
          setHeroMovies(popularData);
        }
      } catch (err) {
        console.error('Failed to load homepage sections:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadHomeContent();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e]">
      {/* Cinematic Hero */}
      <HeroBanner
        movies={heroMovies}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        onOpenExplainer={() => setExplainerOpen(true)}
      />

      {/* Algorithm Teaser Ribbon */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-transparent border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                Popularity-Weighted Recommendation Architecture
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Level 2 ML
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilizing Bayesian Shrinkage <code className="text-purple-300">WR = (v/(v+m))*R + (m/(v+m))*C</code> to eliminate low-vote statistical anomalies.
              </p>
            </div>
          </div>
          <button
            onClick={() => setExplainerOpen(true)}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Inspect Math Formula
          </button>
        </div>
      </div>

      {/* Dynamic Discovery Sections */}
      <div className="space-y-4 pt-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <MovieCarousel
                key={idx}
                title="Loading Curated Catalog..."
                movies={[]}
                isLoading={true}
              />
            ))
          : sections.map((sec) => (
              <MovieCarousel
                key={sec.id}
                title={sec.title}
                description={sec.description}
                badge={sec.badge}
                movies={sec.movies}
                watchlistIds={watchlistIds}
                onToggleWatchlist={onToggleWatchlist}
                showWeightedScore={sec.id === 'top_weighted'}
              />
            ))}
      </div>

      {/* Formula Explainer Modal */}
      <AlgorithmExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  );
};
