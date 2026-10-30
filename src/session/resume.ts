import type { Episode } from '@/catalog/types';

import type { SessionSnapshotV1 } from './snapshot';

const REWIND_SEC = 1;

export interface ResumeTarget {
  episodeId: string;
  startSec: number;
  continuing: boolean;
}

type Viewing = Pick<SessionSnapshotV1, 'progress' | 'lastEpisodeId'>;

export function startPosition(session: Pick<SessionSnapshotV1, 'progress'>, episode: Episode): number {
  const progress = session.progress[episode.id];
  if (!progress || progress.completed) return 0;
  return Math.max(0, progress.positionSec - REWIND_SEC);
}

export function resumeTarget(
  session: Viewing,
  episodes: readonly Episode[],
  seriesId: string,
): ResumeTarget | undefined {
  const inSeries = episodes
    .filter((episode) => episode.seriesId === seriesId)
    .sort((a, b) => a.number - b.number);
  const first = inSeries[0];
  if (!first) return undefined;

  const last = inSeries.find((episode) => episode.id === session.lastEpisodeId);
  if (last && !session.progress[last.id]?.completed) {
    return { episodeId: last.id, startSec: startPosition(session, last), continuing: true };
  }

  const next = last && inSeries.find((episode) => episode.number > last.number);
  if (next) {
    return { episodeId: next.id, startSec: startPosition(session, next), continuing: true };
  }

  return { episodeId: first.id, startSec: startPosition(session, first), continuing: false };
}
