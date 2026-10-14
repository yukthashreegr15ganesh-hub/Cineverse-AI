import React from 'react';

export const PosterSkeleton: React.FC = () => {
  return (
    <div className="flex-shrink-0 w-44 md:w-52 rounded-xl overflow-hidden bg-[#0e121e] border border-white/5 animate-pulse">
      <div className="aspect-[2/3] bg-slate-800/40 w-full" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-800/60 rounded w-3/4" />
        <div className="flex justify-between items-center">
          <div className="h-3 bg-slate-800/40 rounded w-1/4" />
          <div className="h-3 bg-slate-800/40 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};
