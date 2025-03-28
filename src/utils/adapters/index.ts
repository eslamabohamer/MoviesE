
// Export all adapters from this index file
export * from './contentBaseAdapter';
export * from './movieAdapter';
export * from './seriesAdapter';
export * from './episodeAdapter';
export * from './genreAdapter';
export * from './tmdbAdapter';
export * from './omdbAdapter';
export * from './contentWithDetailsAdapter';

// Export from supabaseContentAdapter with renamed functions to avoid naming conflicts
export { 
  mapAppContentToSupabaseContent,
  mapAppContentToSupabaseContent as mapAppToSupabaseContent,
  isValidContentType,
  ensureRequiredSupabaseFields,
  isTmdbStyleId,
  convertTmdbIdToUuid
} from './supabaseContentAdapter';
