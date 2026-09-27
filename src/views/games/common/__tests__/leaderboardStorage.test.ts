import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatGameTime,
  getGamePersonalBest,
  getLeaderboardEntries,
  recordGameScore,
} from '../leaderboardStorage';
test('formatGameTime formats seconds to mm:ss', () => {
  assert.equal(formatGameTime(0), '0:00');
  assert.equal(formatGameTime(45), '0:45');
  assert.equal(formatGameTime(65), '1:05');
  assert.equal(formatGameTime(3600), '60:00');
});
test('leaderboardStorage handles record and personal best retrieval', () => {
  const mockStorage: Record<string, string> = {};
  // Mock window.localStorage for test environment
  (globalThis as unknown as { window?: { localStorage: Storage } }).window = {
    localStorage: {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        for (const k in mockStorage) delete mockStorage[k];
      },
      length: 0,
      key: () => null,
    },
  };
  const first = recordGameScore({
    gameId: 'slide-puzzle',
    gameName: '15-Slide Puzzle',
    difficulty: '4x4',
    timeSeconds: 120,
    score: 50,
  });
  assert.equal(first.isPersonalBest, true);
  assert.equal(first.bestTime, 120);
  const pb1 = getGamePersonalBest('slide-puzzle', '4x4');
  assert.ok(pb1);
  assert.equal(pb1?.timeSeconds, 120);
  // Slower time should NOT be personal best
  const second = recordGameScore({
    gameId: 'slide-puzzle',
    gameName: '15-Slide Puzzle',
    difficulty: '4x4',
    timeSeconds: 150,
    score: 60,
  });
  assert.equal(second.isPersonalBest, false);
  assert.equal(second.bestTime, 120);
  // Faster time SHOULD be personal best
  const third = recordGameScore({
    gameId: 'slide-puzzle',
    gameName: '15-Slide Puzzle',
    difficulty: '4x4',
    timeSeconds: 95,
    score: 40,
  });
  assert.equal(third.isPersonalBest, true);
  assert.equal(third.bestTime, 95);
  const pbFinal = getGamePersonalBest('slide-puzzle', '4x4');
  assert.equal(pbFinal?.timeSeconds, 95);
  const allEntries = getLeaderboardEntries();
  assert.equal(allEntries.length, 3);
});
