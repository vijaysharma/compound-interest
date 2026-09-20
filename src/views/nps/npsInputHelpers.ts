import type { NPSCalculationResult } from '../../utilities/npsCalculations';
export function getAnnuityTitle(npsResult: NPSCalculationResult): string {
  if (npsResult.isSmallCorpus) {
    return `Annuity Share (Corpus ≤ ₹${(npsResult.smallCorpusThreshold / 100000).toFixed(1)}L: Optional 0% to 100%)`;
  }
  if (npsResult.isPremature) {
    return 'Annuity Share (Premature Exit < Age 60: PFRDA Min 80%)';
  }
  return 'Annuity Allocation Share (PFRDA Mandatory Min 40%)';
}
export function getAnnuitySteps(npsResult: NPSCalculationResult) {
  if (npsResult.isSmallCorpus) {
    return [
      { id: 'a0', label: '0% (Full Lump Sum)', value: 0 },
      { id: 'a40', label: '40%', value: 40 },
      { id: 'a60', label: '60%', value: 60 },
      { id: 'a80', label: '80%', value: 80 },
      { id: 'a100', label: '100%', value: 100 },
    ];
  }
  if (npsResult.isPremature) {
    return [
      { id: 'a80', label: '80% (Min)', value: 80 },
      { id: 'a90', label: '90%', value: 90 },
      { id: 'a100', label: '100%', value: 100 },
    ];
  }
  return [
    { id: 'a40', label: '40% (Min)', value: 40 },
    { id: 'a50', label: '50%', value: 50 },
    { id: 'a60', label: '60%', value: 60 },
    { id: 'a80', label: '80%', value: 80 },
    { id: 'a100', label: '100%', value: 100 },
  ];
}
