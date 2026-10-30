import { restoreSnapshot, seedSnapshot, type SessionSnapshotV1 } from './snapshot';
import { episodes, series } from './test-fixtures';

const known = { episodes, series };

const valid: SessionSnapshotV1 = {
  version: 1,
  coins: 5,
  unlockedEpisodeIds: ['ep2'],
  progress: { ep1: { positionSec: 20, completed: true }, ep2: { positionSec: 6.5, completed: false } },
  lastEpisodeId: 'ep2',
  savedSeriesIds: ['show'],
};

describe('restoreSnapshot', () => {
  it('seeds a first launch', () => {
    expect(restoreSnapshot(null, known)).toEqual(seedSnapshot());
  });

  it('keeps a valid snapshot as it was', () => {
    expect(restoreSnapshot(JSON.stringify(valid), known)).toEqual(valid);
  });

  it.each([
    ['broken JSON', '{"version":1,'],
    ['a non-object', '[1,2,3]'],
    ['null', 'null'],
    ['an old version', JSON.stringify({ ...valid, version: 0 })],
    ['a newer version', JSON.stringify({ ...valid, version: 2 })],
    ['a balance that is not a number', JSON.stringify({ ...valid, coins: '15' })],
    ['a null balance', JSON.stringify({ ...valid, coins: null })],
    ['a missing unlock list', JSON.stringify({ ...valid, unlockedEpisodeIds: undefined })],
    ['progress that is a list', JSON.stringify({ ...valid, progress: [] })],
    ['a numeric last episode', JSON.stringify({ ...valid, lastEpisodeId: 2 })],
  ])('replaces %s with the seed', (_, raw) => {
    expect(restoreSnapshot(raw, known)).toEqual(seedSnapshot());
  });

  it('drops unknown ids, duplicates and free episodes and clamps numbers', () => {
    const messy = {
      ...valid,
      coins: -3.7,
      unlockedEpisodeIds: ['ep2', 'ep2', 'ep1', 'ep9', 7],
      progress: {
        ep1: { positionSec: 99, completed: 'yes' },
        ep2: { positionSec: -4, completed: false },
        ep3: { positionSec: 'later' },
        ep9: { positionSec: 3, completed: false },
      },
      lastEpisodeId: 'ep9',
      savedSeriesIds: ['show', 'gone', 'show'],
    };

    expect(restoreSnapshot(JSON.stringify(messy), known)).toEqual({
      version: 1,
      coins: 0,
      unlockedEpisodeIds: ['ep2'],
      progress: { ep1: { positionSec: 20, completed: false }, ep2: { positionSec: 0, completed: false } },
      lastEpisodeId: null,
      savedSeriesIds: ['show'],
    });
  });

  it('rounds a fractional balance down', () => {
    expect(restoreSnapshot(JSON.stringify({ ...valid, coins: 14.9 }), known).coins).toBe(14);
  });
});
