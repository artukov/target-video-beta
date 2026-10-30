import { useVideoPlayer, type StatusChangeEventPayload, type VideoPlayer } from 'expo-video';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type PlayerPhase = 'loading' | 'ready' | 'buffering' | 'ended' | 'locked' | 'error';

type Intent = 'play' | 'pause' | 'ended';

// One playthrough of one source. Every load, replay or seek-from-ended gets a fresh
// object, and events that arrive for an older one are ignored.
interface Load {
  key: string;
  episodeId: string;
  startSec: number;
  revealAt: number;
  sourceSet: boolean;
  ready: boolean;
  timed: boolean;
  firstFrame: boolean;
  revealed: boolean;
  ended: boolean;
}

interface View {
  key: string;
  phase: Exclude<PlayerPhase, 'locked'>;
  revealed: boolean;
  position: number;
  duration: number;
  paused: boolean;
  busySeq: number;
}

interface Options {
  episodeId: string;
  source: number | undefined;
  startSec: number;
  durationHint: number;
  active: boolean;
  simulateFailure: boolean;
  onProgress: (episodeId: string, positionSec: number, completed: boolean) => void;
  onEnded: (episodeId: string) => void;
}

const BROKEN_SOURCE = { uri: 'file:///dramaflash/missing-episode.mp4' };
const PROGRESS_INTERVAL_MS = 5000;
const SPINNER_DELAY_MS = 250;
// A seek onto the very last frame can finish without `playToEnd`, so seeks stop just short.
const END_GUARD_SEC = 0.3;

const noLoad: Load = {
  key: '',
  episodeId: '',
  startSec: 0,
  revealAt: 0,
  sourceSet: false,
  ready: false,
  timed: false,
  firstFrame: false,
  revealed: false,
  ended: false,
};

// expo-video players are mutable native objects; writing their properties from component
// code trips the compiler's immutability check, so the writes live out here.
function setCurrentTime(player: VideoPlayer, seconds: number) {
  player.currentTime = seconds;
}

function setPlayerMuted(player: VideoPlayer, muted: boolean) {
  player.muted = muted;
}

function freshView(key: string, startSec: number, duration: number, busySeq = 0): View {
  return { key, phase: 'loading', revealed: false, position: startSec, duration, paused: false, busySeq };
}

