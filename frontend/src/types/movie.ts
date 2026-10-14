export interface Movie {
  movie_id: number;
  title: string;
  overview: string;
  genres: string[];
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path?: string;
  backdrop_path?: string;
  poster_url?: string;
  backdrop_url?: string;
  weighted_rating?: number;
}

export interface MovieDetail extends Movie {
  in_watchlist: boolean;
  data_source: 'sample_dataset' | 'tmdb_api';
}

export interface PaginatedMovies {
  items: Movie[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FormulaMetrics {
  m_threshold: number;
  c_mean_rating: number;
  formula: string;
  description: string;
}

export interface RecommendationResponse {
  algorithm: string;
  is_personalized: boolean;
  metrics: FormulaMetrics;
  total_eligible: number;
  movies: Movie[];
}

export interface MovieSection {
  id: string;
  title: string;
  description: string;
  badge?: string;
  movies: Movie[];
}

export interface WatchlistItem {
  movie_id: number;
  added_at: string;
  movie?: Movie;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  total: number;
}

export interface GenreCount {
  genre: string;
  count: number;
}

export interface RatingBin {
  range_label: string;
  count: number;
}

export interface ScatterPoint {
  movie_id: number;
  title: string;
  vote_average: number;
  vote_count: number;
  weighted_rating: number;
  popularity: number;
}

export interface AnalyticsOverview {
  total_movies: number;
  collection_mean_rating: number;
  min_rating: number;
  max_rating: number;
  average_vote_count: number;
  genre_distribution: GenreCount[];
  rating_distribution: RatingBin[];
  top_by_weighted: { title: string; score: number; votes: number }[];
  top_by_popularity: { title: string; score: number; rating: number }[];
  scatter_data: ScatterPoint[];
}

export interface ScoreExplanation {
  movie_id: number;
  title: string;
  v_vote_count: number;
  R_vote_average: number;
  m_threshold: number;
  C_collection_mean: number;
  weight_R_percent: number;
  weight_C_percent: number;
  weighted_rating: number;
  is_above_m_threshold: boolean;
  shrinkage_effect: string;
}
