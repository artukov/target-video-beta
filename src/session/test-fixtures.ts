import type { Access, Episode, Series } from '@/catalog/types';

function episode(number: number, access: Access): Episode {
  return {
    id: `ep${number}`,
    seriesId: 'show',
    number,
    title: `Episode ${number}`,
    durationSec: 20,
    access,
    art: { poster: 0, thumb: 0 },
    video: number,
  };
}

export const episodes: Episode[] = [
  episode(1, { kind: 'free' }),
  episode(2, { kind: 'coins', price: 10 }),
  episode(3, { kind: 'coins', price: 10 }),
];

export const series: Series[] = [
  {
    id: 'show',
    title: 'Show',
    tagline: '',
    synopsis: '',
    genres: ['Drama'],
    tags: [],
    rating: 4,
    ratingCount: '1k',
    year: 2024,
    episodeCount: 3,
    minutesPerEpisode: '1m/ep',
    pro: false,
    poster: 0,
    playable: true,
  },
];
