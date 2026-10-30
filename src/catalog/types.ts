export type Access = { kind: 'free' } | { kind: 'coins'; price: number };

export type Genre = 'Romance' | 'Drama' | 'Action' | 'Mystery' | 'Fantasy';

export interface NarrationLine {
  fromSec: number;
  toSec: number;
  text: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  number: number;
  title: string;
  durationSec: number;
  access: Access;
  art: { poster: number; thumb: number };
  video?: number;
  narration?: NarrationLine[];
}

export interface Series {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  genres: Genre[];
  tags: string[];
  rating: number;
  ratingCount: string;
  year: number;
  episodeCount: number;
  minutesPerEpisode: string;
  pro: boolean;
  poster: number;
  playable: boolean;
}

export interface Rail {
  title: string;
  seriesIds: string[];
}

export interface RailGroup {
  title: string;
  accent: 'gradient' | 'plain';
  rails: Rail[];
}
