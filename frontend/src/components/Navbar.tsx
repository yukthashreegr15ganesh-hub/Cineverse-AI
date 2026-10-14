import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Film,
  Search,
  Bookmark,
  BarChart3,
  Compass,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { Movie } from '../types/movie';
import { api } from '../services/api';
import { ImageWithFallback } from './ImageWithFallback';
import { formatRating, formatYear } from '../utils/formatters';

interface NavbarProps {
  watchlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ watchlistCount }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Monitor scroll for navbar opacity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and search on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setQuery('');
  }, [location.pathname]);

  // Handle outside click to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await api.quickSearch(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timeout);
  }, [query]);

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Discover', path: '/discover', icon: Compass },
    { label: 'My Watchlist', path: '/watchlist', icon: Bookmark, badge: watchlistCount },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const handleSelectMovie = (id: number) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/movie/${id}`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#07090e]/95 backdrop-blur-md border-b border-white/5 py-3 shadow-xl'
          : 'bg-gradient-to-b from-[#07090e]/90 via-[#07090e]/40 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Wordmark Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-black tracking-tight text-white font-display flex items-center gap-1">
              CINEVERSE <span className="text-purple-400">AI</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 -mt-1 font-mono hidden sm:inline">
              Discover Beyond the Screen
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-white/10 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-purple-600 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-3" ref={searchContainerRef}>
          {/* Search Trigger / Input */}
          <div className="relative">
            <div
              className={`flex items-center rounded-full bg-slate-900/80 border transition-all ${
                searchOpen
                  ? 'w-64 md:w-80 border-purple-500/50 ring-2 ring-purple-500/20'
                  : 'w-10 md:w-56 border-white/10 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (!searchOpen) {
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }
                }}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Search movies"
              >
                <Search className="w-4 h-4" />
              </button>

              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search movies, genres..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                className={`bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none pr-3 py-2 w-full transition-opacity ${
                  searchOpen ? 'opacity-100' : 'hidden md:block opacity-60'
                }`}
              />

              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="pr-3 text-slate-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Search Dropdown Menu */}
            {searchOpen && query.trim().length > 0 && (
              <div className="absolute right-0 top-12 w-80 md:w-96 bg-[#0d111d] border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                <div className="p-2.5 border-b border-white/5 text-[11px] font-mono text-slate-400 flex justify-between items-center">
                  <span>Results for &ldquo;{query}&rdquo;</span>
                  {searching && <span className="text-purple-400 animate-pulse">Searching...</span>}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                  {searchResults.length > 0 ? (
                    searchResults.map((m) => (
                      <div
                        key={m.movie_id}
                        onClick={() => handleSelectMovie(m.movie_id)}
                        className="p-2.5 flex items-center gap-3 hover:bg-purple-950/30 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-slate-800">
                          <ImageWithFallback
                            src={m.poster_url}
                            alt={m.title}
                            fallbackTitle={m.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {m.title}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{formatYear(m.release_date)}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">★ {formatRating(m.vote_average)}</span>
                          </div>
                          <div className="text-[10px] text-purple-300 truncate mt-0.5">
                            {m.genres?.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : !searching ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching movies found in database.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0d16] border-b border-white/10 px-4 py-4 space-y-2 animate-fade-in">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-600 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
