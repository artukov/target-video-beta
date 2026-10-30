import type { Episode, Genre, NarrationLine, RailGroup, Series } from './types';

export const EPISODE_PRICE = 10;

export const FEATURED_SERIES_ID = 'verbotene-liebe';

export const AVATAR = require('../../assets/posters/avatar.jpg');

export const GENRES: ('All' | Genre)[] = ['All', 'Romance', 'Drama', 'Action', 'Mystery', 'Fantasy'];

export const SERIES: Series[] = [
  {
    id: 'verbotene-liebe',
    title: 'Verbotene Liebe',
    tagline: "A CEO's dangerous secret contract.",
    synopsis:
      'Mia Winters signs a contract she was never meant to read. By day she is Alex Sterling’s assistant, by night his best-kept secret — and his rival wants them both gone.',
    genres: ['Romance', 'Drama'],
    tags: ['Romance', 'Drama', 'Billionaire'],
    rating: 4.8,
    ratingCount: '12k',
    year: 2024,
    episodeCount: 72,
    minutesPerEpisode: '2m/ep',
    pro: false,
    poster: require('../../assets/posters/verbotene-liebe.jpg'),
    playable: true,
  },
  {
    id: 'der-ceo-und-ich',
    title: 'Der CEO und ich',
    tagline: 'A forbidden empire. A dangerous love.',
    synopsis: 'A forbidden empire. A dangerous love.',
    genres: ['Romance', 'Drama'],
    tags: ['Romance', 'Billionaire'],
    rating: 4.7,
    ratingCount: '9k',
    year: 2024,
    episodeCount: 50,
    minutesPerEpisode: '2m/ep',
    pro: true,
    poster: require('../../assets/posters/der-ceo-und-ich.jpg'),
    playable: false,
  },
  {
    id: 'mein-geheimes-leben',
    title: 'Mein geheimes Leben',
    tagline: 'A thriller of masks and lies.',
    synopsis: 'A thriller of masks and lies.',
    genres: ['Mystery', 'Drama'],
    tags: ['Mystery', 'Thriller'],
    rating: 4.5,
    ratingCount: '6k',
    year: 2024,
    episodeCount: 30,
    minutesPerEpisode: '1m/ep',
    pro: false,
    poster: require('../../assets/posters/mein-geheimes-leben.jpg'),
    playable: false,
  },
  {
    id: 'liebe-auf-umwegen',
    title: 'Liebe auf Umwegen',
    tagline: 'A journey of intertwined hearts.',
    synopsis: 'A journey of intertwined hearts.',
    genres: ['Romance', 'Fantasy'],
    tags: ['Romance', 'Fantasy'],
    rating: 4.6,
    ratingCount: '7k',
    year: 2025,
    episodeCount: 65,
    minutesPerEpisode: '2m/ep',
    pro: true,
    poster: require('../../assets/posters/liebe-auf-umwegen.jpg'),
    playable: false,
  },
  {
    id: 'blutige-rosen',
    title: 'Blutige Rosen',
    tagline: 'Every rose has its price.',
    synopsis: 'Every rose has its price.',
    genres: ['Drama', 'Mystery'],
    tags: ['Drama', 'Revenge'],
    rating: 4.6,
    ratingCount: '8k',
    year: 2025,
    episodeCount: 80,
    minutesPerEpisode: '2m/ep',
    pro: true,
    poster: require('../../assets/posters/blutige-rosen.jpg'),
    playable: false,
  },
  {
    id: 'schattenkuss',
    title: 'Schattenkuss',
    tagline: 'A forbidden love story that defies the darkness.',
    synopsis: 'A forbidden love story that defies the darkness.',
    genres: ['Romance', 'Fantasy'],
    tags: ['Romance', 'Gothic'],
    rating: 4.7,
    ratingCount: '10k',
    year: 2024,
    episodeCount: 45,
    minutesPerEpisode: '1.5m/ep',
    pro: false,
    poster: require('../../assets/posters/schattenkuss.jpg'),
    playable: false,
  },
  {
    id: 'dunkle-begierde',
    title: 'Dunkle Begierde',
    tagline: 'A thriller of consuming passion.',
    synopsis: 'A thriller of consuming passion.',
    genres: ['Romance', 'Drama'],
    tags: ['Romance', 'Thriller'],
    rating: 4.5,
    ratingCount: '5k',
    year: 2025,
    episodeCount: 60,
    minutesPerEpisode: '2m/ep',
    pro: true,
    poster: require('../../assets/posters/dunkle-begierde.jpg'),
    playable: false,
  },
  {
    id: 'racheengel',
    title: 'Racheengel',
    tagline: 'She came back for one thing: revenge.',
    synopsis: 'She came back for one thing: revenge.',
    genres: ['Action', 'Fantasy'],
    tags: ['Action', 'Revenge'],
    rating: 4.8,
    ratingCount: '15k',
    year: 2025,
    episodeCount: 90,
    minutesPerEpisode: '2.5m/ep',
    pro: true,
    poster: require('../../assets/posters/racheengel.jpg'),
    playable: false,
  },
  {
    id: 'schicksalsband',
    title: 'Schicksalsband',
    tagline: 'Bound by fate, broken by secrets.',
    synopsis: 'Bound by fate, broken by secrets.',
    genres: ['Mystery', 'Fantasy'],
    tags: ['Mystery', 'Fantasy'],
    rating: 4.4,
    ratingCount: '4k',
    year: 2024,
    episodeCount: 25,
    minutesPerEpisode: '1m/ep',
    pro: false,
    poster: require('../../assets/posters/schicksalsband.jpg'),
    playable: false,
  },
  {
    id: 'zweite-chance',
    title: 'Zweite Chance',
    tagline: 'A new dawn. A new path.',
    synopsis: 'A new dawn. A new path.',
    genres: ['Drama', 'Romance'],
    tags: ['Drama', 'Romance'],
    rating: 4.6,
    ratingCount: '7k',
    year: 2025,
    episodeCount: 55,
    minutesPerEpisode: '2m/ep',
    pro: true,
    poster: require('../../assets/posters/zweite-chance.jpg'),
    playable: false,
  },
];

