import { RT, StepAmountType } from "../types/types";

// Lumpsum Calculation
export const PA = "3000000";
export const RATE_TENURE: RT = {
  roi: "7.1",
  tenure: "2",
  tenureFormat: "y",
};
export const STEP_AMOUNT: StepAmountType[] = [
  { id: "p1", value: "50000000", title: "5Cr" },
  { id: "p2", value: "5000000", title: "50L" },
  { id: "p3", value: "500000", title: "5L" },
  { id: "p4", value: "50000", title: "50K" },
  { id: "p5", value: "5000", title: "5K" },
  { id: "p6", value: "500", title: "500" },
  { id: "p7", value: "50", title: "50" },
];

export const PAYOUT_MODE_DATA = [
  { id: "pm1", value: "1", title: "Monthly" },
  { id: "pm2", value: "3", title: "Quarterly" },
  { id: "pm3", value: "12", title: "Yearly" },
  { id: "pm4", value: "100", title: "Cumulative" },
];

export const FREQUENCY_DATA = [
  { id: "fr1", value: "12", title: "Monthly" },
  { id: "fr2", value: "4", title: "Quarterly" },
  { id: "fr3", value: "1", title: "Yearly" },
];
