export const log10 = (v: number): number => {
  if (v <= 0 || isNaN(v)) throw new Error('Undefined');
  return Math.log10(v);
};
export const ln = (v: number): number => {
  if (v <= 0 || isNaN(v)) throw new Error('Undefined');
  return Math.log(v);
};
export const sinFn = (v: number, isDeg: boolean): number => {
  if (isNaN(v)) throw new Error('Undefined');
  if (isDeg) {
    const mod = ((v % 360) + 360) % 360;
    if (mod === 0 || mod === 180 || mod === 360) return 0;
    if (mod === 90) return 1;
    if (mod === 270) return -1;
    return Math.sin((v * Math.PI) / 180);
  }
  return Math.sin(v);
};
export const cosFn = (v: number, isDeg: boolean): number => {
  if (isNaN(v)) throw new Error('Undefined');
  if (isDeg) {
    const mod = ((v % 360) + 360) % 360;
    if (mod === 90 || mod === 270) return 0;
    if (mod === 0 || mod === 360) return 1;
    if (mod === 180) return -1;
    return Math.cos((v * Math.PI) / 180);
  }
  return Math.cos(v);
};
export const tanFn = (v: number, isDeg: boolean): number => {
  if (isNaN(v)) throw new Error('Undefined');
  if (isDeg) {
    const mod = ((v % 180) + 180) % 180;
    if (Math.abs(mod - 90) < 1e-9) throw new Error('Undefined');
    if (mod === 0) return 0;
    return Math.tan((v * Math.PI) / 180);
  }
  if (Math.abs(Math.cos(v)) < 1e-15) throw new Error('Undefined');
  return Math.tan(v);
};
export const asinFn = (v: number, isDeg: boolean): number => {
  if (Math.abs(v) > 1 || isNaN(v)) throw new Error('Undefined');
  const r = Math.asin(v);
  return isDeg ? (r * 180) / Math.PI : r;
};
export const acosFn = (v: number, isDeg: boolean): number => {
  if (Math.abs(v) > 1 || isNaN(v)) throw new Error('Undefined');
  const r = Math.acos(v);
  return isDeg ? (r * 180) / Math.PI : r;
};
export const atanFn = (v: number, isDeg: boolean): number => {
  if (isNaN(v)) throw new Error('Undefined');
  const r = Math.atan(v);
  return isDeg ? (r * 180) / Math.PI : r;
};
export const acoshFn = (v: number): number => {
  if (v < 1 || isNaN(v)) throw new Error('Undefined');
  return Math.acosh(v);
};
export const atanhFn = (v: number): number => {
  if (Math.abs(v) >= 1 || isNaN(v)) throw new Error('Undefined');
  return Math.atanh(v);
};