export const EPISODES: Episode[] = [
  {
    id: 'vl-ep1',
    seriesId: 'verbotene-liebe',
    number: 1,
    title: 'The Contract',
    durationSec: 20,
    access: { kind: 'free' },
    art: {
      poster: require('../../assets/video/vl-ep1-poster.jpg'),
      thumb: require('../../assets/video/vl-ep1-thumb.jpg'),
    },
    video: require('../../assets/video/vl-ep1.mp4'),
    // The stock footage has no dialogue, so the story is told in on-screen narration,
    // timed to the clip's two shots and its final second of black.
    narration: [
      { fromSec: 0.8, toSec: 5, text: 'Alex Sterling gave Mia a contract to sign.' },
      { fromSec: 5.6, toSec: 10.6, text: 'He never expected her to read it.' },
      { fromSec: 11.6, toSec: 15.4, text: 'Midnight. Mia reaches the last page.' },
      { fromSec: 15.8, toSec: 18.9, text: 'Now she knows what he’s hiding.' },
      { fromSec: 19, toSec: 20, text: 'To be continued…' },
    ],
  },
  {
    id: 'vl-ep2',
    seriesId: 'verbotene-liebe',
    number: 2,
    title: 'Secret Terms',
    durationSec: 22,
    access: { kind: 'coins', price: EPISODE_PRICE },
    art: {
      poster: require('../../assets/video/vl-ep2-poster.jpg'),
      thumb: require('../../assets/video/vl-ep2-thumb.jpg'),
    },
    video: require('../../assets/video/vl-ep2.mp4'),
    narration: [
      { fromSec: 0.8, toSec: 5.2, text: 'Across town, Alex’s rival signs a deal of her own.' },
      { fromSec: 6.4, toSec: 12.6, text: 'She wants Alex ruined, and Mia gone.' },
      { fromSec: 15, toSec: 19.6, text: 'A car is waiting outside Mia’s building.' },
      { fromSec: 20, toSec: 22, text: 'To be continued…' },
    ],
  },
  {
    id: 'vl-ep3',
    seriesId: 'verbotene-liebe',
    number: 3,
    title: 'The Price of Silence',
    durationSec: 24,
    access: { kind: 'coins', price: EPISODE_PRICE },
    art: {
      poster: require('../../assets/video/vl-ep3-poster.jpg'),
      thumb: require('../../assets/video/vl-ep3-thumb.jpg'),
    },
  },
];

export const RAIL_GROUPS: RailGroup[] = [
  {
    title: 'Romance',
    accent: 'gradient',
    rails: [
      { title: 'Trending Romance', seriesIds: ['der-ceo-und-ich', 'mein-geheimes-leben', 'liebe-auf-umwegen'] },
      { title: 'Forbidden Love', seriesIds: ['blutige-rosen', 'schattenkuss', 'dunkle-begierde'] },
    ],
  },
  {
    title: 'Popular Micro Dramas',
    accent: 'plain',
    rails: [{ title: 'Most Watched', seriesIds: ['racheengel', 'schicksalsband', 'zweite-chance'] }],
  },
];

export function getSeries(id: string | undefined): Series | undefined {
  return SERIES.find((series) => series.id === id);
}

export function getEpisode(id: string | undefined): Episode | undefined {
  return EPISODES.find((episode) => episode.id === id);
}

export function episodesOf(seriesId: string): Episode[] {
  return EPISODES.filter((episode) => episode.seriesId === seriesId).sort((a, b) => a.number - b.number);
}

export function nextEpisode(episode: Episode): Episode | undefined {
  return episodesOf(episode.seriesId).find((candidate) => candidate.number > episode.number);
}

export function previousEpisode(episode: Episode): Episode | undefined {
  return episodesOf(episode.seriesId)
    .filter((candidate) => candidate.number < episode.number)
    .at(-1);
}

export function narrationAt(episode: Episode, seconds: number): NarrationLine | undefined {
  return episode.narration?.find((line) => seconds >= line.fromSec && seconds < line.toSec);
}
