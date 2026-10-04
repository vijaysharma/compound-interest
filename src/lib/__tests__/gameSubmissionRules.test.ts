import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBMISSION_LIMITS,
  boundedCount,
  implausibleTimeReason,
  isAllowedDifficulty,
  isGameId,
} from '../games/submissionRules';
describe('leaderboard submission rules', () => {
  it('accepts only the difficulties each game actually sends', () => {
    assert.equal(isAllowedDifficulty('word-path', 'hard'), true);
    assert.equal(isAllowedDifficulty('queens', '8x8'), true);
    assert.equal(isAllowedDifficulty('slide-puzzle', '4x4'), true);
    assert.equal(isAllowedDifficulty('word-path', 'expert'), false);
    assert.equal(isAllowedDifficulty('queens', 'hard'), false);
    assert.equal(isAllowedDifficulty('sudoku', 42), false);
  });
  it('rejects unknown games, including prototype keys', () => {
    assert.equal(isGameId('sudoku'), true);
    assert.equal(isGameId('chess'), false);
    assert.equal(isGameId('toString'), false);
    assert.equal(isGameId(undefined), false);
  });
  it('bounds counts to non-negative integers', () => {
    assert.equal(boundedCount(undefined, 10), undefined);
    assert.equal(boundedCount(3, 10), 3);
    assert.equal(boundedCount(-1, 10), null);
    assert.equal(boundedCount(1.5, 10), null);
    assert.equal(boundedCount(11, 10), null);
    assert.equal(boundedCount(Number.NaN, 10), null);
    assert.equal(boundedCount('5', 10), null);
  });
  it('rejects a reported time longer than the session has existed', () => {
    // The abuse pattern: a session opened moments ago, claiming a 40-69s game.
    assert.equal(implausibleTimeReason(54, 0.2, 'won'), 'time_exceeds_session');
    assert.equal(implausibleTimeReason(54, 60, 'won'), null);
    // Whole-second client ticks may run slightly ahead of the server clock.
    assert.equal(implausibleTimeReason(54, 54 - SUBMISSION_LIMITS.clockGraceSeconds, 'won'), null);
  });
  it('rejects implausibly fast wins but not fast losses', () => {
    assert.equal(implausibleTimeReason(1, 600, 'won'), 'win_too_fast');
    assert.equal(implausibleTimeReason(8, 600, 'won'), null); // fastest genuine win in the data
    assert.equal(implausibleTimeReason(0, 600, 'lost'), null); // first-click Minesweeper loss
  });
  it('keeps limits above the busiest genuine activity seen', () => {
    assert.ok(SUBMISSION_LIMITS.resultsPerMinute > 8);
    assert.ok(SUBMISSION_LIMITS.winsPerDay > 139);
    assert.ok(SUBMISSION_LIMITS.resultsPerMinute < 150); // the scripted rate
  });
});