export function useEpisodePlayer({
  episodeId,
  source,
  startSec,
  durationHint,
  active,
  simulateFailure,
  onProgress,
  onEnded,
}: Options) {
  const player = useVideoPlayer(null, (created) => {
    created.loop = false;
    created.timeUpdateEventInterval = 0.25;
  });

  const [attempt, setAttempt] = useState(0);
  const [appActive, setAppActive] = useState(true);
  const [muted, setMuted] = useState(false);
  const [spinnerKey, setSpinnerKey] = useState<string | null>(null);

  const loadKey = `${episodeId}|${source ?? 'none'}|${attempt}`;
  const [view, setView] = useState(() => freshView(loadKey, startSec, durationHint));
  if (view.key !== loadKey) {
    setView(freshView(loadKey, startSec, durationHint, view.busySeq + 1));
  }

  const load = useRef<Load>(noLoad);
  const intent = useRef<Intent>('pause');
  const position = useRef(0);
  const live = active && appActive;

  function update(target: Load, patch: Partial<View>) {
    setView((current) => (current.key === target.key ? { ...current, ...patch } : current));
  }

  function reveal(target: Load) {
    if (target.revealed) return;
    target.revealed = true;
    update(target, { revealed: true });
  }

  function saveProgress(target: Load) {
    if (target.ended || !target.timed) return;
    onProgress(target.episodeId, position.current, false);
  }

  const persist = useEffectEvent((target: Load) => saveProgress(target));

  const fail = useEffectEvent((target: Load, error?: unknown) => {
    if (__DEV__) console.warn(`[player] ${target.episodeId} failed`, error);
    update(target, { phase: 'error' });
  });

  const becomeReady = useEffectEvent((target: Load) => {
    if (target.ready) {
      update(target, { phase: target.ended ? 'ended' : 'ready' });
      return;
    }
    target.ready = true;
    const duration = player.duration > 0 ? player.duration : durationHint;
    if (target.startSec > 0) {
      setCurrentTime(player, Math.min(target.startSec, Math.max(0, duration - END_GUARD_SEC)));
    }
    update(target, { phase: 'ready', duration });
    if (intent.current === 'play' && live) player.play();
  });

  const startLoad = useEffectEvent(() => {
    const target: Load = {
      ...noLoad,
      key: loadKey,
      episodeId,
      startSec,
      revealAt: Math.max(0, startSec - 0.5),
    };
    load.current = target;
    position.current = 0;

    if (source === undefined) {
      if (__DEV__) console.log(`[player] ${episodeId} is locked, no source loaded`);
      intent.current = 'pause';
      player.pause();
      player.replaceAsync(null).catch(() => {});
      return;
    }

    intent.current = 'play';
    // Android keeps playing across a source change; stay paused until the start position is set.
    player.pause();
    const media = simulateFailure && attempt === 0 ? BROKEN_SOURCE : source;
    player.replaceAsync(media).then(
      () => {
        if (load.current !== target) return;
        target.sourceSet = true;
        if (player.status === 'readyToPlay') becomeReady(target);
        else if (player.status === 'error') fail(target);
      },
      (error) => {
        if (load.current === target) fail(target, error);
      },
    );
  });

  const onStatus = useEffectEvent(({ status, error }: StatusChangeEventPayload) => {
    const target = load.current;
    if (!target.sourceSet) return;
    if (status === 'readyToPlay') {
      becomeReady(target);
    } else if (status === 'loading' && target.ready && !target.ended) {
      setView((current) =>
        current.key === target.key && current.phase !== 'buffering'
          ? { ...current, phase: 'buffering', busySeq: current.busySeq + 1 }
          : current,
      );
    } else if (status === 'error') {
      fail(target, error);
    }
  });

  const onTime = useEffectEvent((currentTime: number) => {
    const target = load.current;
    if (!target.ready || target.ended) return;
    target.timed = true;
    position.current = currentTime;
    // The poster normally goes on the first rendered frame; if that event was missed,
    // visible progress past the start point is proof enough that frames are showing.
    if (currentTime >= target.revealAt && (target.firstFrame || currentTime > target.revealAt + 0.2)) {
      reveal(target);
    }
    update(target, { position: currentTime });
  });

  const onEnd = useEffectEvent(() => {
    const target = load.current;
    if (!target.ready || target.ended) return;
    if (player.duration > 0 && player.currentTime < player.duration - 1.5) return;
    target.ended = true;
    intent.current = 'ended';
    const duration = player.duration > 0 ? player.duration : durationHint;
    position.current = duration;
    update(target, { phase: 'ended', position: duration });
    onProgress(target.episodeId, duration, true);
    onEnded(target.episodeId);
  });

  // iOS stops AVPlayer on its own (audio interruption, headphones unplugged) without any
  // app-state change, so the paused state follows the player rather than only our own calls.
  const onPlaying = useEffectEvent((isPlaying: boolean) => {
    const target = load.current;
    if (!target.ready || target.ended) return;
    if (isPlaying) {
      update(target, { paused: false });
    } else if (
      live &&
      intent.current === 'play' &&
      player.status === 'readyToPlay' &&
      player.currentTime < player.duration - END_GUARD_SEC
    ) {
      update(target, { paused: true });
    }
  });

  const applyActivity = useEffectEvent(() => {
    const target = load.current;
    if (!live) {
      player.pause();
      persist(target);
      return;
    }
    if (intent.current === 'play' && target.ready && !target.ended) player.play();
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscriptions = [
      player.addListener('statusChange', (payload) => onStatus(payload)),
      player.addListener('timeUpdate', ({ currentTime }) => onTime(currentTime)),
      player.addListener('playToEnd', () => onEnd()),
      player.addListener('playingChange', ({ isPlaying }) => onPlaying(isPlaying)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [player]);

  const retire = useEffectEvent(() => {
    saveProgress(load.current);
    load.current = { ...noLoad };
  });

  useEffect(() => {
    startLoad();
    return () => retire();
  }, [loadKey]);

  useEffect(() => {
    applyActivity();
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const interval = setInterval(() => persist(load.current), PROGRESS_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [live]);

  const phase: PlayerPhase = source === undefined ? 'locked' : view.phase;
  const busyKey = phase === 'loading' || phase === 'buffering' ? `${loadKey}|${view.busySeq}` : null;

  useEffect(() => {
    if (!busyKey) return;
    const timer = setTimeout(() => setSpinnerKey(busyKey), SPINNER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [busyKey]);

  function replayFrom(seconds: number) {
    const previous = load.current;
    if (!previous.ready) return;
    const target: Load = {
      ...previous,
      startSec: 0,
      revealAt: 0,
      timed: false,
      ended: false,
    };
    load.current = target;
    intent.current = 'play';
    position.current = seconds;
    setCurrentTime(player, seconds);
    if (live) player.play();
    update(target, { phase: 'ready', position: seconds, paused: false });
  }

  function togglePlay() {
    const target = load.current;
    if (!target.ready) return;
    if (target.ended) {
      replayFrom(0);
      return;
    }
    if (intent.current === 'play' && (player.playing || view.phase === 'buffering')) {
      intent.current = 'pause';
      player.pause();
      saveProgress(target);
      update(target, { paused: true });
    } else {
      intent.current = 'play';
      if (live) player.play();
      update(target, { paused: false });
    }
  }

  function seekTo(seconds: number) {
    const target = load.current;
    if (!target.ready) return;
    const clamped = Math.min(Math.max(0, seconds), Math.max(0, view.duration - END_GUARD_SEC));
    if (target.ended) {
      replayFrom(clamped);
      return;
    }
    position.current = clamped;
    setCurrentTime(player, clamped);
    update(target, { position: clamped });
  }

  function toggleMuted() {
    setPlayerMuted(player, !muted);
    setMuted(!muted);
  }

  function handleFirstFrame() {
    const target = load.current;
    if (!target.sourceSet) return;
    target.firstFrame = true;
    if (position.current >= target.revealAt) reveal(target);
  }

  function stop() {
    saveProgress(load.current);
    player.pause();
  }

  return {
    player,
    phase,
    showPoster: !view.revealed,
    showSpinner: busyKey !== null && spinnerKey === busyKey,
    position: view.position,
    duration: view.duration,
    paused: view.paused,
    muted,
    togglePlay,
    seekTo,
    replay: () => replayFrom(0),
    retry: () => setAttempt((count) => count + 1),
    toggleMuted,
    stop,
    onFirstFrameRender: handleFirstFrame,
  };
}
