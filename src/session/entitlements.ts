import type { Episode } from '@/catalog/types';

import type { SessionSnapshotV1 } from './snapshot';

export type UnlockResult =
  | { kind: 'unlocked'; spent: number; balance: number }
  | { kind: 'already_entitled' }
  | { kind: 'requires_previous'; episodeId: string }
  | { kind: 'not_found' }
  | { kind: 'insufficient_funds'; price: number; balance: number; shortfall: number }
  | { kind: 'unavailable' };

export function canPlay(session: Pick<SessionSnapshotV1, 'unlockedEpisodeIds'>, episode: Episode): boolean {
  return episode.access.kind === 'free' || session.unlockedEpisodeIds.includes(episode.id);
}

export function unlockEpisode(
  session: SessionSnapshotV1,
  episodeId: string,
  episodes: readonly Episode[],
): { session: SessionSnapshotV1; result: UnlockResult } {
  const episode = episodes.find((candidate) => candidate.id === episodeId);
  if (!episode) return { session, result: { kind: 'not_found' } };
  if (episode.access.kind === 'free' || canPlay(session, episode)) {
    return { session, result: { kind: 'already_entitled' } };
  }

  const blocker = episodes
    .filter(
      (candidate) =>
        candidate.seriesId === episode.seriesId &&
        candidate.number < episode.number &&
        !canPlay(session, candidate),
    )
    .sort((a, b) => a.number - b.number)[0];
  if (blocker) return { session, result: { kind: 'requires_previous', episodeId: blocker.id } };

  const { price } = episode.access;
  if (session.coins < price) {
    return {
      session,
      result: { kind: 'insufficient_funds', price, balance: session.coins, shortfall: price - session.coins },
    };
  }
  // Checked after the balance, so an episode without video still shows the shortfall,
  // but coins are never spent on it.
  if (episode.video === undefined) return { session, result: { kind: 'unavailable' } };

  const next: SessionSnapshotV1 = {
    ...session,
    coins: session.coins - price,
    unlockedEpisodeIds: [...session.unlockedEpisodeIds, episode.id],
  };
  return { session: next, result: { kind: 'unlocked', spent: price, balance: next.coins } };
}
