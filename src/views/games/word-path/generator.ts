import { THEME_COLORS } from './types';
import type {
  BoardDefinition,
  Coordinate,
  Difficulty,
  Direction,
  Tile,
  WordSolution,
} from './types';
import { getWordsOfLength, THEMED_WORD_SETS } from './lexicon';
export interface GenerateOptions {
  preferredTheme?: string;
  excludeWords?: Set<string>;
  excludeSignatures?: Set<string>;
}
export const getDirection = (from: Coordinate, to: Coordinate): Direction => {
  if (to.row > from.row) return 'v';
  if (to.row < from.row) return '^';
  if (to.col > from.col) return '>';
  if (to.col < from.col) return '<';
  return '';
};
export const areNeighbors = (a: Coordinate, b: Coordinate): boolean =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
export const getBoardSignature = (board: BoardDefinition): string =>
  `${board.difficulty}:${board.words.map((w) => w.word).sort().join(',')}`;
export const buildBoardFromWords = (
  id: string,
  title: string,
  theme: string,
  difficulty: Difficulty,
  rows: number,
  cols: number,
  wordDefs: { word: string; path: Coordinate[] }[]
): BoardDefinition => {
  const words: WordSolution[] = wordDefs.map((def, idx) => ({
    id: `word-${idx}`,
    word: def.word.toUpperCase(),
    themeColor: THEME_COLORS[idx % THEME_COLORS.length],
    path: def.path,
  }));
  const grid: Tile[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      id: `${r}-${c}`,
      row: r,
      col: c,
      letter: '',
      arrow: '' as Direction,
      wordId: '',
      stepIndex: -1,
      isStart: false,
      isEnd: false,
      isWall: true,
    }))
  );
  words.forEach((wordSol) => {
    wordSol.path.forEach((coord, stepIdx) => {
      const isStart = stepIdx === 0;
      const isEnd = stepIdx === wordSol.path.length - 1;
      const nextCoord = !isEnd ? wordSol.path[stepIdx + 1] : null;
      const arrow = nextCoord ? getDirection(coord, nextCoord) : '';
      grid[coord.row][coord.col] = {
        id: `${coord.row}-${coord.col}`,
        row: coord.row,
        col: coord.col,
        letter: wordSol.word[stepIdx] || '',
        arrow,
        wordId: wordSol.id,
        stepIndex: stepIdx,
        isStart,
        isEnd,
        isWall: false,
      };
    });
  });
  return {
    id,
    title,
    theme,
    difficulty,
    rows,
    cols,
    words,
    grid,
  };
};
const PARTITION_OPTIONS: Record<Difficulty, number[][]> = {
  easy: [
    [5, 6, 7, 7],
    [4, 6, 7, 8],
    [5, 5, 7, 8],
    [4, 5, 7, 9],
    [5, 5, 5, 5, 5],
    [6, 6, 6, 7],
  ],
  medium: [
    [6, 7, 8, 9, 12],
    [5, 6, 7, 8, 8, 8],
    [5, 7, 8, 10, 12],
    [6, 7, 9, 10, 10],
    [5, 6, 7, 7, 8, 9],
    [6, 6, 7, 7, 8, 8],
  ],
  hard: [
    [7, 8, 9, 10, 10, 10, 10],
    [6, 7, 8, 9, 10, 12, 12],
    [8, 8, 8, 8, 8, 8, 8, 8],
    [7, 7, 8, 8, 10, 12, 12],
    [6, 8, 8, 9, 9, 12, 12],
  ],
};
/**
 * Procedural partitioner: partitions an R x C grid into non-overlapping
 * paths that sum up to R * C cells, and fills them with unique valid words.
 */
