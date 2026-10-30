import { resumeTarget, startPosition } from './resume';
import { episodes } from './test-fixtures';

const fresh = { progress: {}, lastEpisodeId: null };

describe('resumeTarget', () => {
  it('starts a new viewer at episode 1', () => {
    expect(resumeTarget(fresh, episodes, 'show')).toEqual({ episodeId: 'ep1', startSec: 0, continuing: false });
  });

  it('resumes the unfinished last episode a second early', () => {
    const session = { progress: { ep1: { positionSec: 12.4, completed: false } }, lastEpisodeId: 'ep1' };

    expect(resumeTarget(session, episodes, 'show')).toEqual({
      episodeId: 'ep1',
      startSec: expect.closeTo(11.4),
      continuing: true,
    });
  });

  it('moves on to the next episode after a finished one, even while it is locked', () => {
    const session = { progress: { ep1: { positionSec: 20, completed: true } }, lastEpisodeId: 'ep1' };

    expect(resumeTarget(session, episodes, 'show')).toEqual({ episodeId: 'ep2', startSec: 0, continuing: true });
  });

  it('picks the next episode up where it stopped', () => {
    const session = {
      progress: { ep1: { positionSec: 20, completed: true }, ep2: { positionSec: 8, completed: false } },
      lastEpisodeId: 'ep1',
    };

    expect(resumeTarget(session, episodes, 'show')).toEqual({ episodeId: 'ep2', startSec: 7, continuing: true });
  });

  it('starts over after the final episode', () => {
    const session = { progress: { ep3: { positionSec: 20, completed: true } }, lastEpisodeId: 'ep3' };

    expect(resumeTarget(session, episodes, 'show')).toEqual({ episodeId: 'ep1', startSec: 0, continuing: false });
  });

  it('has nothing to resume for an unknown series', () => {
    expect(resumeTarget(fresh, episodes, 'other')).toBeUndefined();
  });
});

describe('startPosition', () => {
  it('never rewinds past the start and replays finished episodes from zero', () => {
    const [first] = episodes;

    expect(startPosition({ progress: { ep1: { positionSec: 0.4, completed: false } } }, first)).toBe(0);
    expect(startPosition({ progress: { ep1: { positionSec: 20, completed: true } } }, first)).toBe(0);
  });
});
