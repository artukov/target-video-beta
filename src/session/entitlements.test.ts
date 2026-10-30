import { EPISODES } from '@/catalog/catalog';

import { canPlay, unlockEpisode } from './entitlements';
import { seedSnapshot } from './snapshot';
import { episodes } from './test-fixtures';

describe('unlockEpisode', () => {
  it('charges the price and grants the episode in one step', () => {
    const { session, result } = unlockEpisode(seedSnapshot(), 'ep2', episodes);

    expect(result).toEqual({ kind: 'unlocked', spent: 10, balance: 5 });
    expect(session.coins).toBe(5);
    expect(session.unlockedEpisodeIds).toEqual(['ep2']);
  });

  it('reports the shortfall and leaves the session alone when coins run short', () => {
    const short = { ...seedSnapshot(), coins: 5 };
    const { session, result } = unlockEpisode(short, 'ep2', episodes);

    expect(result).toEqual({ kind: 'insufficient_funds', price: 10, balance: 5, shortfall: 5 });
    expect(session).toBe(short);
  });

  it('charges a repeated unlock only once', () => {
    const first = unlockEpisode(seedSnapshot(), 'ep2', episodes);
    const second = unlockEpisode(first.session, 'ep2', episodes);

    expect(second.result).toEqual({ kind: 'already_entitled' });
    expect(second.session).toBe(first.session);
    expect(second.session.coins).toBe(5);
    expect(second.session.unlockedEpisodeIds).toEqual(['ep2']);
  });

  it('sells episodes in order only', () => {
    const rich = { ...seedSnapshot(), coins: 100 };
    const { session, result } = unlockEpisode(rich, 'ep3', episodes);

    expect(result).toEqual({ kind: 'requires_previous', episodeId: 'ep2' });
    expect(session).toBe(rich);
  });

  it('never charges for free or unknown episodes', () => {
    const seed = seedSnapshot();

    expect(unlockEpisode(seed, 'ep1', episodes)).toEqual({ session: seed, result: { kind: 'already_entitled' } });
    expect(unlockEpisode(seed, 'ep9', episodes)).toEqual({ session: seed, result: { kind: 'not_found' } });
  });
});

describe('canPlay', () => {
  it('allows free and unlocked episodes only', () => {
    const [free, second, third] = episodes;
    const session = { unlockedEpisodeIds: ['ep2'] };

    expect(canPlay(session, free)).toBe(true);
    expect(canPlay(session, second)).toBe(true);
    expect(canPlay(session, third)).toBe(false);
  });
});

describe('demo catalog', () => {
  it('lets the seeded wallet buy Episode 2 but never the clip-less Episode 3', () => {
    const afterEp2 = unlockEpisode(seedSnapshot(), 'vl-ep2', EPISODES);
    expect(afterEp2.result).toMatchObject({ kind: 'unlocked', balance: 5 });

    expect(unlockEpisode(afterEp2.session, 'vl-ep3', EPISODES).result).toEqual({
      kind: 'insufficient_funds',
      price: 10,
      balance: 5,
      shortfall: 5,
    });
    expect(unlockEpisode(seedSnapshot(), 'vl-ep3', EPISODES).result).toEqual({
      kind: 'requires_previous',
      episodeId: 'vl-ep2',
    });
  });

  it('never spends coins on Episode 3, which has no video, even when the wallet could pay', () => {
    const rich = { ...seedSnapshot(), coins: 30, unlockedEpisodeIds: ['vl-ep2'] };

    expect(unlockEpisode(rich, 'vl-ep3', EPISODES)).toEqual({ session: rich, result: { kind: 'unavailable' } });
  });
});
