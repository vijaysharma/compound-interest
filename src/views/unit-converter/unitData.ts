export const unitTypes = {
  Length: {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344,
  },
  Area: {
    'sq m': 1,
    'sq km': 1000000,
    'sq ft': 0.09290304,
    'sq yd': 0.83612736,
    acre: 4046.8564224,
    hectare: 10000,
    cent: 40.468564224,
    'kottah (WB)': 66.8901888,
    'katha (Bihar)': 126.4642632,
    'katha (Assam)': 267.5607552,
    'katha (UP)': 126.3481344,
    guntha: 101.17141056,
    'ground (TN)': 222.967296,
    'bigha (WB)': 1337.803776,
  },
  Weight: {
    mg: 0.000001,
    g: 0.001,
    kg: 1,
    ton: 1000,
    oz: 0.0283495,
    lb: 0.453592,
  },
  Volume: {
    ml: 0.001,
    l: 1,
    'US gal': 3.78541,
    'US qt': 0.946353,
    'US pt': 0.473176,
    'US cup': 0.24,
    'US fl oz': 0.0295735,
    barrel: 158.9873,
  },
  Speed: {
    'm/s': 1,
    'km/h': 0.277778,
    mph: 0.44704,
    knot: 0.514444,
  },
  Data: {
    B: 1,
    KB: 1024,
    MB: 1048576,
    GB: 1073741824,
    TB: 1099511627776,
    PB: 1125899906842624,
  },
};
export type UnitCategory = keyof typeof unitTypes | 'Temperature';
export interface SavedState {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  inputValue: string;
}
export const VALID_CATEGORIES: Set<string> = new Set([
  'Length',
  'Weight',
  'Temperature',
  'Area',
  'Volume',
  'Speed',
  'Data',
]);
export const DEFAULT_STATE: SavedState = {
  category: 'Length',
  fromUnit: 'm',
  toUnit: 'ft',
  inputValue: '1',
};
export const STORAGE_KEY = 'unit_converter_state';
export const convertValue = (
  val: number,
  from: string,
  to: string,
  category: UnitCategory
): number | null => {
  if (category === 'Temperature') {
    let c = 0;
    if (from === 'C') c = val;
    else if (from === 'F') c = ((val - 32) * 5) / 9;
    else if (from === 'K') c = val - 273.15;
    if (to === 'C') return c;
    if (to === 'F') return (c * 9) / 5 + 32;
    if (to === 'K') return c + 273.15;
    return null;
  }
  const catData = unitTypes[category];
  const fromFactor = catData?.[from as keyof typeof catData];
  const toFactor = catData?.[to as keyof typeof catData];
  if (!fromFactor || !toFactor) return null;
  return (val * fromFactor) / toFactor;
};
export const fmt = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 6 });
