import type { TaxIncomeInputs, TaxRegime } from './types';
export function calculateDeductions(inputs: TaxIncomeInputs, regime: TaxRegime): number {
  const {
    basicSalary,
    section80C,
    section80Ccd1b,
    section80Ccd2,
    section80D_self,
    selfSeniorCitizen = false,
    section80D_parents,
    parentsSeniorCitizen = false,
    section80E,
    section80G,
    section80Tta,
    savingsInterest,
    section80Gg = 0,
    section80Ddb = 0,
    section80U = 0,
    section80Eea = 0,
    section80Eeb = 0,
    section80Dd = 0,
    section80Ggc = 0,
    customDeductions = [],
    otherDeductions,
    ageCategory,
  } = inputs;
  if (regime === 'new') {
    return Math.min(section80Ccd2, basicSalary * 0.14);
  }
  const capped80C = Math.min(150000, Math.max(0, section80C));
  const capped80CCD1B = Math.min(50000, Math.max(0, section80Ccd1b));
  const capped80CCD2 = Math.min(section80Ccd2, basicSalary * 0.14);
  const maxSelf80D = selfSeniorCitizen || ageCategory === 'senior' || ageCategory === 'super_senior' ? 50000 : 25000;
  const capped80D_self = Math.min(maxSelf80D, Math.max(0, section80D_self));
  const maxParents80D = parentsSeniorCitizen ? 50000 : 25000;
  const capped80D_parents = Math.min(maxParents80D, Math.max(0, section80D_parents));
  const max80TTA = ageCategory === 'senior' || ageCategory === 'super_senior' ? 50000 : 10000;
  const capped80TTA = Math.min(max80TTA, Math.max(0, section80Tta, savingsInterest));
  const capped80GG = Math.min(60000, Math.max(0, section80Gg));
  const max80DDB = parentsSeniorCitizen || selfSeniorCitizen || ageCategory !== 'general' ? 100000 : 40000;
  const capped80DDB = Math.min(max80DDB, Math.max(0, section80Ddb));
  const capped80U = Math.min(125000, Math.max(0, section80U));
  const capped80EEA = Math.min(150000, Math.max(0, section80Eea));
  const capped80EEB = Math.min(150000, Math.max(0, section80Eeb));
  const capped80DD = Math.min(125000, Math.max(0, section80Dd));
  const capped80GGC = Math.max(0, section80Ggc);
  const customSum = (customDeductions || []).reduce(
    (sum, item) => sum + Math.max(0, Number(item.amount) || 0),
    0
  );
  return (
    capped80C +
    capped80CCD1B +
    capped80CCD2 +
    capped80D_self +
    capped80D_parents +
    Math.max(0, section80E) +
    Math.max(0, section80G) +
    capped80TTA +
    capped80GG +
    capped80DDB +
    capped80U +
    capped80EEA +
    capped80EEB +
    capped80DD +
    capped80GGC +
    customSum +
    Math.max(0, otherDeductions)
  );
}
