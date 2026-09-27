import type { BoardDefinition, Difficulty } from './types';
import { generateProceduralBoard, type GenerateOptions } from './generator';
import type { WorkerRequest, WorkerResponse } from './wordPath.worker';
let workerInstance: Worker | null = null;
let reqCounter = 0;
const pendingMap = new Map<number, (board: BoardDefinition) => void>();
function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null;
  if (!workerInstance && typeof Worker !== 'undefined') {
    try {
      workerInstance = new Worker(new URL('./wordPath.worker.ts', import.meta.url));
      workerInstance.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, success, board } = e.data;
        const resolve = pendingMap.get(id);
        if (resolve) {
          pendingMap.delete(id);
          if (success && board) {
            resolve(board);
          } else {
            resolve(generateProceduralBoard('medium'));
          }
        }
      };
      workerInstance.onerror = () => {
        workerInstance = null;
      };
    } catch {
      workerInstance = null;
    }
  }
  return workerInstance;
}
export async function generateBoardAsync(
  difficulty: Difficulty,
  options?: GenerateOptions
): Promise<BoardDefinition> {
  const worker = getWorker();
  if (!worker) {
    return Promise.resolve(generateProceduralBoard(difficulty, options));
  }
  const id = ++reqCounter;
  return new Promise<BoardDefinition>((resolve) => {
    pendingMap.set(id, resolve);
    const req: WorkerRequest = { id, difficulty, options };
    worker.postMessage(req);
    setTimeout(() => {
      if (pendingMap.has(id)) {
        pendingMap.delete(id);
        resolve(generateProceduralBoard(difficulty, options));
      }
    }, 500);
  });
}
