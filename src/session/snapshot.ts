import type { Episode, Series } from '@/catalog/types';

export const SEED_COINS = 15;
export const STORAGE_KEY = 'dramaflash.session';

export interface EpisodeProgress {
  positionSec: number;
  completed: boolean;
}

export interface SessionSnapshotV1 {
  version: 1;
  coins: number;
  unlockedEpisodeIds: string[];
  progress: Record<string, EpisodeProgress>;
  lastEpisodeId: string | null;
  savedSeriesIds: string[];
}

interface Known {
  episodes: readonly Episode[];
  series: readonly Series[];
}

export function seedSnapshot(): SessionSnapshotV1 {
  return {
    version: 1,
    coins: SEED_COINS,
    unlockedEpisodeIds: [],
    progress: {},
    lastEpisodeId: null,
    savedSeriesIds: [],
  };
}

export function restoreSnapshot(raw: string | null, known: Known): SessionSnapshotV1 {
  if (raw === null) return seedSnapshot();

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return seedSnapshot();
  }

  if (!isRecord(data) || data.version !== 1) return seedSnapshot();
  const { coins, unlockedEpisodeIds, progress, lastEpisodeId, savedSeriesIds } = data;
  if (
    typeof coins !== 'number' ||
    !Number.isFinite(coins) ||
    !Array.isArray(unlockedEpisodeIds) ||
    !isRecord(progress) ||
    !(lastEpisodeId === null || typeof lastEpisodeId === 'string') ||
    !Array.isArray(savedSeriesIds)
  ) {
    return seedSnapshot();
  }

  const episodes = new Map(known.episodes.map((episode) => [episode.id, episode]));
  const seriesIds = new Set(known.series.map((series) => series.id));

  const restoredProgress: Record<string, EpisodeProgress> = {};
  for (const [id, entry] of Object.entries(progress)) {
    const episode = episodes.get(id);
    if (!episode || !isRecord(entry)) continue;
    if (typeof entry.positionSec !== 'number' || !Number.isFinite(entry.positionSec)) continue;
    restoredProgress[id] = {
      positionSec: Math.min(Math.max(entry.positionSec, 0), episode.durationSec),
      completed: entry.completed === true,
    };
  }

  return {
    version: 1,
    coins: Math.max(0, Math.floor(coins)),
    unlockedEpisodeIds: unique(
      unlockedEpisodeIds.filter(
        (id): id is string => typeof id === 'string' && episodes.get(id)?.access.kind === 'coins',
      ),
    ),
    progress: restoredProgress,
    lastEpisodeId: lastEpisodeId !== null && episodes.has(lastEpisodeId) ? lastEpisodeId : null,
    savedSeriesIds: unique(
      savedSeriesIds.filter((id): id is string => typeof id === 'string' && seriesIds.has(id)),
    ),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
