import {
  Movie,
  MovieDetail,
  PaginatedMovies,
  RecommendationResponse,
  MovieSection,
  WatchlistResponse,
  AnalyticsOverview,
  ScoreExplanation,
} from '../types/movie';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `API Error ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) errorMsg = body.detail;
      else if (body.error) errorMsg = body.error;
    } catch {
      // Use fallback errorMsg
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  getHealth: () => fetchJson<{ status: string; dataset_movies: number; tmdb_adapter_active: boolean }>('/health'),

  getGenres: () => fetchJson<string[]>('/genres'),

  getMovies: (params: {
    q?: string;
    genre?: string;
    min_rating?: number;
    min_votes?: number;
    year?: number;
    sort_by?: string;
    order?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedMovies> => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.genre && params.genre !== 'All') searchParams.set('genre', params.genre);
    if (params.min_rating) searchParams.set('min_rating', params.min_rating.toString());
    if (params.min_votes) searchParams.set('min_votes', params.min_votes.toString());
    if (params.year) searchParams.set('year', params.year.toString());
    if (params.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params.order) searchParams.set('order', params.order);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.page_size) searchParams.set('page_size', params.page_size.toString());

    return fetchJson<PaginatedMovies>(`/movies?${searchParams.toString()}`);
  },

  getMovieDetail: (movieId: number): Promise<MovieDetail> => {
    return fetchJson<MovieDetail>(`/movies/${movieId}`);
  },

  getSimilarMovies: (movieId: number, limit = 6): Promise<Movie[]> => {
    return fetchJson<Movie[]>(`/movies/${movieId}/similar?limit=${limit}`);
  },

  getWeightedRecommendations: (params?: {
    m_threshold?: number;
    quantile?: number;
    genre?: string;
    limit?: number;
  }): Promise<RecommendationResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.m_threshold) searchParams.set('m_threshold', params.m_threshold.toString());
    if (params?.quantile !== undefined) searchParams.set('quantile', params.quantile.toString());
    if (params?.genre && params.genre !== 'All') searchParams.set('genre', params.genre);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return fetchJson<RecommendationResponse>(`/recommendations/weighted?${searchParams.toString()}`);
  },

  getPopularRecommendations: (limit = 12): Promise<Movie[]> => {
    return fetchJson<Movie[]>(`/recommendations/popular?limit=${limit}`);
  },

  getSections: (): Promise<MovieSection[]> => {
    return fetchJson<MovieSection[]>('/sections');
  },

  quickSearch: (query: string): Promise<Movie[]> => {
    if (!query.trim()) return Promise.resolve([]);
    return fetchJson<Movie[]>(`/search?q=${encodeURIComponent(query)}`);
  },

  getWatchlist: (): Promise<WatchlistResponse> => {
    return fetchJson<WatchlistResponse>('/watchlist');
  },

  addToWatchlist: (movieId: number): Promise<{ message: string; movie_id: number }> => {
    return fetchJson<{ message: string; movie_id: number }>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ movie_id: movieId }),
    });
  },

  removeFromWatchlist: (movieId: number): Promise<{ message: string; movie_id: number }> => {
    return fetchJson<{ message: string; movie_id: number }>(`/watchlist/${movieId}`, {
      method: 'DELETE',
    });
  },

  getAnalytics: (): Promise<AnalyticsOverview> => {
    return fetchJson<AnalyticsOverview>('/analytics');
  },

  explainScore: (movieId: number, m_threshold?: number): Promise<ScoreExplanation> => {
    const url = m_threshold ? `/recommendations/explain/${movieId}?m_threshold=${m_threshold}` : `/recommendations/explain/${movieId}`;
    return fetchJson<ScoreExplanation>(url);
  },
};
