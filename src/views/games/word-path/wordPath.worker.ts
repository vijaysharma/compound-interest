/// <reference lib="webworker" />
import { generateProceduralBoard } from './generator';
import type { BoardDefinition, Difficulty } from './types';
import type { GenerateOptions } from './generator';
export interface WorkerRequest {
  id: number;
  difficulty: Difficulty;
  options?: GenerateOptions;
}
export interface WorkerResponse {
  id: number;
  success: boolean;
  board?: BoardDefinition;
  error?: string;
}
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, difficulty, options } = e.data;
  try {
    const board = generateProceduralBoard(difficulty, options);
    (self as unknown as Worker).postMessage({ id, success: true, board });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    (self as unknown as Worker).postMessage({ id, success: false, error: message });
  }
};
