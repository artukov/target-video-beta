import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, isHiddenFromAccessibility, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import HomeScreen from '@/app/(tabs)/index';
import WatchRoute from '@/app/watch/[episodeId]';
import { getEpisode } from '@/catalog/catalog';
import { SessionProvider, useSession } from '@/session/SessionProvider';
import { seedSnapshot, STORAGE_KEY } from '@/session/snapshot';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const animation = { duration: () => animation };
  return { __esModule: true, default: { View }, FadeIn: animation, FadeInDown: animation, FadeInUp: animation, FadeOut: animation };
});
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

type Listener = (payload?: unknown) => void;

class FakePlayer {
  status = 'idle';
  playing = false;
  currentTime = 0;
  duration = 0;
  muted = false;
  loop = false;
  timeUpdateEventInterval = 0;
  playedFrom: number[] = [];
  listeners = new Map<string, Set<Listener>>();
  replaceAsync = jest.fn(async (source: unknown) => {
    this.status = source ? 'loading' : 'idle';
    this.currentTime = 0;
  });
  play = jest.fn(() => {
    this.playing = true;
    this.playedFrom.push(this.currentTime);
  });
  pause = jest.fn(() => {
    this.playing = false;
  });

  addListener(event: string, listener: Listener) {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener);
    this.listeners.set(event, set);
    return { remove: () => set.delete(listener) };
  }

  emit(event: string, payload?: unknown) {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  ready(duration: number) {
    this.duration = duration;
    this.status = 'readyToPlay';
    this.emit('statusChange', { status: 'readyToPlay' });
  }

  tick(seconds: number) {
    this.currentTime = seconds;
    this.emit('timeUpdate', { currentTime: seconds });
  }

  end() {
    this.currentTime = this.duration;
    this.emit('playToEnd');
  }

  fail() {
    this.status = 'error';
    this.emit('statusChange', { status: 'error', error: { message: 'missing file' } });
  }
}

let mockPlayer = new FakePlayer();

const mockRoute = (() => {
  let params: Record<string, string | undefined> = {};
  const listeners = new Set<() => void>();
  return {
    get: () => params,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open: (next: Record<string, string | undefined>) => {
      params = next;
    },
    router: {
      setParams: jest.fn((patch: Record<string, string | undefined>) => {
        params = { ...params, ...patch };
        listeners.forEach((listener) => listener());
      }),
      back: jest.fn(),
      canGoBack: () => true,
      replace: jest.fn(),
      navigate: jest.fn(),
      push: jest.fn(),
    },
  };
})();

jest.mock('expo-router', () => {
  const { useSyncExternalStore } = require('react');
  return {
    useLocalSearchParams: () => useSyncExternalStore(mockRoute.subscribe, mockRoute.get),
    useIsFocused: () => true,
    useRouter: () => mockRoute.router,
  };
});

jest.mock('expo-video', () => {
  const { createElement } = require('react');
  const { View } = require('react-native');
  return {
    useVideoPlayer: () => mockPlayer,
    VideoView: () => createElement(View, { testID: 'video' }),
  };
});

const episode1 = getEpisode('vl-ep1')!;
const episode2 = getEpisode('vl-ep2')!;

function Hydrated({ children }: { children: ReactNode }) {
  return useSession().hydrated ? children : null;
}

async function open(params: Record<string, string>) {
  mockRoute.open(params);
  await render(
    <SessionProvider>
      <Hydrated>
        <WatchRoute />
      </Hydrated>
    </SessionProvider>,
  );
  await waitFor(() => expect(mockPlayer.replaceAsync).toHaveBeenCalled());
}

async function playerEvent(run: () => void) {
  await act(async () => run());
}

async function savedSession() {
  return JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? 'null');
}

const midEpisode2 = {
  ...seedSnapshot(),
  coins: 5,
  unlockedEpisodeIds: ['vl-ep2'],
  progress: { 'vl-ep1': { positionSec: 20, completed: true }, 'vl-ep2': { positionSec: 8, completed: false } },
  lastEpisodeId: 'vl-ep2',
};

beforeEach(async () => {
  mockPlayer = new FakePlayer();
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  await AsyncStorage.clear();
});

