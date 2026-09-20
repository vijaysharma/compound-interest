import { Form16ExtractedData } from './types';
export function parseForm16Text(text: string): Partial<Form16ExtractedData> {
  // Check if JSON
  try {
    const parsedJson = JSON.parse(text);
    if (typeof parsedJson === 'object' && parsedJson !== null) {
      return parsedJson as Partial<Form16ExtractedData>;
    }
  } catch {
    // Continue to regex parsing
  }
  const data: Partial<Form16ExtractedData> = {};
  const extractNumber = (patterns: RegExp[]): number => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const clean = match[1].replace(/,/g, '').trim();
        const num = parseFloat(clean);
        if (!Number.isNaN(num) && num > 0) return num;
      }
    }
    return 0;
  };
  const extractString = (patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };
  // Extract fields
  const pan = extractString([
    /[A-Z]{5}[0-9]{4}[A-Z]{1}/i,
    /PAN(?:\s+of\s+the\s+Employee)?[:\s]+([A-Z0-9]{10})/i,
  ]);
  if (pan) data.employeePan = pan.toUpperCase();
  const tan = extractString([
    /TAN(?:\s+of\s+the\s+Employer)?[:\s]+([A-Z0-9]{10})/i,
    /[A-Z]{4}[0-9]{5}[A-Z]{1}/i,
  ]);
  if (tan) data.employerTan = tan.toUpperCase();
  const employer = extractString([
    /Name\s+and\s+address\s+of\s+the\s+Employer[:\s]+([^\n\r]+)/i,
  ]);
  if (employer) data.employerName = employer;
  const gross = extractNumber([
    /Gross\s+Salary[^\d]*([\d,]+(?:\.\d+)?)/i,
    /Salary\s+as\s+per\s+provisions\s+contained\s+in\s+sec(?:\.|\s+)17\(1\)[^\d]*([\d,]+(?:\.\d+)?)/i,
    /Total\s+Salary[^\d]*([\d,]+(?:\.\d+)?)/i,
  ]);
  if (gross > 0) data.grossSalary = gross;
  const std = extractNumber([
    /Standard\s+Deduction[^\d]*([\d,]+(?:\.\d+)?)/i,
    /16\(ia\)[^\d]*([\d,]+(?:\.\d+)?)/i,
  ]);
  if (std > 0) data.standardDeduction = std;
  const pt = extractNumber([
    /Professional\s+Tax[^\d]*([\d,]+(?:\.\d+)?)/i,
    /16\(iii\)[^\d]*([\d,]+(?:\.\d+)?)/i,
  ]);
  if (pt > 0) data.professionalTax = pt;
  const hra = extractNumber([
    /House\s+Rent\s+Allowance[^\d]*([\d,]+(?:\.\d+)?)/i,
    /10\(13A\)[^\d]*([\d,]+(?:\.\d+)?)/i,
  ]);
  if (hra > 0) data.hraReceived = hra;
  const sec80C = extractNumber([
    /80C[^\d]*([\d,]+(?:\.\d+)?)/i,
    /Chapter\s+VIA.*80C[^\d]*([\d,]+(?:\.\d+)?)/i,
  ]);
  if (sec80C > 0) data.section80C = Math.min(150000, sec80C);
  const sec80Ccd1b = extractNumber([/80CCD\(1B\)[^\d]*([\d,]+(?:\.\d+)?)/i]);
  if (sec80Ccd1b > 0) data.section80Ccd1b = Math.min(50000, sec80Ccd1b);
  const sec80D = extractNumber([/80D[^\d]*([\d,]+(?:\.\d+)?)/i]);
  if (sec80D > 0) data.section80D = sec80D;
  const tds = extractNumber([
    /Total\s+tax\s+deducted[^\d]*([\d,]+(?:\.\d+)?)/i,
    /Tax\s+deducted\s+at\s+source[^\d]*([\d,]+(?:\.\d+)?)/i,
    /TDS[^\d]*([\d,]+(?:\.\d+)?)/i,
  ]);
  if (tds > 0) data.tdsDeducted = tds;
  return data;
}
