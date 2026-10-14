import React from 'react';
import { Film, Sparkles, Database, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-white/5 bg-[#05070a] text-slate-400 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <Film className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white font-display">
              CINEVERSE <span className="text-purple-400">AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Discover Beyond the Screen. A cinematic entertainment discovery platform powered by the IMDb Bayesian Weighted Rating algorithm. Designed to prevent low-sample skew and spotlight authentic movie consensus.
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs font-mono text-purple-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Project #21
            </span>
            <span>•</span>
            <span>Level 2 ML Portfolio</span>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Architecture Stack
          </h4>
          <ul className="text-xs space-y-1.5 text-slate-400">
            <li className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              React 18 & Vite & TypeScript
            </li>
            <li className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              FastAPI & Pydantic v2
            </li>
            <li className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              Pandas & SQLite Persistence
            </li>
            <li className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Bayesian Weighted Rating Engine
            </li>
          </ul>
        </div>

        {/* Data & Integrity Notice */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Data Attribution
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Movie metadata and poster paths are sourced from real TMDB assets. This product uses the TMDB API but is not certified or endorsed by TMDB. No metrics or ratings are fabricated.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
        <div>
          &copy; {new Date().getFullYear()} CINEVERSE AI. Built for Computer Science AI/ML Portfolio.
        </div>
        <div className="flex items-center gap-4">
          <span>Popularity-Based Recommendation</span>
          <span>•</span>
          <span>Zero Fabricated Data</span>
        </div>
      </div>
    </footer>
  );
};
