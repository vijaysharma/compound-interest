'use client';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiRefreshCw,
  FiArrowRight,
} from 'react-icons/fi';
import type {
  BoardDefinition,
  Coordinate,
  Difficulty,
  Tile,
} from './types';
import { areNeighbors, getBoardSignature } from './generator';
import { generateBoardAsync } from './workerClient';
import { PRESET_BOARDS } from './boards';
import { GameShell } from '../common/GameShell';
import { GameOverModal } from '../common/GameOverModal';
import { QuitButton, QuitModal } from '../common/QuitModal';
import { HowToPlayButton, HowToPlayModal } from '../common/HowToPlayModal';
import { recordGameScore, useGameSession } from '../common/leaderboardStorage';
import type { ScoreBreakdown } from '../common/scoring';
import { getUserAppStateAction, saveUserAppStateAction } from '@/actions/userAppState';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
import { useAntiCheatHints } from '../common/useAntiCheatHints';
import styles from './WordPathGame.module.scss';
const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; rows: number; cols: number }
> = {
  easy: { label: 'Easy (5×5)', rows: 5, cols: 5 },
  medium: { label: 'Medium (6×7)', rows: 7, cols: 6 },
  hard: { label: 'Hard (8×8)', rows: 8, cols: 8 },
};
const STORAGE_KEY_PLAYED = 'rupee_word_path_played_puzzles';
const getStoredPlayedSignatures = (): Set<string> => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PLAYED);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};
const storePlayedSignature = (signature: string) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    const existing = getStoredPlayedSignatures();
    existing.add(signature);
    const arr = Array.from(existing);
    window.localStorage.setItem(STORAGE_KEY_PLAYED, JSON.stringify(arr));
    const token = getAuthToken();
    const guestId = getOrCreateGuestId();
    void saveUserAppStateAction(token, guestId, 'games', 'word_path_played', arr);
  } catch {
    // Ignore storage write error
  }
};
const getNextUniqueBoardAsync = async (
  targetDifficulty: Difficulty,
  playedSigs: Set<string>
): Promise<BoardDefinition> => {
  const presets = PRESET_BOARDS[targetDifficulty] || [];
  const unplayedPreset = presets.find(
    (b) => !playedSigs.has(getBoardSignature(b))
  );
  if (unplayedPreset) {
    return unplayedPreset;
  }
  return generateBoardAsync(targetDifficulty, {
    excludeSignatures: playedSigs,
  });
};
export const WordPathGame: React.FC = () => {
  useGameSession('word-path');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<BoardDefinition>(PRESET_BOARDS.medium[0]);
  useEffect(() => {
    let active = true;
    const token = getAuthToken();
    const guestId = getOrCreateGuestId();
    void getUserAppStateAction<string[]>(token, guestId, 'games', 'word_path_played').then((res) => {
      if (active && res.success && Array.isArray(res.payload)) {
        try {
          const combined = new Set([...getStoredPlayedSignatures(), ...res.payload]);
          window.localStorage.setItem(STORAGE_KEY_PLAYED, JSON.stringify(Array.from(combined)));
        } catch {
          // ignore
        }
      }
    });
    const playedSigs = getStoredPlayedSignatures();
    const defaultSig = getBoardSignature(PRESET_BOARDS.medium[0]);
    if (playedSigs.has(defaultSig)) {
      void getNextUniqueBoardAsync('medium', playedSigs).then((nextBoard) => {
        if (!active) return;
        storePlayedSignature(getBoardSignature(nextBoard));
        setBoard(nextBoard);
      });
    } else {
      storePlayedSignature(defaultSig);
    }
    return () => {
      active = false;
    };
  }, []);
  const [solvedWordIds, setSolvedWordIds] = useState<Set<string>>(new Set());
  const [activePath, setActivePath] = useState<Coordinate[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [focusedCell, setFocusedCell] = useState<Coordinate | null>(null);
  const [highlightedStartWords, setHighlightedStartWords] = useState<Set<string>>(new Set());
  const FONT_SCALES = [1.0, 1.25, 1.5, 1.75];
  const [fontScaleIndex, setFontScaleIndex] = useState<number>(FONT_SCALES.length - 1);
  const mobileFontScale = FONT_SCALES[fontScaleIndex];
  const handleCycleFontScale = () => {
    setFontScaleIndex((prev) => (prev + 1) % FONT_SCALES.length);
  };
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const isWon = Boolean(board && board.words.length > 0 && solvedWordIds.size === board.words.length);
  const boardSignature = useMemo(() => (board ? getBoardSignature(board) : 'word-path-board'), [board]);
  const {
    hintsUsed,
    canUseHint,
    consumeHint,
    hintButtonLabel,
  } = useAntiCheatHints({
    gameId: 'word-path',
    boardId: boardSignature,
    maxHints: 5,
    cooldownSeconds: 30,
    isGameOver: isWon,
  });
  const [personalBest, setPersonalBest] = useState<boolean>(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const handleWordPathWin = useCallback(
    (seconds: number) => {
      setIsTimerRunning(false);
      setShowResultsModal(false);
      storePlayedSignature(getBoardSignature(board));
      const res = recordGameScore({
        gameId: 'word-path',
        gameName: 'Word Path',
        difficulty,
        timeSeconds: seconds,
        hintsUsed,
        accuracy: '100%',
        outcome: 'won',
      });
      setPersonalBest(res.isPersonalBest);
      setScoreBreakdown(res.scoreBreakdown);
    },
    [board, difficulty, hintsUsed]
  );
  const [howToPlayOpen, setHowToPlayOpen] = useState<boolean>(true);
  const [keyboardOpen, setKeyboardOpen] = useState<boolean>(true);
  const [showHowToPlayModal, setShowHowToPlayModal] = useState<boolean>(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const loadNextBoard = useCallback(
    async (diff: Difficulty) => {
      const playedSigs = getStoredPlayedSignatures();
      if (board) {
        const currentSig = getBoardSignature(board);
        playedSigs.add(currentSig);
        storePlayedSignature(currentSig);
      }
      const nextBoard = await getNextUniqueBoardAsync(diff, playedSigs);
      storePlayedSignature(getBoardSignature(nextBoard));
      setBoard(nextBoard);
      setSolvedWordIds(new Set());
      setActivePath([]);
      setIsDragging(false);
      setFocusedCell(null);
      setHighlightedStartWords(new Set());
      setElapsedSeconds(0);
      setPersonalBest(false);
      setIsTimerRunning(true);
      setShowResultsModal(false);
    },
    [board]
  );
  const handleDifficultyChange = (nextDiff: Difficulty) => {
    setDifficulty(nextDiff);
    loadNextBoard(nextDiff);
  };
  const handleNextPuzzle = () => {
    loadNextBoard(difficulty);
  };
  // Timer
  const isCompleted = board.words.length > 0 && solvedWordIds.size === board.words.length;
  useEffect(() => {
    if (!isTimerRunning || isCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  // Helper to test if a coordinate matches
  const isCoordInPath = (path: Coordinate[], coord: Coordinate) =>
    path.some((c) => c.row === coord.row && c.col === coord.col);
  const validateAndSubmitPath = useCallback(
    (pathToSubmit: Coordinate[]) => {
      if (pathToSubmit.length < 2) {
        setActivePath([]);
        setIsDragging(false);
        return false;
      }
      const matchedWord = board.words.find((wordSol) => {
        if (solvedWordIds.has(wordSol.id)) return false;
        if (wordSol.path.length !== pathToSubmit.length) return false;
        return wordSol.path.every(
          (targetCoord, idx) =>
            targetCoord.row === pathToSubmit[idx].row && targetCoord.col === pathToSubmit[idx].col
        );
      });
      if (matchedWord) {
        const nextSolved = new Set([...solvedWordIds, matchedWord.id]);
        setSolvedWordIds(nextSolved);
        if (nextSolved.size === board.words.length) {
          handleWordPathWin(elapsedSeconds);
        }
        setActivePath([]);
        setIsDragging(false);
        return true;
      }
      setActivePath([]);
      setIsDragging(false);
      return false;
    },
    [board, solvedWordIds, handleWordPathWin, elapsedSeconds]
  );
  const submitActivePath = useCallback(() => {
    validateAndSubmitPath(activePath);
  }, [activePath, validateAndSubmitPath]);
  const pointerSessionRef = useRef<{
    startRow: number;
    startCol: number;
    hasDragged: boolean;
    pointerId: number;
  } | null>(null);
  const getTileFromPoint = (clientX: number, clientY: number): Coordinate | null => {
    if (typeof document === 'undefined') return null;
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;
    const tileEl = el.closest<HTMLElement>('[data-tile-coord]');
    if (!tileEl) return null;
    const r = Number(tileEl.dataset.row);
    const c = Number(tileEl.dataset.col);
    if (isNaN(r) || isNaN(c)) return null;
    return { row: r, col: c };
  };
  const handleTileHover = useCallback(
    (coord: Coordinate) => {
      const tile = board.grid[coord.row]?.[coord.col];
      if (!tile || tile.isWall || !tile.letter) return;
      if (tile.wordId && solvedWordIds.has(tile.wordId)) return;
      setActivePath((prev) => {
        if (prev.length === 0) return [coord];
        const last = prev[prev.length - 1];
        if (prev.length >= 2) {
          const secondLast = prev[prev.length - 2];
          if (secondLast.row === coord.row && secondLast.col === coord.col) {
            return prev.slice(0, -1);
          }
        }
        if (areNeighbors(last, coord) && !isCoordInPath(prev, coord)) {
          return [...prev, coord];
        }
        return prev;
      });
    },
    [board.grid, solvedWordIds]
  );
  const handleTileTap = useCallback(
    (coord: Coordinate) => {
      const tile = board.grid[coord.row]?.[coord.col];
      if (!tile || tile.isWall || !tile.letter) return;
      if (tile.wordId && solvedWordIds.has(tile.wordId)) return;
      setActivePath((prev) => {
        if (prev.length === 0) return [coord];
        const last = prev[prev.length - 1];
        if (last.row === coord.row && last.col === coord.col) {
          if (prev.length >= 2) {
            requestAnimationFrame(() => validateAndSubmitPath(prev));
          }
          return prev;
        }
        if (prev.length >= 2) {
          const secondLast = prev[prev.length - 2];
          if (secondLast.row === coord.row && secondLast.col === coord.col) {
            return prev.slice(0, -1);
          }
        }
        if (areNeighbors(last, coord) && !isCoordInPath(prev, coord)) {
          const next = [...prev, coord];
          const isMatch = board.words.some(
            (w) =>
              !solvedWordIds.has(w.id) &&
              w.path.length === next.length &&
              w.path.every((c, i) => c.row === next[i].row && c.col === next[i].col)
          );
          if (isMatch) {
            requestAnimationFrame(() => validateAndSubmitPath(next));
          }
          return next;
        }
        return [coord];
      });
    },
    [board.grid, board.words, solvedWordIds, validateAndSubmitPath]
  );
  const handleBoardPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const coord = getTileFromPoint(e.clientX, e.clientY);
    if (!coord) return;
    const tile = board.grid[coord.row]?.[coord.col];
    if (!tile || tile.isWall || !tile.letter) return;
    if (tile.wordId && solvedWordIds.has(tile.wordId)) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    pointerSessionRef.current = {
      startRow: coord.row,
      startCol: coord.col,
      hasDragged: false,
      pointerId: e.pointerId,
    };
    setActivePath((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (
          areNeighbors(last, coord) ||
          (prev.length >= 2 &&
            prev[prev.length - 2].row === coord.row &&
            prev[prev.length - 2].col === coord.col)
        ) {
          return prev;
        }
      }
      return [coord];
    });
  };
  const handleBoardPointerMove = (e: React.PointerEvent) => {
    if (!pointerSessionRef.current) return;
    const coord = getTileFromPoint(e.clientX, e.clientY);
    if (!coord) return;
    const session = pointerSessionRef.current;
    if (coord.row !== session.startRow || coord.col !== session.startCol) {
      if (!session.hasDragged) {
        session.hasDragged = true;
        setIsDragging(true);
      }
    }
    handleTileHover(coord);
  };
  const handleBoardPointerUp = (e: React.PointerEvent) => {
    if (!pointerSessionRef.current) return;
    const session = pointerSessionRef.current;
    pointerSessionRef.current = null;
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(session.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(session.pointerId);
      }
    } catch {
      // ignore
    }
    if (session.hasDragged) {
      setIsDragging(false);
      validateAndSubmitPath(activePath);
    } else {
      setIsDragging(false);
      handleTileTap({ row: session.startRow, col: session.startCol });
    }
  };
  // Keyboard Navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { row, col } = focusedCell ?? { row: 0, col: 0 };
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextRow = Math.max(0, row - 1);
        setFocusedCell({ row: nextRow, col });
        if (isDragging) {
          const target = { row: nextRow, col };
          if (areNeighbors({ row, col }, target) && !isCoordInPath(activePath, target)) {
            setActivePath((prev) => [...prev, target]);
          }
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextRow = Math.min(board.rows - 1, row + 1);
        setFocusedCell({ row: nextRow, col });
        if (isDragging) {
          const target = { row: nextRow, col };
          if (areNeighbors({ row, col }, target) && !isCoordInPath(activePath, target)) {
            setActivePath((prev) => [...prev, target]);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextCol = Math.max(0, col - 1);
        setFocusedCell({ row, col: nextCol });
        if (isDragging) {
          const target = { row, col: nextCol };
          if (areNeighbors({ row, col }, target) && !isCoordInPath(activePath, target)) {
            setActivePath((prev) => [...prev, target]);
          }
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextCol = Math.min(board.cols - 1, col + 1);
        setFocusedCell({ row, col: nextCol });
        if (isDragging) {
          const target = { row, col: nextCol };
          if (areNeighbors({ row, col }, target) && !isCoordInPath(activePath, target)) {
            setActivePath((prev) => [...prev, target]);
          }
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const tile = board.grid[row][col];
        if (tile.isWall || !tile.letter) return;
        if (tile.wordId && solvedWordIds.has(tile.wordId)) return;
        if (!isDragging) {
          setIsDragging(true);
          setActivePath([{ row, col }]);
        } else {
          submitActivePath();
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (activePath.length > 0) {
          setActivePath((prev) => prev.slice(0, -1));
          if (activePath.length === 1) {
            setIsDragging(false);
          }
        }
      }
    },
    [activePath, board.cols, board.grid, board.rows, focusedCell, isDragging, solvedWordIds, submitActivePath]
  );
  // Action controls
  const handleUndo = () => {
    if (activePath.length > 0) {
      setActivePath((prev) => prev.slice(0, -1));
      return;
    }
    if (solvedWordIds.size > 0) {
      const wordsArray = Array.from(solvedWordIds);
      const lastId = wordsArray[wordsArray.length - 1];
      setSolvedWordIds((prev) => {
        const next = new Set(prev);
        next.delete(lastId);
        return next;
      });
      setIsTimerRunning(true);
    }
  };
  // Hint button action
  const handleHint = () => {
    if (!canUseHint) return;
    const unsolvedWords = board.words.filter((w) => !solvedWordIds.has(w.id));
    if (unsolvedWords.length === 0) return;
    const consumed = consumeHint();
    if (!consumed) return;
    const targetWord = unsolvedWords[0];
    // Pre-highlight starting tile
    if (!highlightedStartWords.has(targetWord.id)) {
      setHighlightedStartWords((prev) => new Set([...prev, targetWord.id]));
      return;
    }
    // Auto-solve target word if hint pressed again
    const nextSolved = new Set([...solvedWordIds, targetWord.id]);
    setSolvedWordIds(nextSolved);
    if (nextSolved.size === board.words.length) {
      handleWordPathWin(elapsedSeconds);
    }
  };
  // SVG Geometry Calculation
  const cellPercentX = 100 / board.cols;
  const cellPercentY = 100 / board.rows;
  const getCellCenterPercent = (coord: Coordinate) => ({
    x: coord.col * cellPercentX + cellPercentX / 2,
    y: coord.row * cellPercentY + cellPercentY / 2,
  });
  const generateSvgPath = (path: Coordinate[]) => {
    if (path.length < 2) return '';
    const points = path.map(getCellCenterPercent);
    return points.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      return `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  };
  const getTileSolvedWord = (tile: Tile) => {
    if (!tile.wordId || !solvedWordIds.has(tile.wordId)) return null;
    return board.words.find((w) => w.id === tile.wordId) || null;
  };
  const sortedWords = useMemo(
    () => [...board.words].sort((a, b) => a.word.length - b.word.length),
    [board.words]
  );
  const wordsSummaryLengths = useMemo(() => {
    const sortedLengths = [...board.words].map((w) => w.word.length).sort((a, b) => a - b);
    if (sortedLengths.length === 0) return '';
    if (sortedLengths.length === 1) return `${sortedLengths[0]}`;
    return `${sortedLengths.slice(0, -1).join(', ')}, and ${sortedLengths[sortedLengths.length - 1]}`;
  }, [board.words]);
  const activeWordLetters = useMemo(
    () => activePath.map((c) => board.grid[c.row]?.[c.col]?.letter || ''),
    [activePath, board.grid]
  );
  const activeWord = useMemo(() => activeWordLetters.join(''), [activeWordLetters]);
  const isTargetWordMatched = useMemo(
    () =>
      Boolean(
        activeWord.length >= 2 &&
          board.words.some((w) => !solvedWordIds.has(w.id) && w.word === activeWord)
      ),
    [activeWord, board.words, solvedWordIds]
  );
  const matchesWordLength = useMemo(
    () =>
      Boolean(
        activeWord.length >= 2 &&
          board.words.some((w) => !solvedWordIds.has(w.id) && w.word.length === activeWord.length)
      ),
    [activeWord.length, board.words, solvedWordIds]
  );
  return (
    <GameShell
      className={styles.gamePage}
      onPointerUp={handleBoardPointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Word Path Puzzle Game"
    >
      <GameShell.Header
        title="Word Path"
        subtitle={`Topic: ${board.theme || board.title}`}
        actions={
          <div className={styles.topControls}>
            <HowToPlayButton onClick={() => setShowHowToPlayModal(true)} />
            <QuitButton onClick={() => setShowQuitModal(true)} />
          </div>
        }
      />
      {/* Top Header / Bar */}
      <div className={styles.topBar}>
        <div className={styles.diffSelector} role="radiogroup" aria-label="Difficulty">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={difficulty === d}
              className={`${styles.diffBtn} ${
                difficulty === d ? styles.diffBtnActive : ''
              }`}
              onClick={() => handleDifficultyChange(d)}
            >
              {DIFFICULTY_CONFIG[d].label}
            </button>
          ))}
        </div>
        <div className={styles.topControls}>
          <div className={styles.timerBadge}>
            <FiClock aria-hidden="true" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleNextPuzzle}
            title="Generate new puzzle"
            aria-label="New puzzle"
          >
            <FiRefreshCw aria-hidden="true" />
          </button>
        </div>
      </div>
      {/* Live Word Construction Badge */}
      <div className={styles.liveWordBadgeContainer} aria-live="polite">
        {activeWord.length > 0 ? (
          <div
            className={`${styles.liveWordBadge} ${
              isTargetWordMatched
                ? styles.liveWordMatched
                : matchesWordLength
                  ? styles.liveWordValidLength
                  : ''
            }`}
          >
            <span className={styles.liveWordFlow}>
              {activeWordLetters.map((char, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <span className={styles.liveWordArrow}>
                      <FiArrowRight aria-hidden="true" />
                    </span>
                  )}
                  <span>{char}</span>
                </React.Fragment>
              ))}
            </span>
            <span className={styles.liveWordFinal}>"{activeWord}"</span>
            {isTargetWordMatched && (
              <span className={styles.liveWordBadgeCheck}>
                <FiCheck aria-hidden="true" /> Match!
              </span>
            )}
          </div>
        ) : (
          <div className={styles.liveWordPlaceholder}>
            <span>Swipe across tiles to uncover words</span>
          </div>
        )}
      </div>
      {/* Main Grid Card */}
      <div
        className={styles.boardWrapper}
        ref={gridContainerRef}
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerUp}
        onPointerCancel={handleBoardPointerUp}
      >
        <div
          className={styles.grid}
          style={
            {
              '--board-cols': board.cols,
              '--board-rows': board.rows,
              '--word-path-scale': mobileFontScale,
            } as React.CSSProperties
          }
        >
          {board.grid.flatMap((row) =>
            row.map((tile) => {
              const solvedWord = getTileSolvedWord(tile);
              const isSelectedInDrag = isCoordInPath(activePath, {
                row: tile.row,
                col: tile.col,
              });
              const isFocused =
                Boolean(focusedCell && focusedCell.row === tile.row && focusedCell.col === tile.col);
              const isStartTileHighlighted =
                highlightedStartWords.has(tile.wordId) && tile.isStart;
              let tileBg = '#ffffff';
              if (tile.isWall || !tile.letter) {
                tileBg = '#9ca3af';
              } else if (solvedWord) {
                tileBg = solvedWord.themeColor.bg;
              } else if (isSelectedInDrag) {
                tileBg = 'rgba(168, 85, 247, 0.2)';
              }
              return (
                <button
                  key={tile.id}
                  type="button"
                  data-tile-coord
                  data-row={tile.row}
                  data-col={tile.col}
                  className={`${styles.tile} ${
                    isFocused ? styles.tileFocused : ''
                  } ${isSelectedInDrag ? styles.tileActiveDrag : ''}`}
                  style={{ '--tile-bg': tileBg } as React.CSSProperties}
                  aria-label={`Tile ${tile.letter || 'empty'} at row ${tile.row + 1}, column ${
                    tile.col + 1
                  }`}
                >
                  <div className={styles.tileInner}>
                    {/* Start tile badge with checkmark on solved */}
                    {tile.isStart && solvedWord && (
                      <div className={styles.startBadge}>
                        <FiCheck aria-hidden="true" />
                      </div>
                    )}
                    {/* Pre-highlighted starting tile badge on Easy or Hint */}
                    {tile.isStart && !solvedWord && isStartTileHighlighted && (
                      <div
                        className={`${styles.startRing} ${styles.startRingHint} ${styles.hintPulse}`}
                      />
                    )}
                    {/* Letter */}
                    <span
                      className={`${styles.letter} ${
                        board.rows >= 8 ? styles.letterSmall : ''
                      }`}
                    >
                      {tile.letter}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
        {/* SVG Ribbon / Pipe Overlays */}
        <svg className={styles.svgOverlay} viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Solved Words SVG Pipe Connectors */}
          {board.words.map((wordSol) => {
            if (!solvedWordIds.has(wordSol.id)) return null;
            const d = generateSvgPath(wordSol.path);
            const startCoord = wordSol.path[0];
            const startCenter = startCoord ? getCellCenterPercent(startCoord) : null;
            return (
              <g key={`solved-path-${wordSol.id}`}>
                {startCenter && (
                  <circle
                    cx={startCenter.x}
                    cy={startCenter.y}
                    r={Math.min(cellPercentX, cellPercentY) * 0.36}
                    fill="none"
                    stroke={wordSol.themeColor.primary}
                    strokeWidth="4"
                  />
                )}
                {d && (
                  <path
                    d={d}
                    fill="none"
                    stroke={wordSol.themeColor.primary}
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                )}
              </g>
            );
          })}
          {/* Currently Dragged Path SVG Overlay */}
          {activePath.length >= 2 && (
            <path
              d={generateSvgPath(activePath)}
              fill="none"
              stroke="#A855F7"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.65"
              strokeDasharray="4 2"
            />
          )}
        </svg>
      </div>
      {/* Word Bank Target Chips */}
      <div className={styles.wordBank}>
        {sortedWords.map((wordSol) => {
          const isSolved = solvedWordIds.has(wordSol.id);
          return (
            <div key={wordSol.id} className={styles.wordRow}>
              {wordSol.word.split('').map((letter, i) => (
                <span
                  key={`${wordSol.id}-${i}`}
                  className={`${styles.letterChip} ${
                    isSolved ? '' : styles.letterChipUnsolved
                  }`}
                  style={
                    isSolved
                      ? ({ '--chip-bg': wordSol.themeColor.primary } as React.CSSProperties)
                      : undefined
                  }
                >
                  {isSolved ? letter : ''}
                </span>
              ))}
              {isSolved && (
                <span className={styles.checkMark}>
                  <FiCheck aria-hidden="true" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Bottom Action Controls */}
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleUndo}
          disabled={activePath.length === 0 && solvedWordIds.size === 0}
        >
          Undo
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleHint}
          disabled={!canUseHint || solvedWordIds.size === board.words.length}
        >
          {hintButtonLabel}
        </button>
        <button
          type="button"
          className={styles.mobileFontScalerBtn}
          onClick={handleCycleFontScale}
          aria-label="Adjust cell font size"
        >
          <span>A+</span>
          <span>{Math.round(mobileFontScale * 100)}%</span>
        </button>
      </div>
      {/* Collapsible Instruction Drawers */}
      <div className={styles.accordion}>
        <button
          type="button"
          className={styles.accordionHeader}
          onClick={() => setHowToPlayOpen(!howToPlayOpen)}
          aria-expanded={howToPlayOpen}
        >
          <span>How to play</span>
          {howToPlayOpen ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {howToPlayOpen && (
          <div className={styles.accordionBody}>
            <p>
              Find the <strong>{board.words.length} hidden words</strong> — {wordsSummaryLengths}{' '}
              letters long.
            </p>
            <p>Use every letter tile exactly once.</p>
          </div>
        )}
      </div>
      <div className={styles.accordion}>
        <button
          type="button"
          className={styles.accordionHeader}
          onClick={() => setKeyboardOpen(!keyboardOpen)}
          aria-expanded={keyboardOpen}
        >
          <span>Keyboard controls</span>
          {keyboardOpen ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {keyboardOpen && (
          <div className={styles.accordionBody}>
            <p>Arrows: Move between cells</p>
            <p>Enter/Space: Toggle word selection</p>
            <p>Backspace: Delete the focused word</p>
          </div>
        )}
      </div>
      {isWon && (
        <GameOverModal
          outcome="won"
          gameTitle={`Word Path (${difficulty.toUpperCase()})`}
          subtitle={`You discovered all ${board.words.length} words in ${formatTime(elapsedSeconds)}!`}
          scoreBreakdown={scoreBreakdown || undefined}
          timeSeconds={elapsedSeconds}
          stats={[
            { label: 'Time', value: formatTime(elapsedSeconds) },
            { label: 'Words Found', value: `${solvedWordIds.size}/${board.words.length}` },
            { label: 'Hints Used', value: hintsUsed },
          ]}
          isPersonalBest={personalBest}
          onPlayAgain={handleNextPuzzle}
          playAgainLabel="Next Puzzle"
          hubHref="/games"
        />
      )}
      <QuitModal
        isOpen={showQuitModal}
        gameTitle="Word Path"
        onCancel={() => setShowQuitModal(false)}
        onConfirmQuit={() => setShowQuitModal(false)}
      />
      <HowToPlayModal
        isOpen={showHowToPlayModal}
        onClose={() => setShowHowToPlayModal(false)}
        gameTitle="Word Path"
        objective={`Find all ${board.words.length} hidden words relating to "${board.theme || board.title}" on the letter grid, using every letter tile exactly once.`}
        rules={[
          <><strong>Contiguous Paths:</strong> Connect letters horizontally, vertically, or diagonally into valid dictionary words matching the topic.</>,
          <><strong>No Reuse:</strong> Once a word is locked in, its tiles are marked and used. Every single tile on the board belongs to exactly one target word.</>,
          <><strong>Theme Alignment:</strong> Every hidden word relates directly to the board's topic shown at the top.</>,
        ]}
        controls={{
          desktop: 'Click or drag across neighboring letters to form a word. Press Enter to submit or Backspace to undo.',
          mobile: 'Swipe across adjacent letter tiles to trace a path. Tap the first letter of a word to view start hints.',
          shortcuts: 'Arrow keys: Navigate between cells. Space/Enter: Toggle path selection. Backspace: Erase current word.',
        }}
        tips={[
          'Check the word lengths list below the grid to see target word sizes.',
          'If you get stuck, use "Shuffle" to view candidate start letters or "Hint" to reveal the first letter of an unsolved word.',
        ]}
      />
      {!isWon && (
        <button
          type="button"
          className={styles.seeResultsBtn}
          onClick={() => setShowResultsModal(true)}
        >
          See results
        </button>
      )}
      {!isWon && showResultsModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Puzzle Progress</h2>
            <div className={styles.modalStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Words Found</span>
                <span className={styles.statValue}>
                  {solvedWordIds.size} / {board.words.length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Time</span>
                <span className={styles.statValue}>
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Difficulty</span>
                <span className={styles.statValue}>
                  {difficulty.toUpperCase()}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Hints Used</span>
                <span className={styles.statValue}>{hintsUsed}</span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setShowResultsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
};
export default WordPathGame;
