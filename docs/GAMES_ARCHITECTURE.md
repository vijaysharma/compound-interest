# Games Architecture

Status: Source-backed bounded-context overview Source: `src/views/games/`,
`src/actions/gameLeaderboard.ts`, `src/lib/games/submissionRules.ts`,
`src/app/games/**` Last Verified: 2026-10-08 Confidence: HIGH for source
mechanics; production usage/analytics UNKNOWN Owner: UNKNOWN Related Documents:
[System design](SYSTEM_DESIGN.md), [API catalog](API_CATALOG.md),
[testing and QA](TESTING_AND_QA.md)

## Games and Routes

The hub is `/games`; game routes are `/games/hitori`, `/games/minesweeper`,
`/games/queens`, `/games/slide-puzzle`, `/games/sudoku`, `/games/tango`, and
`/games/word-path`. Shared components include game shell, how-to-play,
quit/game-over/victory UI, confetti, scoring and leaderboard storage under
`src/views/games/common/`.

Every game lays out through `GameShell` (`src/views/games/common/GameShell.tsx`):
`GameShell.Header` → `Hud` → `Board` → `Controls` → `Info`. The app top bar
already names the game, so the header's `h1` title and subtitle are visually
hidden (kept for SEO and screen readers) and only its `actions` — timer, text
size, pause/quit — are shown. `GameShell.Info` sits below the board and
controls and holds the "How to play" button followed by any rules, tips or
stats; games should not render their own how-to-play buttons in the header.

Mechanics are implemented in each game’s `engine.ts`, `generator.ts`, presets,
and view component. Inventory exists in source; a rule-by-rule game manual is
not yet exhaustive. Tests are present for all listed games, with additional
engine/generator/preset tests for several.

## State, Scoring, and Persistence

- Gameplay/puzzle state is primarily client-side React state.
- `startGameSessionAction` creates a server-side, one-use session bound to owner
  and game, records start timestamp and hashed IP, and applies Redis rate
  limits.
- `recordGameScoreAction` validates game/difficulty and bounded fields, consumes
  an unexpired session once, compares submitted time with session age, applies
  rate limits/daily limits, calculates score server-side, and writes
  `game_leaderboard`.
- Owner IDs are prefixed `user_` or `guest_`; a browser guest ID can participate
  in server score submission. Scores are grouped by owner ID, not display name.
- The `/api/leaderboard` GET is a static mock fixture; actual leaderboard
  queries use server actions. POST to that route returns 405.

## Anti-Cheating Boundary

Server verification protects score inputs/session replay/elapsed-time
plausibility, but the server does not recompute each puzzle’s move-by-move
solution from a server-generated puzzle proof. Puzzle completion truth is
therefore not fully server-verifiable in the inspected design. Client-submitted
player names/accuracy are bounded strings, not identity proof. Rate limiting
falls back to process-local memory if Redis is unavailable, which weakens
cross-instance enforcement.

## Coupling and Risks

Games share the app account/session database and Redis rate limiting but are
otherwise separate from financial calculation engines. The leaderboard schema
and actions are coupled to a union of game IDs; adding a game requires updating
validation, scoring, registration, UI, and tests. No dedicated anti-cheating
operations dashboard or analytics pipeline was found.
