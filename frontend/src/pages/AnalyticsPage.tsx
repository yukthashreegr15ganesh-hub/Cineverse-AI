import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Star,
  Users,
  Layers,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { AnalyticsOverview } from '../types/movie';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-mono">Aggregating dataset distributions...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 max-w-xl mx-auto text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Analytics Unavailable</h2>
        <p className="text-xs text-slate-400">Could not retrieve dataset distribution statistics.</p>
      </div>
    );
  }

  const maxGenreCount = Math.max(...data.genre_distribution.map((g) => g.count), 1);
  const maxRatingBinCount = Math.max(...data.rating_distribution.map((r) => r.count), 1);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-10">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-widest mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Statistical Verification & Insights</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white font-display">
          Collection Analytics & ML Verification
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Empirical distributions of our movie dataset and transparent verification of the IMDb Bayesian Weighted Rating algorithm.
        </p>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Curated Movies</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white font-display">
            {data.total_movies}
          </div>
          <p className="text-[11px] text-slate-500">Deduplicated catalog</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mean Rating (C)</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white font-display">
            {data.collection_mean_rating.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Dataset baseline average</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Vote Count</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white font-display">
            {data.average_vote_count.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Community sample depth</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Rating Range</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white font-display">
            {data.min_rating.toFixed(1)} – {data.max_rating.toFixed(1)}
          </div>
          <p className="text-[11px] text-slate-500">Min to max rating in collection</p>
        </div>
      </div>

      {/* Conceptual Metric Distinction Guide */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#0d101c] to-transparent border border-purple-500/20 space-y-4">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Calculator className="w-5 h-5 text-purple-400" />
          Metric Conceptual Distinctions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <strong className="text-purple-300 block font-mono">1. Average Rating (R)</strong>
            <p className="text-slate-400 leading-relaxed">
              Arithmetic mean of all registered user review scores. Can be distorted by tiny sample sizes (e.g. 3 voters giving 10.0).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <strong className="text-purple-300 block font-mono">2. Weighted Rating (WR)</strong>
            <p className="text-slate-400 leading-relaxed">
              Bayesian shrinkage score combining R and collection mean C. Penalizes scarce votes and rewards verified high consensus.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <strong className="text-purple-300 block font-mono">3. Popularity Score</strong>
            <p className="text-slate-400 leading-relaxed">
              Continuous engagement momentum based on search volume, daily pageviews, and current viewing frequency in the collection.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <strong className="text-purple-300 block font-mono">4. Vote Count (v)</strong>
            <p className="text-slate-400 leading-relaxed">
              Total number of verified reviewer submissions. Serves as statistical confidence weight in the algorithm.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rating Distribution */}
        <div className="p-6 rounded-2xl bg-[#0c101c] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-display">
              Rating Distribution Bins
            </h3>
            <span className="text-xs text-slate-500 font-mono">Bin Counts</span>
          </div>

          <div className="space-y-3 pt-2">
            {data.rating_distribution.map((bin) => {
              const pct = (bin.count / maxRatingBinCount) * 100;
              return (
                <div key={bin.range_label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono">{bin.range_label}</span>
                    <span className="text-purple-400 font-mono font-bold">
                      {bin.count} {bin.count === 1 ? 'movie' : 'movies'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Genre Distribution */}
        <div className="p-6 rounded-2xl bg-[#0c101c] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-display">
              Movie Frequency by Genre
            </h3>
            <span className="text-xs text-slate-500 font-mono">Catalog Coverage</span>
          </div>

          <div className="space-y-3 pt-2 max-h-72 overflow-y-auto pr-1">
            {data.genre_distribution.slice(0, 10).map((g) => {
              const pct = (g.count / maxGenreCount) * 100;
              return (
                <div key={g.genre} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{g.genre}</span>
                    <span className="text-purple-400 font-mono font-bold">
                      {g.count} titles
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparison: Top Weighted vs Top Popularity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top 5 by Weighted Rating */}
        <div className="p-6 rounded-2xl bg-[#0c101c] border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold text-white font-display">
              Top Ranked: IMDb Weighted Rating (WR)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Penalizes low vote counts, ensuring established critical acclaim.
          </p>

          <div className="divide-y divide-white/5">
            {data.top_by_weighted.slice(0, 7).map((item, idx) => (
              <div key={item.title} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 font-mono text-purple-400 font-bold">{idx + 1}.</span>
                  <span className="text-white font-medium truncate max-w-[200px]">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400 text-[11px]">
                    {item.votes.toLocaleString()} votes
                  </span>
                  <span className="text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                    WR {item.score.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 by Popularity */}
        <div className="p-6 rounded-2xl bg-[#0c101c] border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold text-white font-display">
              Top Ranked: Popularity Metric
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Reflects immediate viewing activity, search demand, and momentum.
          </p>

          <div className="divide-y divide-white/5">
            {data.top_by_popularity.slice(0, 7).map((item, idx) => (
              <div key={item.title} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 font-mono text-purple-400 font-bold">{idx + 1}.</span>
                  <span className="text-white font-medium truncate max-w-[200px]">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-amber-400 text-[11px]">★ {item.rating.toFixed(1)}</span>
                  <span className="text-indigo-300 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                    {item.score.toFixed(0)} pop
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
