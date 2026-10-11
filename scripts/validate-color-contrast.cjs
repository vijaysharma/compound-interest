/**
 * WCAG 2.2 AA Automated Contrast Validation Script
 * Tests foreground/background color combinations emitted by `src/styles/_theme.scss`.
 * Validates normal text (>= 4.5:1), large text / graphical UI bounds (>= 3.0:1).
 */

const fs = require('fs');
const path = require('path');
const sass = require('sass');

// 1. Compile _theme.scss to get computed values
const themePath = path.resolve(__dirname, '../src/styles/_theme.scss');
const compiled = sass.compile(themePath);
const css = compiled.css;

// Helper: parse hex, rgb, or color keyword to [r, g, b] (0..1)
function parseColor(str) {
  str = str.trim();
  if (str === 'white') return [1, 1, 1];
  if (str === 'black') return [0, 0, 0];
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16) / 255,
        parseInt(hex[1] + hex[1], 16) / 255,
        parseInt(hex[2] + hex[2], 16) / 255,
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
    ];
  }
  const rgbMatch = str.match(/rgba?\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)/);
  if (rgbMatch) {
    return [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map((val) => {
      if (val.endsWith('%')) {
        return parseFloat(val) / 100;
      }
      return parseFloat(val) / 255;
    });
  }
  throw new Error(`Unable to parse color: ${str}`);
}

