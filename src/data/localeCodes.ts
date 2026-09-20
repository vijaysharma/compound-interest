import { LOCALES_PART_1 } from './locales/localesPart1';
import { LOCALES_PART_2 } from './locales/localesPart2';
import { LOCALES_PART_3 } from './locales/localesPart3';
import { LOCALES_PART_4 } from './locales/localesPart4';
import { LOCALES_PART_5 } from './locales/localesPart5';
import { LOCALES_PART_6 } from './locales/localesPart6';
export interface LocaleCodeEntry {
  name: string;
  code: string;
}
export const LOCALE_CODES: LocaleCodeEntry[] = [
  ...LOCALES_PART_1,
  ...LOCALES_PART_2,
  ...LOCALES_PART_3,
  ...LOCALES_PART_4,
  ...LOCALES_PART_5,
  ...LOCALES_PART_6,
];
export default LOCALE_CODES;
