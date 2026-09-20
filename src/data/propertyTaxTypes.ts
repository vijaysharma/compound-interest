export interface PropertyTaxInputs {
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number;
  saleDate: string; // YYYY-MM-DD
  salePrice: number;
  improvementCost: number;
  improvementYear?: string;
  transferExpenses: number;
  sec54Exemption: number; // Residential property reinvestment (Cap ₹10 Cr)
  sec54ecExemption: number; // Capital Gains Bonds (Cap ₹50 Lakh)
  stcgSlabRate: number; // For STCG if held <= 24 months (default 30%)
}
export interface PropertyTaxComparison {
  holdingDays: number;
  holdingMonths: number;
  isLongTerm: boolean;
  isGrandfathered: boolean; // Purchased before 23-July-2024
  purchaseFY: string;
  saleFY: string;
  purchaseCII: number;
  saleCII: number;
  improvementCII: number;
  netSaleConsideration: number;
  oldRegime: {
    applicable: boolean;
    indexedAcquisitionCost: number;
    indexedImprovementCost: number;
    totalIndexedCost: number;
    grossGain: number;
    exemptions: number;
    taxableGain: number;
    baseTax: number;
    cess: number;
    totalTax: number;
    netInHand: number;
    effectiveRate: number;
  };
  newRegime: {
    actualCost: number;
    grossGain: number;
    exemptions: number;
    taxableGain: number;
    baseTax: number;
    cess: number;
    totalTax: number;
    netInHand: number;
    effectiveRate: number;
  };
  stcg: {
    applicable: boolean;
    actualCost: number;
    taxableGain: number;
    slabRate: number;
    totalTax: number;
    netInHand: number;
  };
  recommendedOption: 'old' | 'new' | 'stcg';
  taxSavings: number;
  summaryNote: string;
}
