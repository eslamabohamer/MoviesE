
export type Genre = {
  id: string;
  name: string;
  created_at: string;
};

export type Person = {
  id: string;
  name: string;
  photo_url?: string;
  bio?: string;
  created_at: string;
};

export type ContentType = 'movie' | 'series';

export type Content = {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  thumbnail_url: string;
  backdrop_url: string;
  release_year: number;
  rating: number;
  duration?: number;
  is_featured: boolean;
  seasons?: number;
  created_at: string;
  updated_at: string;
  video_url?: string;
  video_servers?: any;
};

export type ContentWithDetails = Content & {
  genres: Genre[];
  cast: (Person & { role: string })[];
};

export type Episode = {
  id: string;
  series_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  season: number;
  episode_number: number;
  duration: number;
  release_date?: string;
  created_at: string;
  updated_at: string;
};
