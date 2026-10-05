'use server';

import { generateQueensPuzzle, generateDailyQueensPuzzle } from '@/views/games/queens/generator';
import type { QueensPuzzle } from '@/views/games/queens/types';
import { redisIncr } from '@/lib/redis';
const QUEENS_SIZE = 7;
/**
 * Server action to generate a fresh, unique, procedural Queens puzzle.
 */
export async function generateQueensPuzzleAction(options: {
  seed?: string;
  size?: number;
  clientIp?: string;
} = {}): Promise<{
  success: boolean;
  puzzle: QueensPuzzle;
  error?: string;
}> {
  try {
    // Optional rate-limiting using redisIncr (e.g. max 60 generation requests per minute per IP)
    if (options.clientIp) {
      const rateKey = `rate:queens_gen:${options.clientIp}`;
      const count = await redisIncr(rateKey, 60);
      if (count > 60) {
        return {
          success: false,
          puzzle: generateQueensPuzzle({ size: QUEENS_SIZE }), // fallback
          error: 'Rate limit exceeded. Please wait a moment before generating more puzzles.',
        };
      }
    }

    // Board is fixed at 7×7; any requested size is ignored.
    const puzzle = generateQueensPuzzle({ seed: options.seed, size: QUEENS_SIZE });

    return {
      success: true,
      puzzle,
    };
  } catch (err: unknown) {
    console.error('Failed to generate Queens puzzle server-side:', err);
    // Graceful deterministic fallback
    const fallback = generateQueensPuzzle({ size: QUEENS_SIZE });
    return {
      success: true,
      puzzle: fallback,
    };
  }
}

/**
 * Server action for Daily Queens Challenge
 */
export async function getDailyQueensPuzzleAction(dateStr?: string): Promise<{
  success: boolean;
  puzzle: QueensPuzzle;
}> {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);
  const puzzle = generateDailyQueensPuzzle(targetDate);
  return {
    success: true,
    puzzle,
  };
}
