'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiRefreshCw,
  FiMousePointer,
  FiMove,
  FiLayers,
  FiArrowUp,
  FiArrowDown,
  FiArrowLeft,
  FiArrowRight,
} from 'react-icons/fi';
import {
  canSlide,
  getShuffledBoard,
  INITIAL_BOARD,
  isSolved,
  slideTiles,
  GRID_SIZE,
  MAX_DIM,
  MIN_DIM,
  type MovementControlMode,
  type SlideMove,
  type SlideResult,
} from './engine';
import { GameShell } from '../common/GameShell';
import { GameOverModal } from '../common/GameOverModal';
import { QuitButton, QuitModal } from '../common/QuitModal';
import { HowToPlayModal } from '../common/HowToPlayModal';
import { FontScaleButton, useGameFontScale } from '../common/FontScale';
import { formatGameTime, recordGameScore, useGameSession } from '../common/leaderboardStorage';
import type { ScoreBreakdown } from '../common/scoring';
import { useAuth } from '@/context/useAuth';
import styles from './SlidePuzzleGame.module.scss';
// A tracked pointer that has been silent this long has lost its end event, so the next pointerdown
// takes it over. An active slide emits pointermove continuously, so a genuine second finger (which
// lands while the first is still moving) is still rejected rather than hijacking the gesture.
const STALE_GESTURE_MS = 700;
const DIMS_KEY = 'slide_puzzle_dims';
const DIM_OPTIONS = Array.from({ length: MAX_DIM - MIN_DIM + 1 }, (_, i) => MIN_DIM + i);
const SIZE_PRESETS = [3, 4, 5];
interface Dims {
  rows: number;
  cols: number;
}
/** Tile colour bands: a tile's band is min(row, col) of its solved cell, stepping red → orange →
 * yellow → lime → green… by 30° of hue, so the solved board shows nested L-shaped layers. */