it('locks the next episode at the cliffhanger and plays it after one unlock', async () => {
  await open({ episodeId: 'vl-ep1' });
  expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith(episode1.video);

  await playerEvent(() => mockPlayer.ready(20));
  expect(mockPlayer.play).toHaveBeenCalledTimes(1);

  await playerEvent(() => mockPlayer.tick(17));
  expect(screen.getByText('Now she knows what he’s hiding.')).toBeOnTheScreen();
  expect(mockRoute.router.setParams).not.toHaveBeenCalled();

  await playerEvent(() => mockPlayer.end());
  expect(mockRoute.router.setParams).toHaveBeenCalledWith({ episodeId: 'vl-ep2', start: undefined, fail: undefined });
  expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith(null);
  expect(mockPlayer.replaceAsync).not.toHaveBeenCalledWith(episode2.video);
  expect(screen.getByText('Continue the romance')).toBeOnTheScreen();

  await fireEvent.press(screen.getByText('Unlock for 10 coins'));

  expect(screen.getByText('Episode 2 unlocked · 5 coins left')).toBeOnTheScreen();
  expect(screen.queryByText('Continue the romance')).not.toBeOnTheScreen();
  await waitFor(() => expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith(episode2.video));
  await playerEvent(() => mockPlayer.ready(22));
  expect(mockPlayer.play).toHaveBeenCalledTimes(2);

  await waitFor(async () =>
    expect(await savedSession()).toMatchObject({
      coins: 5,
      unlockedEpisodeIds: ['vl-ep2'],
      progress: { 'vl-ep1': { completed: true } },
    }),
  );
});

it('shows the 5-coin shortfall for Episode 3 without promising that more coins would play it', async () => {
  await open({ episodeId: 'vl-ep1' });
  await playerEvent(() => mockPlayer.ready(20));
  await playerEvent(() => mockPlayer.end());
  await fireEvent.press(screen.getByText('Unlock for 10 coins'));
  await waitFor(() => expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith(episode2.video));
  await playerEvent(() => mockPlayer.ready(22));

  await playerEvent(() => mockPlayer.end());

  expect(mockRoute.router.setParams).toHaveBeenLastCalledWith({ episodeId: 'vl-ep3', start: undefined, fail: undefined });
  expect(screen.getByText('The demo ends before “The Price of Silence”.')).toBeOnTheScreen();
  expect(screen.getByText('Episode 3 has no video in this prototype, so more coins wouldn’t unlock it.')).toBeOnTheScreen();
  expect(screen.queryByText('Top-ups aren’t part of this prototype.')).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Need 5 more coins' })).toBeDisabled();
});

it('never sells or loads Episode 3, which has no video, even when the wallet could pay', async () => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...midEpisode2,
      coins: 25,
      progress: { ...midEpisode2.progress, 'vl-ep2': { positionSec: 22, completed: true } },
    }),
  );
  await open({ episodeId: 'vl-ep3' });

  expect(screen.getByText('Episode 3 has no video in this prototype, so it can’t be unlocked.')).toBeOnTheScreen();
  const button = screen.getByRole('button', { name: 'Not in this prototype' });
  expect(button).toBeDisabled();
  await fireEvent.press(button);

  expect(screen.getByLabelText('Your balance: 25 coins')).toBeOnTheScreen();
  expect(mockPlayer.replaceAsync).toHaveBeenCalledTimes(1);
  expect(mockPlayer.replaceAsync).toHaveBeenCalledWith(null);
  expect((await savedSession()).unlockedEpisodeIds).toEqual(['vl-ep2']);
});

it('shows only the gate for a locked deep link and never loads its media', async () => {
  await open({ episodeId: 'vl-ep2' });

  expect(mockPlayer.replaceAsync).toHaveBeenCalledTimes(1);
  expect(mockPlayer.replaceAsync).toHaveBeenCalledWith(null);
  expect(screen.getByText('Continue the romance')).toBeOnTheScreen();
  expect(isHiddenFromAccessibility(screen.getByTestId('video', { includeHiddenElements: true }))).toBe(true);
  expect(mockPlayer.play).not.toHaveBeenCalled();
});

