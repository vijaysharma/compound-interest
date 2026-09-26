import { formatAmfiDate } from './amfiDate';
import type { AmfiChunk } from './amfiTypes';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_CHUNK_DAYS = 89; // Strict <= 90 days limit
function toIsoString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function generateAmfiChunks(fromIso: string, toIso: string): AmfiChunk[] {
  const start = new Date(`${fromIso}T00:00:00Z`);
  const end = new Date(`${toIso}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start.getTime() > end.getTime()) {
    return [];
  }
  const chunks: AmfiChunk[] = [];
  let currentStart = start.getTime();
  const endMs = end.getTime();
  while (currentStart <= endMs) {
    const nextEndMs = Math.min(currentStart + MAX_CHUNK_DAYS * MS_PER_DAY, endMs);
    const chunkStartDate = new Date(currentStart);
    const chunkEndDate = new Date(nextEndMs);
    const chunkFromIso = toIsoString(chunkStartDate);
    const chunkToIso = toIsoString(chunkEndDate);
    chunks.push({
      fromIso: chunkFromIso,
      toIso: chunkToIso,
      fromAmfi: formatAmfiDate(chunkFromIso),
      toAmfi: formatAmfiDate(chunkToIso),
    });
    currentStart = nextEndMs + MS_PER_DAY;
  }
  return chunks;
}