const tileHue = (val: number, cols: number): number => {
  const home = val - 1;
  return Math.min(Math.floor(home / cols), home % cols) * 120;
};
export const SlidePuzzleGame: React.FC = () => {
  useGameSession('slide-puzzle');
  const fontScale = useGameFontScale('slide-puzzle');
  // Server and first client render share a fixed scramble so hydration matches; a random board is
  // dealt right after mount.
  const [tiles, setTiles] = useState<number[]>(() => [...INITIAL_BOARD]);
  const [moves, setMoves] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [personalBest, setPersonalBest] = useState<boolean>(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [controlMode, setControlMode] = useState<MovementControlMode>('tap');
  const [movementLog, setMovementLog] = useState<SlideMove[]>([]);
  const [dims, setDims] = useState<Dims>({ rows: GRID_SIZE, cols: GRID_SIZE });
  const dimsRef = useRef(dims);
  const tilesRef = useRef(tiles);
  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);
  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);
  const lastPointerTileRef = useRef<number | null>(null);
  const hasMovedInGestureRef = useRef<boolean>(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  // Mirrors of state that executeMove needs to read. Depending on `elapsedSeconds` directly made
  // executeMove -- and therefore every tile's onPointerEnter closure -- a new function every
  // second, re-rendering the whole board once per tick during play.
  const elapsedSecondsRef = useRef<number>(0);
  const isStartedRef = useRef<boolean>(false);
  const { user } = useAuth();
  const isCompletedRef = useRef<boolean>(false);
  const movesRef = useRef<number>(0);
  // The id of the pointer currently driving a gesture, or null. A nullable id is self-healing in a
  // way a boolean "is down" latch is not: any up/cancel/capture-loss for that id clears it.
  const activePointerIdRef = useRef<number | null>(null);
  // Timestamp of the last slide instead of a boolean "is swiping" latch. The old flag was cleared
  // only by a setTimeout inside pointerup; when iOS never delivered pointerup or pointercancel
  // (a system gesture taking over mid-slide), it stayed true forever and silently killed every
  // subsequent tap. A timestamp cannot get stuck.
  const lastSwipeAtRef = useRef<number>(0);
  // Last time the tracked pointer was seen, so a stranded pointer id can never lock the board out.
  const lastPointerActivityAtRef = useRef<number>(0);
  // Grid geometry captured at gesture start so pointermove needs no layout read.
  const gridRectRef = useRef<DOMRect | null>(null);
  const handleModeChange = (mode: MovementControlMode) => {
    setControlMode(mode);
    try {
      localStorage.setItem('slide_puzzle_control_mode', mode);
    } catch {
      // Storage unavailable in SSR or private mode
    }
  };
  const resetGame = useCallback(() => {
    const next = getShuffledBoard(dimsRef.current.rows, dimsRef.current.cols);
    tilesRef.current = next;
    setTiles(next);
    setMoves(0);
    setElapsedSeconds(0);
    setIsWon(false);
    setIsStarted(false);
    setPersonalBest(false);
    setScoreBreakdown(null);
    setMovementLog([]);
    lastPointerTileRef.current = null;
    hasMovedInGestureRef.current = false;
    activePointerIdRef.current = null;
    lastSwipeAtRef.current = 0;
    gridRectRef.current = null;
    isStartedRef.current = false;
    isCompletedRef.current = false;
    movesRef.current = 0;
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const [r, c] = (localStorage.getItem(DIMS_KEY) || '').split('x').map(Number);
        if (DIM_OPTIONS.includes(r) && DIM_OPTIONS.includes(c)) {
          dimsRef.current = { rows: r, cols: c };
          setDims(dimsRef.current);
        }
      } catch {
        // Storage unavailable in private mode
      }
      if (!isStartedRef.current) {
        const next = getShuffledBoard(dimsRef.current.rows, dimsRef.current.cols);
        tilesRef.current = next;
        setTiles(next);
      }
      try {
        const saved = localStorage.getItem('slide_puzzle_control_mode');
        if (saved === 'tap' || saved === 'swipe' || saved === 'hybrid') {
          setControlMode(saved);
        }
      } catch {
        // Storage unavailable in private mode
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!isStarted || isWon) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    // Timer owns elapsed time; the win handler reads it via elapsedSecondsRef.
    return () => clearInterval(timer);
  }, [isStarted, isWon]);
  const executeMove = useCallback(
    (result: SlideResult, moveType: 'TAP' | 'SWIPE') => {
      if (isCompletedRef.current) return;
      if (!isStartedRef.current) {
        isStartedRef.current = true;
        setIsStarted(true);
      }
      tilesRef.current = result.newTiles;
      // Authoritative move count lives in a ref so the winning move can record its score without
      // running side effects inside a setState updater. React may invoke an updater more than once
      // (StrictMode double-invokes, and re-renders can replay it), which previously meant
      // recordGameScore could write to storage twice and called setState mid-updater.
      movesRef.current += 1;
      const finalMoves = movesRef.current;
      setTiles(result.newTiles);
      setMoves(finalMoves);
      const now = Date.now();
      const newSlideMoves: SlideMove[] = result.moves.map((m) => ({
        ...m,
        moveType,
        timestamp: now,
      }));
      setMovementLog((prev) => [...prev, ...newSlideMoves]);
      if (isStartedRef.current && finalMoves >= 5 && isSolved(result.newTiles)) {
        isCompletedRef.current = true;
        setIsWon(true);
        const res = recordGameScore({
          gameId: 'slide-puzzle',
          gameName: '15-Slide Puzzle',
          difficulty: `${dimsRef.current.rows}x${dimsRef.current.cols}`,
          timeSeconds: Math.max(1, elapsedSecondsRef.current),
          moves: finalMoves,
          outcome: 'won',
          playerName: user?.user_alias || user?.name || undefined,
        });
        setPersonalBest(res.isPersonalBest);
        setScoreBreakdown(res.scoreBreakdown);
      }
    },
    [user]
  );
  // Resolve the grid's geometry once per gesture. `getBoundingClientRect` is a layout read, so
  // doing it per pointermove (as the old hit-test did) is wasteful on a 120Hz pointer stream.
  const readGridRect = useCallback((): DOMRect | null => {
    const gridEl = boardRef.current?.querySelector(`.${styles.grid}`) as HTMLElement | null;
    const target = gridEl || boardRef.current;
    return target ? target.getBoundingClientRect() : null;
  }, []);
  // Pure geometry, no DOM hit-testing.
  //
  // This previously called `document.elementFromPoint(...).closest('[data-idx]')` on every single
  // pointermove. That forces a synchronous hit-test on the main thread at pointer-event frequency,
  // and it is also wrong mid-animation: tiles carry a 0.12s transition, so hit-testing during a
  // slide can resolve to whichever element happens to be under the finger part-way through.
  // Computing the cell from the cached rect is both cheaper and deterministic.
  const getTileIndexFromPoint = useCallback(
    (clientX: number, clientY: number): number | null => {
      const rect = gridRectRef.current ?? readGridRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return null;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        return null;
      }
      const { rows, cols } = dimsRef.current;
      const col = Math.min(cols - 1, Math.max(0, Math.floor((x / rect.width) * cols)));
      const row = Math.min(rows - 1, Math.max(0, Math.floor((y / rect.height) * rows)));
      return row * cols + col;
    },
    [readGridRect]
  );
  const handleCellTransition = useCallback(
    (currentIdx: number, isMoveGesture: boolean) => {
      if (isWon) return;
      if (controlMode === 'tap' && isMoveGesture) return;
      const currentTiles = tilesRef.current;
      const currentBlank = currentTiles.indexOf(0);
      if (currentBlank === -1) return;
      const prevIdx = lastPointerTileRef.current;
      lastPointerTileRef.current = currentIdx;
      if (prevIdx === currentIdx || currentIdx === currentBlank) {
        return;
      }
      // Entering any tile in the blank's row or column slides it (and any tiles between) into the
      // gap, wherever the pointer came from: the blank, a neighbour, or the far side of the board.
      const result = slideTiles(currentTiles, currentIdx, dimsRef.current.cols);
      if (result) {
        hasMovedInGestureRef.current = true;
        lastSwipeAtRef.current = Date.now();
        executeMove(result, 'SWIPE');
        lastPointerTileRef.current = currentIdx; // now currentIdx is the new blank space!
      }
    },
    [controlMode, executeMove, isWon]
  );
  const handleTileClick = useCallback(
    (idx: number) => {
      if (isWon) return;
      if (controlMode === 'swipe') return; // Taps disabled in swipe mode
      // Suppress the click that trails a slide gesture. Time-based, so it cannot latch on.
      if (Date.now() - lastSwipeAtRef.current < 150) return;
      const result = slideTiles(tilesRef.current, idx, dimsRef.current.cols);
      if (!result) return;
      executeMove(result, 'TAP');
    },
    [controlMode, executeMove, isWon]
  );
  const endGesture = useCallback((e?: React.PointerEvent) => {
    if (e) {
      try {
        const el = e.currentTarget as HTMLElement;
        if (el.hasPointerCapture?.(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore unsupported pointer capture
      }
    }
    if (hasMovedInGestureRef.current) {
      lastSwipeAtRef.current = Date.now();
    }
    activePointerIdRef.current = null;
    lastPointerTileRef.current = null;
    hasMovedInGestureRef.current = false;
    gridRectRef.current = null;
  }, []);
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isWon) return;
    // A second finger landing mid-slide would otherwise retarget the gesture. But never reject
    // indefinitely: if the tracked pointer is stale, its end event was dropped, so take over
    // rather than leaving the board permanently unresponsive.
    const now = Date.now();
    if (
      activePointerIdRef.current !== null &&
      activePointerIdRef.current !== e.pointerId &&
      now - lastPointerActivityAtRef.current < STALE_GESTURE_MS
    ) {
      return;
    }
    lastPointerActivityAtRef.current = now;
    activePointerIdRef.current = e.pointerId;
    hasMovedInGestureRef.current = false;
    gridRectRef.current = readGridRect();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore unsupported pointer capture
    }
    const idx = getTileIndexFromPoint(e.clientX, e.clientY);
    if (idx !== null) {
      lastPointerTileRef.current = idx;
    }
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isWon) return;
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    // On a touch device the finger must be down; a mouse drives this by hover alone.
    if (isTouch && activePointerIdRef.current !== e.pointerId) return;
    if (activePointerIdRef.current === e.pointerId) {
      lastPointerActivityAtRef.current = Date.now();
    }
    const idx = getTileIndexFromPoint(e.clientX, e.clientY);
    // Bail before touching any state while the pointer is still inside the same cell. A slide
    // across one tile produces dozens of pointermove events but only one meaningful transition.
    if (idx === null || idx === lastPointerTileRef.current) return;
    handleCellTransition(idx, true);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;
    endGesture(e);
  };
  // iOS Safari can revoke an implicit pointer capture mid-gesture (a system edge gesture, or the
  // node under the finger being reparented). Without this the gesture state was never cleared and
  // the board stopped responding until reload.
  const handleLostPointerCapture = (e: React.PointerEvent) => {
    if (activePointerIdRef.current === e.pointerId) {
      endGesture();
    }
  };
  const handlePointerLeave = (e: React.PointerEvent) => {
    // With pointer capture held, a mouse leaving the board still reports through the board, so
    // only treat this as the end of a hover-driven gesture.
    if (e.pointerType === 'mouse' && activePointerIdRef.current === null) {
      lastPointerTileRef.current = null;
      gridRectRef.current = null;
    }
  };
  // A new size deals a fresh board; remembered for the next visit.
  const handleDimsChange = (next: Dims) => {
    dimsRef.current = next;
    setDims(next);
    try {
      localStorage.setItem(DIMS_KEY, `${next.rows}x${next.cols}`);
    } catch {
      // Storage unavailable in private mode
    }
    resetGame();
  };
  const lastMove = movementLog[movementLog.length - 1];
  return (
    <GameShell className={styles.container} style={fontScale.style}>
      <GameShell.Header
        title="15-Slide Puzzle"
        subtitle={`Slide tiles into ascending 1 to ${dims.rows * dims.cols - 1} sequence`}
        className={styles.header}
        actions={
          <>
            <FontScaleButton scale={fontScale.scale} onClick={fontScale.cycle} />
            <QuitButton onClick={() => setShowQuitModal(true)} />
          </>
        }
      />
      <div className={styles.hudBar}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Moves</span>
          <span className={styles.hudValue}>{moves}</span>
        </div>
        <button
          type="button"
          className={styles.shuffleBtn}
          onClick={resetGame}
          aria-label="Shuffle board"
        >
          <FiRefreshCw size={14} />
          <span>New Game</span>
        </button>
        <div className={`${styles.hudStat} ${styles.hudStatRight}`}>
          <span className={styles.hudLabel}>Time</span>
          <span className={styles.hudValue}>{formatGameTime(elapsedSeconds)}</span>
        </div>
      </div>
      <div className={styles.controlModeSection}>
        <div className={styles.controlModeHeader}>
          <span className={styles.controlModeLabel}>Board Size:</span>
        </div>
        <div className={styles.sizeRow}>
          <div className={styles.segmentedControl} role="radiogroup" aria-label="Board size preset">
            {SIZE_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.segmentBtn} ${dims.rows === n && dims.cols === n ? styles.segmentBtnActive : ''}`}
                onClick={() => handleDimsChange({ rows: n, cols: n })}
                role="radio"
                aria-checked={dims.rows === n && dims.cols === n}
              >
                {n}×{n}
              </button>
            ))}
          </div>
          <div className={styles.customSize}>
            <select
              aria-label="Rows"
              value={dims.rows}
              onChange={(e) => handleDimsChange({ ...dims, rows: Number(e.target.value) })}
            >
              {DIM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span aria-hidden="true">×</span>
            <select
              aria-label="Columns"
              value={dims.cols}
              onChange={(e) => handleDimsChange({ ...dims, cols: Number(e.target.value) })}
            >
              {DIM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div
        ref={boardRef}
        className={styles.boardWrapper}
        style={{ aspectRatio: `${dims.cols} / ${dims.rows}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handleLostPointerCapture}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className={styles.grid}
          role="group"
          aria-label="Puzzle board"
          style={{ '--cols': dims.cols, '--rows': dims.rows } as React.CSSProperties}
        >
          {/*
            Keyed by grid position, not by tile value. Keying by value made React reorder the DOM
            children on every slide (the element for tile "7" physically moves to a new position in
            the grid). Reparenting the node sitting under the user's finger makes iOS Safari abandon
            the pointer stream mid-gesture, which is why sliding worked on desktop and Android but
            not on iPhone. Keying by position means a slide only rewrites text and className on
            nodes that never move. Safe here because tile movement is grid reflow -- no transition
            depends on a tile keeping its DOM identity.
          */}
          {tiles.map((val, idx) => {
            if (val === 0) {
              return (
                <div
                  key={idx}
                  data-idx={idx}
                  className={styles.tileEmpty}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') {
                      handleCellTransition(idx, true);
                    }
                  }}
                  aria-hidden="true"
                />
              );
            }
            // Uniform tiles like a physical puzzle: no tint for "can slide" or "in place".
            const isSlidable = !isWon && canSlide(tiles, idx, dims.cols);
            return (
              <div
                key={idx}
                data-idx={idx}
                className={styles.tile}
                style={{ '--tile-hue': tileHue(val, dims.cols) } as React.CSSProperties}
                onClick={() => handleTileClick(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (controlMode === 'swipe' || isWon) return;
                    const result = slideTiles(tilesRef.current, idx, dims.cols);
                    if (result) executeMove(result, 'TAP');
                  }
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') {
                    handleCellTransition(idx, true);
                  }
                }}
                role="button"
                tabIndex={isSlidable ? 0 : -1}
                aria-label={`Tile ${val}${isSlidable ? ', can slide' : ''}`}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.controlModeSection}>
        <div className={styles.controlModeHeader}>
          <span className={styles.controlModeLabel}>Control Mode:</span>
          {lastMove && (
            <span className={styles.lastMoveBadge}>
              Last: Tile {lastMove.tileValue}{' '}
              {lastMove.directionRelativeToBlank === 'UP' ? (
                <FiArrowUp aria-hidden="true" />
              ) : lastMove.directionRelativeToBlank === 'DOWN' ? (
                <FiArrowDown aria-hidden="true" />
              ) : lastMove.directionRelativeToBlank === 'LEFT' ? (
                <FiArrowLeft aria-hidden="true" />
              ) : (
                <FiArrowRight aria-hidden="true" />
              )}{' '}
              ({lastMove.moveType})
            </span>
          )}
        </div>
        <div
          className={styles.segmentedControl}
          role="radiogroup"
          aria-label="Movement Control Mode"
        >
          <button
            type="button"
            className={`${styles.segmentBtn} ${controlMode === 'tap' ? styles.segmentBtnActive : ''}`}
            onClick={() => handleModeChange('tap')}
            role="radio"
            aria-checked={controlMode === 'tap'}
          >
            <FiMousePointer className={styles.btnIcon} />
            <span>Tap</span>
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${controlMode === 'swipe' ? styles.segmentBtnActive : ''}`}
            onClick={() => handleModeChange('swipe')}
            role="radio"
            aria-checked={controlMode === 'swipe'}
          >
            <FiMove className={styles.btnIcon} />
            <span>Slide / Hover</span>
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${controlMode === 'hybrid' ? styles.segmentBtnActive : ''}`}
            onClick={() => handleModeChange('hybrid')}
            role="radio"
            aria-checked={controlMode === 'hybrid'}
          >
            <FiLayers className={styles.btnIcon} />
            <span>Hybrid</span>
          </button>
        </div>
      </div>
      <GameShell.Info className={styles.info} onHowToPlay={() => setShowHowToPlay(true)}>
        <p className={styles.instructions}>
          {controlMode === 'tap' &&
            "Tap Mode: Tap any tile in the blank space's row or column to slide it."}
          {controlMode === 'swipe' &&
            "Slide / Hover Mode: Move the pointer (or slide a finger) onto any tile in the blank's row or column and it slides into the gap."}
          {controlMode === 'hybrid' &&
            "Hybrid Mode: Tap tiles, or hover/slide onto any tile in the blank's row or column to speed-solve."}
        </p>
      </GameShell.Info>
      {isWon && (
        <GameOverModal
          outcome="won"
          gameTitle="15-Slide Puzzle"
          subtitle="You solved the puzzle in numerical order!"
          scoreBreakdown={scoreBreakdown || undefined}
          timeSeconds={elapsedSeconds}
          stats={[
            { label: 'Moves', value: moves },
            { label: 'Time', value: formatGameTime(elapsedSeconds) },
            {
              label: 'Control',
              value:
                controlMode === 'tap'
                  ? 'Tap'
                  : controlMode === 'swipe'
                    ? 'Slide / Hover'
                    : 'Hybrid',
            },
            { label: 'Logged Slides', value: movementLog.length },
          ]}
          isPersonalBest={personalBest}
          onPlayAgain={resetGame}
          playAgainLabel="Play Again"
          hubHref="/games"
        />
      )}
      <QuitModal
        isOpen={showQuitModal}
        gameTitle="15-Slide Puzzle"
        onCancel={() => setShowQuitModal(false)}
        onConfirmQuit={() => setShowQuitModal(false)}
      />
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        gameTitle="15-Slide Puzzle"
        objective="Slide the numbered tiles until they are in order from left to right, top to bottom, with the empty space in the bottom-right corner. Pick any board from 3×3 up to 8×8."
        rules={[
          <>
            <strong>Adjacent Sliding:</strong> Tiles adjacent to the empty slot can be slid into it
            horizontally or vertically.
          </>,
          <>
            <strong>Multi-tile Sliding:</strong> Tapping or sliding a tile in the same row or column
            as the empty space will push all intervening tiles into the blank space.
          </>,
          <>
            <strong>Colour Guide:</strong> Each tile's colour shows its home band. Red tiles belong
            in the top row and left column, orange in the next band in, and so on.
          </>,
        ]}
        controls={{
          desktop:
            'Click tiles adjacent to the empty space (or anywhere in its row/col in Tap mode). In Slide mode, move onto any tile in line with the blank.',
          mobile:
            'Tap a tile in the blank space\'s row or column, or switch to "Slide" mode to drag tiles directly.',
          shortcuts: 'Switch modes via the segmented control: Tap, Slide / Hover, or Hybrid.',
        }}
        tips={[
          'Solve row by row from the top: first solve 1, 2, 3, 4, then 5, 6, 7, 8.',
          'To place the last two tiles in a row (e.g., 3 and 4), place 4 in slot 3 and 3 below it, then cycle them together into place.',
          'Solve the bottom two rows column by column: pair up 9 & 13, then 10 & 14, leaving the final 2×2 block to cycle.',
        ]}
      />
    </GameShell>
  );
};
