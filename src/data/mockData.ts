import { Content, Movie, Series, Episode, Genre, GenreInput, convertGenreString } from '../types/content';

// Helper function to create genre objects for mock data
const createGenreObj = (name: string): Genre => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name
});

export const genres: Genre[] = [
  createGenreObj('Action'),
  createGenreObj('Adventure'),
  createGenreObj('Animation'),
  createGenreObj('Comedy'),
  createGenreObj('Crime'),
  createGenreObj('Documentary'),
  createGenreObj('Drama'),
  createGenreObj('Family'),
  createGenreObj('Fantasy'),
  createGenreObj('History'),
  createGenreObj('Horror'),
  createGenreObj('Music'),
  createGenreObj('Mystery'),
  createGenreObj('Romance'),
  createGenreObj('Science Fiction'),
  createGenreObj('Thriller'),
  createGenreObj('War'),
  createGenreObj('Western')
];

export const mockMovies: Movie[] = [
  {
    id: 'movie-1',
    type: 'movie',
    title: 'Cosmic Odyssey',
    description: 'A visionary journey through space and time as astronauts discover a mysterious artifact that challenges their understanding of reality.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596727147705-61a532a659bd?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920',
    releaseYear: 2023,
    genres: [createGenreObj('Science Fiction'), createGenreObj('Adventure'), createGenreObj('Drama')],
    rating: 4.8,
    duration: 142,
    cast: [
      { id: 'p1', name: 'Emma Rodriguez', role: 'Dr. Sarah Chen', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' },
      { id: 'p2', name: 'Michael Chen', role: 'Commander David Hayes', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' },
    ],
    isFeatured: true,
    tags: ['space', 'future', 'exploration'],
    videoUrl: 'https://example.com/videos/cosmic-odyssey.mp4'
  },
  {
    id: 'movie-2',
    type: 'movie',
    title: 'Midnight Shadows',
    description: 'A psychological thriller where a detective must solve a series of mysterious crimes while confronting his own dark past.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1626228094353-ed9db9a514fe?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1509442033968-705d78246544?q=80&w=1920',
    releaseYear: 2022,
    genres: [createGenreObj('Thriller'), createGenreObj('Crime'), createGenreObj('Mystery')],
    rating: 4.5,
    duration: 128,
    cast: [
      { id: 'p3', name: 'David Williams', role: 'Detective James Morgan', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' },
      { id: 'p4', name: 'Sophie Martinez', role: 'Dr. Emily Turner', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200' },
    ],
    isFeatured: true,
    tags: ['crime', 'suspense', 'detective'],
    videoUrl: 'https://example.com/videos/midnight-shadows.mp4'
  },
  {
    id: 'movie-3',
    type: 'movie',
    title: 'Eternal Echo',
    description: 'A heartfelt drama about love that transcends time, following two souls who find each other across different eras.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=1920',
    releaseYear: 2023,
    genres: [createGenreObj('Romance'), createGenreObj('Drama'), createGenreObj('Fantasy')],
    rating: 4.7,
    duration: 135,
    cast: [
      { id: 'p5', name: 'James Wilson', role: 'Thomas Reed', photo: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=200' },
      { id: 'p6', name: 'Emily Johnson', role: 'Claire Sullivan', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200' },
    ],
    isFeatured: false,
    tags: ['romance', 'time travel', 'destiny'],
    videoUrl: 'https://example.com/videos/eternal-echo.mp4'
  },
  {
    id: 'movie-4',
    type: 'movie',
    title: 'Urban Legends',
    description: 'A group of street dancers compete in an underground competition to save their community center.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620756236308-65c3ef5d25f3?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1920',
    releaseYear: 2022,
    genres: [createGenreObj('Music'), createGenreObj('Drama')],
    rating: 4.3,
    duration: 118,
    cast: [
      { id: 'p7', name: 'Tyler James', role: 'Marcus King', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200' },
      { id: 'p8', name: 'Zoe Carter', role: 'Alicia Rivera', photo: 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?q=80&w=200' },
    ],
    isFeatured: false,
    tags: ['dance', 'urban', 'competition'],
    videoUrl: 'https://example.com/videos/urban-legends.mp4'
  },
  {
    id: 'movie-5',
    type: 'movie',
    title: 'The Last Frontier',
    description: 'An epic western tale of survival and justice in the unforgiving American frontier.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1533593304781-3de9bd8361b3?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1478059299873-f047d8c5fe1a?q=80&w=1920',
    releaseYear: 2021,
    genres: [createGenreObj('Western'), createGenreObj('Drama'), createGenreObj('Action')],
    rating: 4.6,
    duration: 156,
    cast: [
      { id: 'p9', name: 'Robert Thompson', role: 'Marshal John Ford', photo: 'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?q=80&w=200' },
      { id: 'p10', name: 'Maria Gonzalez', role: 'Isabella Reyes', photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=200' },
    ],
    isFeatured: false,
    tags: ['western', 'frontier', 'survival'],
    videoUrl: 'https://example.com/videos/the-last-frontier.mp4'
  },
  {
    id: 'movie-6',
    type: 'movie',
    title: 'Digital Dreams',
    description: 'A visionary programmer creates an AI that begins to blur the line between virtual reality and the real world.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558481795-7f0a7c906f5e?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1920',
    releaseYear: 2023,
    genres: [createGenreObj('Science Fiction'), createGenreObj('Thriller')],
    rating: 4.4,
    duration: 133,
    cast: [
      { id: 'p11', name: 'Nathan Lee', role: 'Dr. Alex Kim', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200' },
      { id: 'p12', name: 'Olivia Walker', role: 'Eve (AI)', photo: 'https://images.unsplash.com/photo-1491349174775-aaafddd81942?q=80&w=200' },
    ],
    isFeatured: false,
    tags: ['AI', 'virtual reality', 'technology'],
    videoUrl: 'https://example.com/videos/digital-dreams.mp4'
  }
];

const createEpisodes = (seriesId: string, seasons: number): Episode[] => {
  const episodes: Episode[] = [];
  
  for (let season = 1; season <= seasons; season++) {
    const episodesPerSeason = 8 + Math.floor(Math.random() * 4); // 8-11 episodes per season
    
    for (let ep = 1; ep <= episodesPerSeason; ep++) {
      episodes.push({
        id: `${seriesId}-s${season}-e${ep}`,
        seriesId,
        season,
        episodeNumber: ep,
        title: `Episode ${ep}`,
        description: `This is episode ${ep} of season ${season}. An exciting new chapter in the story.`,
        thumbnailUrl: `https://images.unsplash.com/photo-${1500000000000 + season * 1000 + ep}?q=80&w=500`,
        duration: 40 + Math.floor(Math.random() * 15), // 40-55 minutes
        videoUrl: `https://example.com/videos/${seriesId}/s${season}/e${ep}.mp4`,
        releaseDate: `2023-${String(season + 1).padStart(2, '0')}-${String(ep * 3).padStart(2, '0')}`
      });
    }
  }
  
  return episodes;
};

export const mockSeries: Series[] = [
  {
    id: 'series-1',
    type: 'series',
    title: 'Chronicles of the Void',
    description: 'A space opera following the crew of the starship Nebula as they navigate political intrigue and cosmic threats.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=1920',
    releaseYear: 2022,
    genres: [createGenreObj('Science Fiction'), createGenreObj('Adventure'), createGenreObj('Drama')],
    rating: 4.9,
    seasons: 3,
    cast: [
      { id: 'p13', name: 'Alexander Chen', role: 'Captain Elias Vega', photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200' },
      { id: 'p14', name: 'Jasmine Taylor', role: 'Commander Aria Nova', photo: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?q=80&w=200' },
    ],
    isFeatured: true,
    tags: ['space', 'politics', 'adventure'],
    episodes: []
  },
  {
    id: 'series-2',
    type: 'series',
    title: 'Whispers in the Dark',
    description: 'A chilling anthology series exploring supernatural phenomena and the human psyche.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1604631832509-22dae89f8a1b?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1544985361-b420d7a77043?q=80&w=1920',
    releaseYear: 2021,
    genres: [createGenreObj('Horror'), createGenreObj('Mystery'), createGenreObj('Thriller')],
    rating: 4.7,
    seasons: 2,
    cast: [
      { id: 'p15', name: 'Daniel Brown', role: 'Various Characters', photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=200' },
      { id: 'p16', name: 'Isabella Moore', role: 'Various Characters', photo: 'https://images.unsplash.com/photo-1605405748313-a416a1b84491?q=80&w=200' },
    ],
    isFeatured: true,
    tags: ['horror', 'anthology', 'supernatural'],
    episodes: []
  },
  {
    id: 'series-3',
    type: 'series',
    title: 'Crown of Thorns',
    description: 'A historical drama set in medieval Europe, following the intrigue and politics of royal courts.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1572878298361-cf85335d5a2e?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1596152438143-705e77e5fe65?q=80&w=1920',
    releaseYear: 2020,
    genres: [createGenreObj('History'), createGenreObj('Drama')],
    rating: 4.6,
    seasons: 4,
    cast: [
      { id: 'p17', name: 'Richard Kent', role: 'King Edward IV', photo: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=200' },
      { id: 'p18', name: 'Catherine Lewis', role: 'Queen Eleanor', photo: 'https://images.unsplash.com/photo-1535468850893-dd9de95aa383?q=80&w=200' },
    ],
    isFeatured: false,
    tags: ['medieval', 'royalty', 'politics'],
    episodes: []
  },
  {
    id: 'series-4',
    type: 'series',
    title: 'Neon Streets',
    description: 'A cyberpunk noir series set in a dystopian future where technology rules and corporations hold power.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1569161031669-f19e70f84cee?q=80&w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1468436385273-8abca6dfd8d3?q=80&w=1920',
    releaseYear: 2023,
    genres: [createGenreObj('Science Fiction'), createGenreObj('Crime'), createGenreObj('Thriller')],
    rating: 4.8,
    seasons: 2,
    cast: [
      { id: 'p19', name: 'Vincent Gray', role: 'Detective Nyx', photo: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=200' },
      { id: 'p20', name: 'Luna Park', role: 'Iris (Hacker)', photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=200' },
    ],
    isFeatured: true,
    tags: ['cyberpunk', 'future', 'noir'],
    episodes: []
  }
];

// Populate episodes for each series
mockSeries.forEach(series => {
  series.episodes = createEpisodes(series.id, series.seasons);
});

export const mockContent: Content[] = [...mockMovies, ...mockSeries];

export const getFeaturedContent = (): Content[] => {
  return mockContent.filter(content => content.isFeatured);
};

export const getMovies = (): Movie[] => {
  return mockMovies;
};

export const getSeries = (): Series[] => {
  return mockSeries;
};

export const getContentById = (id: string): Content | undefined => {
  return mockContent.find(content => content.id === id);
};

export const getMovieById = (id: string): Movie | undefined => {
  return mockMovies.find(movie => movie.id === id);
};

export const getSeriesById = (id: string): Series | undefined => {
  return mockSeries.find(series => series.id === id);
};

export const getEpisodeById = (id: string): Episode | undefined => {
  for (const series of mockSeries) {
    const episode = series.episodes.find(ep => ep.id === id);
    if (episode) return episode;
  }
  return undefined;
};

export const getEpisodesBySeriesId = (seriesId: string): Episode[] => {
  const series = getSeriesById(seriesId);
  return series ? series.episodes : [];
};

export const getEpisodesBySeason = (seriesId: string, season: number): Episode[] => {
  const episodes = getEpisodesBySeriesId(seriesId);
  return episodes.filter(episode => episode.season === season);
};
