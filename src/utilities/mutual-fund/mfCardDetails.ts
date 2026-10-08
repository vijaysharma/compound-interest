export interface ParsedFundName {
  cleanName: string;
  category: string;
  planType: string;
  optionType: string;
}

const CATEGORY_PATTERNS: Array<{ cat: string; re: RegExp }> = [
  { cat: 'Arbitrage', re: /arbitrage/i },
  { cat: 'Multi Asset', re: /multi[\s-]?asset/i },
  { cat: 'Balanced Advantage', re: /balanced[\s-]?advantage/i },
  { cat: 'Large & Mid Cap', re: /large\s*(&|and)\s*mid/i },
  { cat: 'Large Cap', re: /large[\s-]?cap|bluechip/i },
  { cat: 'Mid Cap', re: /mid[\s-]?cap/i },
  { cat: 'Small Cap', re: /small[\s-]?cap/i },
  { cat: 'Flexi Cap', re: /flexi[\s-]?cap/i },
  { cat: 'Index', re: /index|nifty|sensex/i },
  { cat: 'Liquid', re: /liquid/i },
  { cat: 'Overnight', re: /overnight/i },
  { cat: 'Ultra Short', re: /ultra[\s-]?short/i },
  { cat: 'Low Duration', re: /low[\s-]?duration/i },
  { cat: 'Short Duration', re: /short[\s-]?duration/i },
  { cat: 'Corporate Bond', re: /corporate[\s-]?bond/i },
  { cat: 'Banking & PSU', re: /banking(\s*&|\s*and)?\s*psu/i },
  { cat: 'Dynamic Bond', re: /dynamic[\s-]?bond/i },
  { cat: 'Gilt', re: /gilt/i },
  { cat: 'Credit Risk', re: /credit[\s-]?risk/i },
  { cat: 'ELSS', re: /elss|tax[\s-]?saver/i },
  { cat: 'Focused', re: /focused/i },
  { cat: 'Value', re: /value[\s-]?fund|contra/i },
  { cat: 'Dividend Yield', re: /dividend[\s-]?yield/i },
  { cat: 'Aggressive Hybrid', re: /aggressive[\s-]?hybrid/i },
  { cat: 'Conservative Hybrid', re: /conservative[\s-]?hybrid/i },
  { cat: 'Equity Savings', re: /equity[\s-]?savings/i },
  { cat: 'Equity', re: /equity/i },
  { cat: 'Debt', re: /debt/i },
];

export function parseFundSchemeDetails(rawSchemeName: string): ParsedFundName {
  let cleanName = rawSchemeName || '';

  let planType = '';
  if (/direct/i.test(cleanName)) planType = 'Direct';
  else if (/regular/i.test(cleanName)) planType = 'Regular';

  let optionType = '';
  if (/growth/i.test(cleanName)) optionType = 'Growth';
  else if (/idcw|dividend/i.test(cleanName)) optionType = 'IDCW';

  // Extract category
  let category = '';
  for (const { cat, re } of CATEGORY_PATTERNS) {
    if (re.test(cleanName)) {
      category = cat;
      break;
    }
  }

  // Clean the title: remove (erstwhile ...), - Direct Plan ..., - Regular Plan ..., - Growth ..., etc.
  cleanName = cleanName
    .replace(/\s*\([^)]*erstwhile[^)]*\)/gi, '')
    .replace(/\s*-\s*direct\s*plan.*/gi, '')
    .replace(/\s*-\s*regular\s*plan.*/gi, '')
    .replace(/\s*-\s*growth.*/gi, '')
    .replace(/\s*-\s*idcw.*/gi, '')
    .replace(/\s*-\s*dividend.*/gi, '')
    .trim();

  // If cleanName ends with a trailing dash or comma, clean it up
  cleanName = cleanName.replace(/[\s\-,]+$/, '').trim();

  return {
    cleanName: cleanName || rawSchemeName,
    category,
    planType,
    optionType,
  };
}
