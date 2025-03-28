
import { Series as AppSeries, Content } from '@/types/content';
import { Content as SupabaseContent } from '@/types/supabase';
import { mapAppContentToSupabaseContent } from './contentBaseAdapter';

/**
 * Maps a series app content object to a Supabase content object
 */
export const mapAppSeriesToSupabaseContent = (series: AppSeries): Partial<SupabaseContent> => {
  const baseContent = mapAppContentToSupabaseContent(series);
  
  return {
    ...baseContent,
    seasons: series.seasons
  };
};
