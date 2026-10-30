import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';

import { EPISODES, SERIES } from '@/catalog/catalog';
import type { Episode } from '@/catalog/types';

import { canPlay, unlockEpisode, type UnlockResult } from './entitlements';
import { restoreSnapshot, seedSnapshot, STORAGE_KEY, type SessionSnapshotV1 } from './snapshot';

export type StorageStatus = 'ok' | 'read-failed' | 'write-failed';

interface SessionValue {
  session: SessionSnapshotV1;
  hydrated: boolean;
  storage: StorageStatus;
  canPlay: (episode: Episode) => boolean;
  unlock: (episodeId: string) => UnlockResult;
  recordProgress: (episodeId: string, positionSec: number, completed: boolean) => void;
  toggleSaved: (seriesId: string) => boolean;
  emptyWallet: () => void;
  resetDemo: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(seedSnapshot);
  const [hydrated, setHydrated] = useState(false);
  const [storage, setStorage] = useState<StorageStatus>('ok');
  // Actions read and write this ref synchronously, so a second tap in the same frame
  // already sees the first one's result.
  const latest = useRef(session);
  const ready = useRef(false);
  const writable = useRef(false);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    function apply(restored: SessionSnapshotV1, status: StorageStatus) {
      if (cancelled) return;
      latest.current = restored;
      ready.current = true;
      writable.current = status === 'ok';
      setSession(restored);
      setStorage(status);
      setHydrated(true);
    }
    // A save that exists but can't be read right now (e.g. storage still locked) is left
    // alone: the app runs on the seed for this launch instead of overwriting it.
    AsyncStorage.getItem(STORAGE_KEY).then(
      (raw) => apply(restoreSnapshot(raw, { episodes: EPISODES, series: SERIES }), 'ok'),
      () => apply(seedSnapshot(), 'read-failed'),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  function commit(next: SessionSnapshotV1) {
    if (!ready.current) return;
    latest.current = next;
    setSession(next);
    if (!writable.current) return;
    // Each queued write serialises whatever is newest when it runs, so a late progress
    // write can never put back a balance from before an unlock.
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latest.current)))
      .then(
        () => setStorage('ok'),
        (error) => {
          console.warn('Could not save the session', error);
          setStorage('write-failed');
        },
      );
  }

  function unlock(episodeId: string): UnlockResult {
    if (!ready.current) return { kind: 'not_found' };
    const { session: next, result } = unlockEpisode(latest.current, episodeId, EPISODES);
    if (result.kind === 'unlocked') commit(next);
    return result;
  }

  function recordProgress(episodeId: string, positionSec: number, completed: boolean) {
    const current = latest.current;
    const previous = current.progress[episodeId];
    if (
      current.lastEpisodeId === episodeId &&
      previous?.completed === completed &&
      Math.abs(previous.positionSec - positionSec) < 0.5
    ) {
      return;
    }
    commit({
      ...current,
      lastEpisodeId: episodeId,
      progress: { ...current.progress, [episodeId]: { positionSec, completed } },
    });
  }

  function toggleSaved(seriesId: string): boolean {
    const current = latest.current;
    const saved = current.savedSeriesIds.includes(seriesId);
    commit({
      ...current,
      savedSeriesIds: saved
        ? current.savedSeriesIds.filter((id) => id !== seriesId)
        : [...current.savedSeriesIds, seriesId],
    });
    return !saved;
  }

  function emptyWallet() {
    commit({ ...latest.current, coins: 0 });
  }

  function resetDemo() {
    commit(seedSnapshot());
  }

  const value: SessionValue = {
    session,
    hydrated,
    storage,
    canPlay: (episode) => canPlay(session, episode),
    unlock,
    recordProgress,
    toggleSaved,
    emptyWallet,
    resetDemo,
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
