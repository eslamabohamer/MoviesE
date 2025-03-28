
import { Episode as AppEpisode } from '@/types/content';
import { Episode as SupabaseEpisode } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Maps an app episode object to a Supabase episode object
 */
export const mapAppEpisodeToSupabaseEpisode = (episode: AppEpisode): Partial<SupabaseEpisode> => {
  return {
    id: episode.id && !episode.id.includes('temp-') ? episode.id : undefined,
    series_id: episode.seriesId,
    title: episode.title,
    description: episode.description,
    thumbnail_url: episode.thumbnailUrl,
    video_url: episode.videoUrl,
    season: episode.season,
    episode_number: episode.episodeNumber,
    duration: episode.duration,
    release_date: episode.releaseDate
  };
};

/**
 * Maps a Supabase episode object to an app episode object
 */
export const mapSupabaseEpisodeToAppEpisode = (episode: SupabaseEpisode): AppEpisode => {
  return {
    id: episode.id,
    title: episode.title,
    description: episode.description || '',
    season: episode.season,
    episodeNumber: episode.episode_number,
    thumbnailUrl: episode.thumbnail_url || '',
    videoUrl: episode.video_url || '',
    duration: episode.duration || 0,
    seriesId: episode.series_id,
    releaseDate: episode.release_date
  };
};

