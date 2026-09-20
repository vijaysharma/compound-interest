import { sanctnum } from './numSanitity';
import {
  parseNavDate,
  parseAnyDate,
  getDuration,
  getDateAsISO,
  navDateToISO,
  isoDateToNavDate,
} from './dateUtils';
import { getNearest } from './navUtils';
import {
  checkNAYear,
  calculateInflatedPrice,
  getCurrencySymbolAndLocale,
} from './inflationUtils';
export type { DurationType } from './dateUtils';
export {
  sanctnum,
  parseNavDate,
  parseAnyDate,
  getDuration,
  getDateAsISO,
  navDateToISO,
  isoDateToNavDate,
  getNearest,
  checkNAYear,
  calculateInflatedPrice,
  getCurrencySymbolAndLocale,
};
export const calculateInterest = (
  p: string,
  r: string,
  m: string,
  f: string,
  t: string,
  tf: 'm' | 'y'
): number => {
  const tenure = tf === 'y' ? sanctnum(t) * 12 : sanctnum(t);
  const mode = m === '100' ? tenure : sanctnum(m);
  const principal = sanctnum(p);
  const rate = sanctnum(r);
  const frequency = sanctnum(f);
  return sanctnum(
    principal * (1 + rate / frequency / 100) ** ((frequency * mode) / 12) - principal
  );
};
export const calculatePrincipal = (
  tgt: string,
  r: string,
  f: string,
  t: string,
  tf: 'm' | 'y'
): number => {
  const tenure = tf === 'y' ? sanctnum(t) * 12 : sanctnum(t);
  const targetAmount = sanctnum(tgt);
  const rate = sanctnum(r);
  const frequency = sanctnum(f);
  return sanctnum(targetAmount / (1 + rate / frequency / 100) ** ((frequency * tenure) / 12));
};
