import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { SessionProvider, useSession } from './SessionProvider';
import { seedSnapshot, STORAGE_KEY } from './snapshot';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const setItem = jest.mocked(AsyncStorage.setItem);
const getItem = jest.mocked(AsyncStorage.getItem);

function savedSnapshots() {
  return setItem.mock.calls.map(([, json]) => JSON.parse(json));
}

async function renderSession() {
  const hook = await renderHook(() => useSession(), { wrapper: SessionProvider });
  await waitFor(() => expect(hook.result.current.hydrated).toBe(true));
  return hook.result;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

it('restores the saved session on launch', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...seedSnapshot(), coins: 5, unlockedEpisodeIds: ['vl-ep2'] }));
  jest.clearAllMocks();

  const session = await renderSession();

  expect(session.current.session.coins).toBe(5);
  expect(session.current.session.unlockedEpisodeIds).toEqual(['vl-ep2']);
  expect(setItem).not.toHaveBeenCalled();
});

it('starts from the seed when the saved session is unreadable', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, '{"version":1,');

  const session = await renderSession();

  expect(session.current.session).toEqual(seedSnapshot());
});

it('leaves a saved session it could not read untouched', async () => {
  getItem.mockRejectedValueOnce(new Error('storage locked'));
  const session = await renderSession();

  let result;
  await act(() => {
    result = session.current.unlock('vl-ep2');
  });

  expect(result).toMatchObject({ kind: 'unlocked', balance: 5 });
  expect(session.current.session.coins).toBe(5);
  expect(setItem).not.toHaveBeenCalled();
  expect(session.current.storage).toBe('read-failed');
});

it('repairs a failed save with the next write', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  setItem.mockRejectedValueOnce(new Error('disk full'));
  const session = await renderSession();

  await act(() => session.current.unlock('vl-ep2'));
  await waitFor(() => expect(session.current.storage).toBe('write-failed'));
  expect(console.warn).toHaveBeenCalledTimes(1);
  await act(() => session.current.recordProgress('vl-ep1', 4, false));

  await waitFor(() => expect(setItem).toHaveBeenCalledTimes(2));
  expect(savedSnapshots().at(-1)).toMatchObject({ coins: 5, unlockedEpisodeIds: ['vl-ep2'] });
  await waitFor(() => expect(session.current.storage).toBe('ok'));
});

it('skips progress writes that change nothing', async () => {
  const session = await renderSession();

  await act(() => session.current.recordProgress('vl-ep1', 5, false));
  await act(() => session.current.recordProgress('vl-ep1', 5.3, false));
  await waitFor(() => expect(setItem).toHaveBeenCalledTimes(1));

  await act(() => session.current.recordProgress('vl-ep1', 5.3, true));
  await waitFor(() => expect(setItem).toHaveBeenCalledTimes(2));
  expect(savedSnapshots().at(-1).progress['vl-ep1']).toEqual({ positionSec: 5.3, completed: true });
});

it('writes nothing before the saved session has loaded', async () => {
  getItem.mockImplementationOnce(() => new Promise(() => {}));
  const { result } = await renderHook(() => useSession(), { wrapper: SessionProvider });

  let attempt;
  await act(() => {
    attempt = result.current.unlock('vl-ep2');
    result.current.recordProgress('vl-ep1', 5, false);
  });

  expect(attempt).toEqual({ kind: 'not_found' });
  expect(result.current.hydrated).toBe(false);
  expect(result.current.session.coins).toBe(15);
  expect(setItem).not.toHaveBeenCalled();
});

it('charges a double tap once and saves the result', async () => {
  const session = await renderSession();

  let first;
  let second;
  await act(() => {
    first = session.current.unlock('vl-ep2');
    second = session.current.unlock('vl-ep2');
  });

  expect(first).toEqual({ kind: 'unlocked', spent: 10, balance: 5 });
  expect(second).toEqual({ kind: 'already_entitled' });
  expect(session.current.session.coins).toBe(5);
  await waitFor(() => expect(setItem).toHaveBeenCalledTimes(1));
  expect(savedSnapshots()[0]).toMatchObject({ coins: 5, unlockedEpisodeIds: ['vl-ep2'] });
});

it('never lets a queued progress write bring back the old balance', async () => {
  const session = await renderSession();

  await act(() => {
    session.current.recordProgress('vl-ep1', 8, false);
    session.current.unlock('vl-ep2');
  });

  await waitFor(() => expect(setItem).toHaveBeenCalledTimes(2));
  const saved = savedSnapshots();
  expect(saved.every((snapshot) => snapshot.coins === 5)).toBe(true);
  expect(saved.at(-1)).toMatchObject({
    coins: 5,
    unlockedEpisodeIds: ['vl-ep2'],
    lastEpisodeId: 'vl-ep1',
    progress: { 'vl-ep1': { positionSec: 8, completed: false } },
  });
});

it('empties the wallet without touching unlocks, and resets to the seed', async () => {
  const session = await renderSession();

  await act(() => {
    session.current.unlock('vl-ep2');
    session.current.emptyWallet();
  });
  expect(session.current.session).toMatchObject({ coins: 0, unlockedEpisodeIds: ['vl-ep2'] });

  await act(() => session.current.resetDemo());
  expect(session.current.session).toEqual(seedSnapshot());
  await waitFor(() => expect(savedSnapshots().at(-1)).toEqual(seedSnapshot()));
});
