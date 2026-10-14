import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showFallback = !src || error;

  if (showFallback) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-4 text-center select-none bg-gradient-to-br from-[#121624] via-[#1a2035] to-[#0c0e17] border border-white/5 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-2">
          <Film className="w-5 h-5 text-purple-400" />
        </div>
        <p className="text-xs font-semibold text-slate-300 line-clamp-2 px-1">
          {fallbackTitle || alt}
        </p>
        <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">
          Cineverse Media
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#101422] ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800/40 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
