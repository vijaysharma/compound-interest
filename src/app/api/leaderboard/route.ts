import { NextResponse } from 'next/server';
export interface LeaderboardApiEntry {
  id: string;
  gameId: string;
  gameName: string;
  difficulty: string;
  timeSeconds: number;
  score?: number;
  accuracy?: string;
  completedAt: string;
}
const mockLeaderboard: LeaderboardApiEntry[] = [
  { id: '1', gameId: 'minesweeper', gameName: 'Minesweeper', difficulty: 'easy', timeSeconds: 24, completedAt: '2026-09-26T12:00:00Z' },
  { id: '2', gameId: 'minesweeper', gameName: 'Minesweeper', difficulty: 'medium', timeSeconds: 115, completedAt: '2026-09-26T13:30:00Z' },
  { id: '3', gameId: 'sudoku', gameName: 'Sudoku', difficulty: 'easy', timeSeconds: 182, completedAt: '2026-09-27T08:15:00Z' },
  { id: '4', gameId: 'sudoku', gameName: 'Sudoku', difficulty: 'medium', timeSeconds: 340, completedAt: '2026-09-27T09:40:00Z' },
  { id: '5', gameId: 'word-path', gameName: 'Word Path', difficulty: 'easy', timeSeconds: 48, score: 5, completedAt: '2026-09-27T10:10:00Z' },
  { id: '6', gameId: 'slide-puzzle', gameName: '15-Slide Puzzle', difficulty: '4x4', timeSeconds: 76, score: 42, completedAt: '2026-09-27T11:20:00Z' },
  { id: '7', gameId: 'hitori', gameName: 'Hitori', difficulty: 'easy', timeSeconds: 65, completedAt: '2026-09-27T12:00:00Z' },
];
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  const filtered = game ? mockLeaderboard.filter((e) => e.gameId === game) : mockLeaderboard;
  return NextResponse.json({
    success: true,
    count: filtered.length,
    leaderboard: filtered,
  });
}
export async function POST() {
  return NextResponse.json({ success: false, error: 'Use server actions for score submission' }, { status: 405 });
}
