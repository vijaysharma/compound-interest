const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};
export interface ParsedDateResult {
  navDate: string; // DD-MM-YYYY
  isoDate: string; // YYYY-MM-DD
}
export function parseAmfiDate(raw: string): ParsedDateResult | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('-');
  if (parts.length !== 3) return null;
  if (/^\d{1,2}$/.test(parts[0]) && /^[a-zA-Z]{3}$/.test(parts[1]) && /^\d{4}$/.test(parts[2])) {
    const day = parts[0].padStart(2, '0');
    const month = MONTH_MAP[parts[1].toLowerCase()];
    const year = parts[2];
    if (!month) return null;
    return { navDate: `${day}-${month}-${year}`, isoDate: `${year}-${month}-${day}` };
  }
  if (/^\d{1,2}$/.test(parts[0]) && /^\d{1,2}$/.test(parts[1]) && /^\d{4}$/.test(parts[2])) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return { navDate: `${day}-${month}-${year}`, isoDate: `${year}-${month}-${day}` };
  }
  if (/^\d{4}$/.test(parts[0]) && /^\d{1,2}$/.test(parts[1]) && /^\d{1,2}$/.test(parts[2])) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return { navDate: `${day}-${month}-${year}`, isoDate: `${year}-${month}-${day}` };
  }
  return null;
}
export function formatAmfiDate(isoOrDate: string | Date): string {
  if (typeof isoOrDate === 'string') {
    const [y, m, d] = isoOrDate.split('-');
    const mIdx = Number(m) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${d.padStart(2, '0')}-${MONTH_NAMES[mIdx]}-${y}`;
    }
  }
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()] ?? 'Jan';
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