it('keeps the gate after Maybe Later and offers the unlock again', async () => {
  await open({ episodeId: 'vl-ep2' });

  await fireEvent.press(screen.getByText('Maybe Later'));
  expect(screen.queryByText('Continue the romance')).not.toBeOnTheScreen();
  expect(screen.getByText('Watch Episode 1')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Unlock Episode 2' }));
  expect(screen.getByText('Continue the romance')).toBeOnTheScreen();
  expect((await savedSession())?.coins ?? 15).toBe(15);
});

it('locks exactly once per playthrough, and a replay arms the lock again without charging', async () => {
  await open({ episodeId: 'vl-ep1' });
  await playerEvent(() => mockPlayer.ready(20));

  await playerEvent(() => {
    mockPlayer.end();
    mockPlayer.end();
  });
  await playerEvent(() => mockPlayer.tick(3));
  expect(mockRoute.router.setParams).toHaveBeenCalledTimes(1);

  await fireEvent.press(screen.getByText('Maybe Later'));
  await fireEvent.press(screen.getByText('Replay Episode 1'));
  expect(mockRoute.router.setParams).toHaveBeenLastCalledWith({ episodeId: 'vl-ep1', start: undefined, fail: undefined });
  await waitFor(() => expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith(episode1.video));
  await playerEvent(() => mockPlayer.ready(20));
  expect(mockPlayer.playedFrom.at(-1)).toBe(0);

  await playerEvent(() => mockPlayer.end());
  expect(mockRoute.router.setParams).toHaveBeenCalledTimes(3);
  expect(screen.getByText('Continue the romance')).toBeOnTheScreen();
  expect((await savedSession())?.coins).toBe(15);
  expect((await savedSession())?.progress['vl-ep2']).toBeUndefined();
});

it('seeks to the requested start before it presses play', async () => {
  await open({ episodeId: 'vl-ep1', start: '16' });

  await playerEvent(() => mockPlayer.ready(20));

  expect(mockPlayer.playedFrom).toEqual([16]);
});

it('recovers from a playback error with Retry', async () => {
  await open({ episodeId: 'vl-ep1', fail: '1' });
  expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith({ uri: expect.stringContaining('missing') });

  await playerEvent(() => mockPlayer.fail());
  expect(screen.getByText('This episode didn’t load')).toBeOnTheScreen();

  await fireEvent.press(screen.getByText('Retry'));
  await waitFor(() => expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith(episode1.video));
  await playerEvent(() => mockPlayer.ready(20));
  expect(screen.queryByText('This episode didn’t load')).not.toBeOnTheScreen();
  expect(mockPlayer.play).toHaveBeenCalledTimes(1);
});

it('saves the position when the player closes and resumes a second earlier next time', async () => {
  await open({ episodeId: 'vl-ep1' });
  await playerEvent(() => mockPlayer.ready(20));
  await playerEvent(() => mockPlayer.tick(12));

  await fireEvent.press(screen.getByRole('button', { name: 'Close player' }));

  expect(mockPlayer.pause).toHaveBeenCalled();
  expect(mockRoute.router.back).toHaveBeenCalled();
  await waitFor(async () =>
    expect(await savedSession()).toMatchObject({
      lastEpisodeId: 'vl-ep1',
      progress: { 'vl-ep1': { positionSec: 12, completed: false } },
    }),
  );
});

it('starts a partly watched episode where the saved session left it', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(midEpisode2));
  await open({ episodeId: 'vl-ep2' });
  expect(mockPlayer.replaceAsync).toHaveBeenLastCalledWith(episode2.video);

  await playerEvent(() => mockPlayer.ready(22));

  expect(mockPlayer.playedFrom).toEqual([7]);
});

it('offers to continue Episode 2 on Home after a relaunch', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(midEpisode2));
  await render(
    <SessionProvider>
      <Hydrated>
        <HomeScreen />
      </Hydrated>
    </SessionProvider>,
  );

  await fireEvent.press(await screen.findByText('Weiterschauen · Ep 2'));

  expect(mockRoute.router.push).toHaveBeenCalledWith({ pathname: '/watch/[episodeId]', params: { episodeId: 'vl-ep2' } });
});

it('pauses in the background and resumes in the foreground, unless the viewer paused', async () => {
  const appState = jest.spyOn(AppState, 'addEventListener');
  await open({ episodeId: 'vl-ep1' });
  const [, onChange] = appState.mock.calls.find(([type]) => type === 'change')!;
  const setAppState = (state: AppStateStatus) => playerEvent(() => (onChange as (s: AppStateStatus) => void)(state));
  await playerEvent(() => mockPlayer.ready(20));
  await playerEvent(() => mockPlayer.tick(6));

  await setAppState('background');
  expect(mockPlayer.playing).toBe(false);
  await waitFor(async () => expect((await savedSession())?.progress['vl-ep1']?.positionSec).toBe(6));

  await setAppState('active');
  expect(mockPlayer.playing).toBe(true);

  await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await setAppState('background');
  await setAppState('active');
  expect(mockPlayer.playing).toBe(false);
  expect(screen.getByRole('button', { name: 'Play' })).toBeOnTheScreen();
});

it('shows Play after the system stops playback and resumes with one tap', async () => {
  await open({ episodeId: 'vl-ep1' });
  await playerEvent(() => mockPlayer.ready(20));
  await playerEvent(() => mockPlayer.tick(5));

  await playerEvent(() => {
    mockPlayer.playing = false;
    mockPlayer.emit('playingChange', { isPlaying: false });
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Play' }));

  expect(mockPlayer.playing).toBe(true);
  expect(screen.getByRole('button', { name: 'Pause' })).toBeOnTheScreen();
});

it('charges once when the unlock button is tapped twice in the same frame', async () => {
  await open({ episodeId: 'vl-ep2' });
  const unlock = screen.getByText('Unlock for 10 coins');

  await act(async () => {
    void fireEvent.press(unlock);
    void fireEvent.press(unlock);
  });

  await waitFor(async () => expect((await savedSession())?.coins).toBe(5));
  expect(screen.getAllByText('Episode 2 unlocked · 5 coins left')).toHaveLength(1);
  expect((await savedSession())?.unlockedEpisodeIds).toEqual(['vl-ep2']);
});

it('tells the viewer when an unlock could not be saved', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));
  await open({ episodeId: 'vl-ep2' });

  await fireEvent.press(screen.getByText('Unlock for 10 coins'));

  expect(await screen.findByText('Couldn’t save on this device. Changes last until the app closes.')).toBeOnTheScreen();
});
