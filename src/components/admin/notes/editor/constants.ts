export const CONTENT_PROPAGATE_MS = 350;
export const FONT_SIZES = [
  { label: 'Small', size: '13px', cmdVal: '2' },
  { label: 'Normal', size: '16px', cmdVal: '3' },
  { label: 'Medium', size: '18px', cmdVal: '4' },
  { label: 'Large', size: '22px', cmdVal: '5' },
  { label: 'Huge', size: '28px', cmdVal: '6' },
];
export function detectContentFontSize(html: string): string | null {
  if (!html) return null;
  const styleMatch = /style=["'][^"']*font-size:\s*(\d+px)[^"']*["']/i.exec(html);
  if (styleMatch) return styleMatch[1];
  const fontMatch = /<font[^>]*size=["'](\d)["']/i.exec(html);
  if (fontMatch) {
    const fs = FONT_SIZES.find((f) => f.cmdVal === fontMatch[1]);
    if (fs) return fs.size;
  }
  return null;
}
export const TEXT_COLORS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Slate', value: '#475569' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Pink', value: '#db2777' },
];
export const HIGHLIGHT_COLORS = [
  { label: 'None', value: 'transparent' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Purple', value: '#e9d5ff' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
];
