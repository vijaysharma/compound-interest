export class Decimal {
  m: bigint; // unscaled integer mantissa
  e: number; // base-10 exponent: value = m * 10^e
  constructor(m: bigint | number | string, e: number) {
    this.m = BigInt(m);
    this.e = e;
    this.normalize();
  }
  normalize() {
    if (this.m === 0n) {
      this.e = 0;
      return;
    }
    while (this.m % 10n === 0n) {
      this.m /= 10n;
      this.e += 1;
    }
  }
  static fromString(str: string): Decimal {
    str = str.trim();
    const isNeg = str.startsWith('-');
    const clean = str.replace(/^[+-]/, '');
    const sciMatch = clean.match(/^(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
    if (sciMatch) {
      const intPart = sciMatch[1] || '0';
      const fracPart = sciMatch[2] || '';
      const exp = parseInt(sciMatch[3], 10);
      const digits = intPart + fracPart;
      const decPlaces = fracPart.length;
      let m = BigInt(digits);
      if (isNeg) m = -m;
      return new Decimal(m, exp - decPlaces);
    }
    const decMatch = clean.match(/^(\d+)(?:\.(\d+))?$/);
    if (decMatch) {
      const intPart = decMatch[1] || '0';
      const fracPart = decMatch[2] || '';
      const digits = intPart + fracPart;
      const decPlaces = fracPart.length;
      let m = BigInt(digits);
      if (isNeg) m = -m;
      return new Decimal(m, -decPlaces);
    }
    return new Decimal(0n, 0);
  }
  static fromNumber(n: number): Decimal {
    if (isNaN(n) || !isFinite(n)) throw new Error('Undefined');
    return Decimal.fromString(n.toString());
  }
  add(other: Decimal): Decimal {
    const diff = this.e - other.e;
    if (diff >= 0) {
      const m1 = this.m * 10n ** BigInt(diff);
      return new Decimal(m1 + other.m, other.e);
    }
    const m2 = other.m * 10n ** BigInt(-diff);
    return new Decimal(this.m + m2, this.e);
  }
  sub(other: Decimal): Decimal {
    return this.add(new Decimal(-other.m, other.e));
  }
  mul(other: Decimal): Decimal {
    return new Decimal(this.m * other.m, this.e + other.e);
  }
  div(other: Decimal, precision = 40): Decimal {
    if (other.m === 0n) throw new Error('Undefined');
    const m = (this.m * 10n ** BigInt(precision)) / other.m;
    return new Decimal(m, this.e - other.e - precision);
  }
  toNumber(): number {
    const isNeg = this.m < 0n;
    const absM = isNeg ? -this.m : this.m;
    const s = absM.toString();
    const e = this.e;
    if (e >= 0) {
      return (isNeg ? -1 : 1) * Number(s + '0'.repeat(e));
    }
    const decPos = s.length + e;
    if (decPos > 0) {
      const str = s.slice(0, decPos) + '.' + s.slice(decPos);
      return (isNeg ? -1 : 1) * parseFloat(str);
    }
    const str = '0.' + '0'.repeat(-decPos) + s;
    return (isNeg ? -1 : 1) * parseFloat(str);
  }
  toString(): string {
    if (this.m === 0n) return '0';
    const isNeg = this.m < 0n;
    const absM = isNeg ? -this.m : this.m;
    const s = absM.toString();
    const e = this.e;
    if (e >= 0) {
      if (e + s.length > 15) {
        const exp = s.length - 1 + e;
        let mant = s[0] + (s.length > 1 ? '.' + s.slice(1) : '');
        if (mant.length > 14) mant = mant.slice(0, 14);
        mant = mant.replace(/0+$/, '').replace(/\.$/, '');
        return (isNeg ? '-' : '') + mant + 'e+' + exp;
      }
      return (isNeg ? '-' : '') + s + '0'.repeat(e);
    }
    const decPos = s.length + e;
    if (decPos > 0) {
      let frac = s.slice(decPos);
      if (frac.length > 12) frac = frac.slice(0, 12).replace(/0+$/, '');
      return (isNeg ? '-' : '') + s.slice(0, decPos) + (frac ? '.' + frac : '');
    }
    const frac = '0'.repeat(-decPos) + s;
    if (frac.length > 12) {
      const num = this.toNumber();
      return parseFloat(num.toPrecision(12)).toString();
    }
    return (isNeg ? '-' : '') + '0.' + frac;
  }
}