export const generateProceduralBoard = (
  difficulty: Difficulty,
  optionsInput?: string | GenerateOptions
): BoardDefinition => {
  const options: GenerateOptions =
    typeof optionsInput === 'string'
      ? { preferredTheme: optionsInput }
      : optionsInput || {};
  const { preferredTheme, excludeWords, excludeSignatures } = options;
  let rows = 5;
  let cols = 5;
  if (difficulty === 'medium') {
    rows = 6;
    cols = 7;
  } else if (difficulty === 'hard') {
    rows = 8;
    cols = 8;
  }
  const partitions = PARTITION_OPTIONS[difficulty];
  const totalCells = rows * cols;
  for (let attempt = 0; attempt < 25; attempt++) {
    const theme =
      preferredTheme ||
      THEMED_WORD_SETS[Math.floor(Math.random() * THEMED_WORD_SETS.length)].theme;
    const validPartitions = partitions.filter((part) => {
      const neededCountByLen: Record<number, number> = {};
      part.forEach((l) => {
        neededCountByLen[l] = (neededCountByLen[l] || 0) + 1;
      });
      return Object.entries(neededCountByLen).every(([lStr, count]) => {
        const l = Number(lStr);
        const available = getWordsOfLength(l, theme, excludeWords);
        return available.length >= count;
      });
    });
    const candidatePartitions = validPartitions.length > 0 ? validPartitions : partitions;
    const targetLengths = [
      ...candidatePartitions[Math.floor(Math.random() * candidatePartitions.length)],
    ];
    targetLengths.sort(() => Math.random() - 0.5);
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const getUnvisitedNeighbors = (r: number, c: number): Coordinate[] => {
      const candidates: Coordinate[] = [
        { row: r - 1, col: c },
        { row: r + 1, col: c },
        { row: r, col: c - 1 },
        { row: r, col: c + 1 },
      ];
      return candidates.filter(
        (coord) =>
          coord.row >= 0 &&
          coord.row < rows &&
          coord.col >= 0 &&
          coord.col < cols &&
          !visited[coord.row][coord.col]
      );
    };
    const findFirstUnvisited = (): Coordinate | null => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!visited[r][c]) return { row: r, col: c };
        }
      }
      return null;
    };
    const generatePaths = (): Coordinate[][] | null => {
      const paths: Coordinate[][] = [];
      let iterations = 0;
      const startTime = Date.now();
      const recurse = (pathIdx: number): boolean => {
        if (iterations++ > 5000 || Date.now() - startTime > 100) return false;
        if (pathIdx >= targetLengths.length) {
          return paths.reduce((sum, p) => sum + p.length, 0) === totalCells;
        }
        const length = targetLengths[pathIdx];
        const start = findFirstUnvisited();
        if (!start) return false;
        const currentPath: Coordinate[] = [start];
        visited[start.row][start.col] = true;
        const step = (curr: Coordinate): boolean => {
          if (iterations++ > 5000 || Date.now() - startTime > 100) return false;
          if (currentPath.length === length) {
            paths.push([...currentPath]);
            if (recurse(pathIdx + 1)) return true;
            paths.pop();
            return false;
          }
          const neighbors = getUnvisitedNeighbors(curr.row, curr.col);
          neighbors.sort(() => Math.random() - 0.5);
          for (const next of neighbors) {
            visited[next.row][next.col] = true;
            currentPath.push(next);
            if (step(next)) return true;
            currentPath.pop();
            visited[next.row][next.col] = false;
          }
          return false;
        };
        const success = step(start);
        if (!success) {
          visited[start.row][start.col] = false;
        }
        return success;
      };
      if (recurse(0)) return paths;
      return null;
    };
    let generatedPaths: Coordinate[][] | null = null;
    for (let pathAttempt = 0; pathAttempt < 10; pathAttempt++) {
      for (let r = 0; r < rows; r++) visited[r].fill(false);
      generatedPaths = generatePaths();
      if (generatedPaths && generatedPaths.length === targetLengths.length) {
        break;
      }
    }
    // Fallback: randomized serpentine partition
    if (!generatedPaths || generatedPaths.length !== targetLengths.length) {
      const serpentine: Coordinate[] = [];
      const rowOrder = Array.from({ length: rows }, (_, r) => r);
      if (Math.random() > 0.5) rowOrder.reverse();
      rowOrder.forEach((r, rIdx) => {
        const rowCols = Array.from({ length: cols }, (_, c) => c);
        if (rIdx % 2 === 1) rowCols.reverse();
        rowCols.forEach((c) => serpentine.push({ row: r, col: c }));
      });
      generatedPaths = [];
      let offset = 0;
      targetLengths.forEach((len) => {
        generatedPaths!.push(serpentine.slice(offset, offset + len));
        offset += len;
      });
    }
    // Assign strictly themed words without general fallbacks
    const usedWordsInBoard = new Set<string>();
    let hasMissingThemedWord = false;
    const wordDefs = generatedPaths.map((path, idx) => {
      const len = path.length;
      const themedPool = getWordsOfLength(len, theme, excludeWords).filter(
        (w) => !usedWordsInBoard.has(w)
      );
      if (themedPool.length === 0) {
        hasMissingThemedWord = true;
        return {
          word: `WORD${idx}`.padEnd(len, 'S'),
          path,
        };
      }
      const word = themedPool[Math.floor(Math.random() * themedPool.length)];
      usedWordsInBoard.add(word);
      return {
        word,
        path,
      };
    });
    if (hasMissingThemedWord) {
      continue;
    }
    const uniqueId = `gen-${difficulty}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const candidateBoard = buildBoardFromWords(
      uniqueId,
      theme,
      theme,
      difficulty,
      rows,
      cols,
      wordDefs
    );
    const signature = getBoardSignature(candidateBoard);
    if (
      !excludeSignatures ||
      !excludeSignatures.has(signature) ||
      attempt === 24
    ) {
      return candidateBoard;
    }
  }
  // Fallback board
  const fallbackPartition = partitions[0];
  const serpentine: Coordinate[] = [];
  for (let r = 0; r < rows; r++) {
    const rowCols = Array.from({ length: cols }, (_, c) => c);
    if (r % 2 === 1) rowCols.reverse();
    rowCols.forEach((c) => serpentine.push({ row: r, col: c }));
  }
  let offset = 0;
  const usedWords = new Set<string>();
  const wordDefs = fallbackPartition.map((len, idx) => {
    const path = serpentine.slice(offset, offset + len);
    offset += len;
    const pool = getWordsOfLength(len).filter((w) => !usedWords.has(w));
    const word =
      pool[Math.floor(Math.random() * pool.length)] ||
      `WORD${idx}`.padEnd(len, 'S');
    usedWords.add(word);
    return { word, path };
  });
  return buildBoardFromWords(
    `gen-fallback-${Date.now()}`,
    'Word Path Puzzle',
    'General',
    difficulty,
    rows,
    cols,
    wordDefs
  );
};