// Relative luminance per WCAG 2.2
function relativeLuminance([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

// Contrast ratio
function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(parseColor(c1));
  const l2 = relativeLuminance(parseColor(c2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function extractBlocks(cssString) {
  // Find all selectors and their blocks
  const blocks = {};
  const regex = /([^{]+)\{([^}]+)\}/gs;
  let match;
  while ((match = regex.exec(cssString)) !== null) {
    const sel = match[1].trim();
    const content = match[2];
    const vars = {};
    const lines = content.split(';').map((l) => l.trim());
    for (const line of lines) {
      if (line.startsWith('--')) {
        const idx = line.indexOf(':');
        if (idx !== -1) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          if (!val.startsWith('var(')) {
            vars[key] = val;
          }
        }
      }
    }
    blocks[sel] = vars;
  }
  return blocks;
}

const blocks = extractBlocks(css);
let lightVars = {};
let darkVars = {};

for (const [sel, vars] of Object.entries(blocks)) {
  if (sel.includes(':root') || sel.includes('fantasy')) {
    Object.assign(lightVars, vars);
  }
  if (sel.includes('dark')) {
    Object.assign(darkVars, vars);
  }
}

console.log(`Loaded ${Object.keys(lightVars).length} light CSS variables and ${Object.keys(darkVars).length} dark CSS variables.`);

// Test matrix
const pairsToTest = [
  // Normal text (>= 4.5:1)
  { label: 'Primary Brand Button Text', fg: '--color-action-primary-text', bg: '--color-action-primary-bg', target: 4.5 },
  { label: 'Primary Button Hover Text', fg: '--color-action-primary-text', bg: '--color-action-primary-bg-hover', target: 4.5 },
  { label: 'Body Text on White Surface', fg: '--color-text-primary', bg: '--color-surface', target: 4.5 },
  { label: 'Secondary Text on Surface', fg: '--color-text-secondary', bg: '--color-surface', target: 4.5 },
  { label: 'Brand Link Text on Surface', fg: '--color-text-link', bg: '--color-surface', target: 4.5 },
  { label: 'Link Hover Text on Surface', fg: '--color-text-link-hover', bg: '--color-surface', target: 4.5 },
  { label: 'Page Heading on Page BG', fg: '--color-heading', bg: '--color-page', target: 4.5 },
  { label: 'Input Text on Input BG', fg: '--color-input-text', bg: '--color-input-bg', target: 4.5 },
  { label: 'Input Placeholder on Input BG', fg: '--color-input-placeholder', bg: '--color-input-bg', target: 4.5 },
  { label: 'Profit Text on Profit Surface', fg: '--color-profit-text', bg: '--color-profit-surface', target: 4.5 },
  { label: 'Loss Text on Loss Surface', fg: '--color-loss-text', bg: '--color-loss-surface', target: 4.5 },
  { label: 'Warning Text on Warning Surface', fg: '--color-warning-text', bg: '--color-warning-surface', target: 4.5 },
  { label: 'Info Text on Info Surface', fg: '--color-info-text', bg: '--color-info-surface', target: 4.5 },
  { label: 'Success Text on White', fg: '--color-success-text', bg: '--color-surface', target: 4.5 },
  { label: 'Danger Text on White', fg: '--color-danger-text', bg: '--color-surface', target: 4.5 },
  { label: 'Warning Text on White', fg: '--color-warning-text', bg: '--color-surface', target: 4.5 },
  { label: 'Info Text on White', fg: '--color-info-text', bg: '--color-surface', target: 4.5 },

  // Non-text / Graphical UI / Focus / Large (>= 3.0:1)
  { label: 'Focus Ring vs Offset Surface', fg: '--color-focus-ring', bg: '--color-focus-ring-offset', target: 3.0 },
  { label: 'Input Border Focus vs Input BG', fg: '--color-input-border-focus', bg: '--color-input-bg', target: 3.0 },
  { label: 'Input Border vs Page BG', fg: '--color-input-border', bg: '--color-page', target: 3.0, allowFailInSubtle: true },
  { label: 'Brand Badge Text vs Badge BG', fg: '--color-badge-brand-text', bg: '--color-badge-brand-bg', target: 4.5 },
  { label: 'Nav Text on Nav BG', fg: '--color-nav-text', bg: '--color-nav-bg', target: 4.5 },
  { label: 'Modal Header Brand Surface vs Title', fg: '--color-text-primary', bg: '--color-modal-header-bg', target: 4.5 },
];

let failures = 0;

console.log('\n--- LIGHT THEME CONTRAST CHECK ---');
for (const p of pairsToTest) {
  const fgVal = lightVars[p.fg];
  const bgVal = lightVars[p.bg];
  if (!fgVal || !bgVal) {
    console.error(`MISSING VARIABLE: ${p.label} (fg: ${p.fg} = ${fgVal}, bg: ${p.bg} = ${bgVal})`);
    failures++;
    continue;
  }
  const ratio = contrastRatio(fgVal, bgVal);
  const pass = ratio >= p.target;
  const status = pass ? 'PASS' : (p.allowFailInSubtle ? 'WARN' : 'FAIL');
  if (!pass && !p.allowFailInSubtle) failures++;
  console.log(`[${status}] ${p.label.padEnd(36)}: ${ratio.toFixed(2)}:1 (Req: ${p.target}:1) | fg: ${fgVal} bg: ${bgVal}`);
}

console.log('\n--- DARK THEME CONTRAST CHECK ---');
const darkPairs = [
  { label: 'Primary Brand Action (Dark)', fg: '--color-action-primary-text', bg: '--color-action-primary-bg', target: 4.5 },
  { label: 'Primary Button Hover (Dark)', fg: '--color-action-primary-text', bg: '--color-action-primary-bg-hover', target: 4.5 },
  { label: 'Primary Text on Surface (Dark)', fg: '--color-text-primary', bg: '--color-surface', target: 4.5 },
  { label: 'Secondary Text on Surface (Dark)', fg: '--color-text-secondary', bg: '--color-surface', target: 4.5 },
  { label: 'Brand Link Text on Surface (Dark)', fg: '--color-text-link', bg: '--color-surface', target: 4.5 },
  { label: 'Profit Text on Profit Surface (Dark)', fg: '--color-profit-text', bg: '--color-profit-surface', target: 4.5 },
  { label: 'Loss Text on Loss Surface (Dark)', fg: '--color-loss-text', bg: '--color-loss-surface', target: 4.5 },
  { label: 'Warning Text on Warning Surface (Dark)', fg: '--color-warning-text', bg: '--color-warning-surface', target: 4.5 },
  { label: 'Info Text on Info Surface (Dark)', fg: '--color-info-text', bg: '--color-info-surface', target: 4.5 },
  { label: 'Nav Text on Nav BG (Dark)', fg: '--color-nav-text', bg: '--color-nav-bg', target: 4.5 },
  { label: 'Input Text on Input BG (Dark)', fg: '--color-input-text', bg: '--color-input-bg', target: 4.5 },
];

for (const p of darkPairs) {
  const fgVal = darkVars[p.fg];
  const bgVal = darkVars[p.bg];
  if (!fgVal || !bgVal) {
    console.error(`MISSING VARIABLE: ${p.label} (fg: ${p.fg} = ${fgVal}, bg: ${p.bg} = ${bgVal})`);
    failures++;
    continue;
  }
  const ratio = contrastRatio(fgVal, bgVal);
  const pass = ratio >= p.target;
  const status = pass ? 'PASS' : 'FAIL';
  if (!pass) failures++;
  console.log(`[${status}] ${p.label.padEnd(36)}: ${ratio.toFixed(2)}:1 (Req: ${p.target}:1) | fg: ${fgVal} bg: ${bgVal}`);
}

console.log(`\nContrast Validation Finished. Total Critical Failures: ${failures}`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('All required WCAG 2.2 AA contrast tests PASSED.');
}
