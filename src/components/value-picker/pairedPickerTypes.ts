import React from 'react';
import type { PickerChromeProps, PickerScale } from './chrome';
export interface PairedValuePickerOption {
  label: string;
  value: string | number;
}
export type PairedValuePickerStepData = Array<{
  id?: string;
  value: string | number;
  title?: string;
  label?: string;
}>;
export type Side = 'primary' | 'secondary';
export type PairedValuePickerScale = Exclude<PickerScale, 'auto'>;
export interface PairedValuePickerProps
  extends Omit<PickerChromeProps, 'title' | 'scale'> {
  scale?: PairedValuePickerScale;
  primaryTitle: string;
  primaryValue: number;
  onPrimaryChange: (value: number) => void;
  primaryMin?: number;
  primaryMax?: number;
  primaryStepData?: PairedValuePickerStepData;
  secondaryTitle: string;
  secondaryValue: number;
  onSecondaryChange: (value: number) => void;
  secondaryMin?: number;
  secondaryMax?: number;
  secondaryStepData?: PairedValuePickerStepData;
  bridgeLabel?: string;
  bridgeValue?: string | number;
  onBridgeChange?: (value: string) => void;
  bridgeOptions?: PairedValuePickerOption[];
  bridgeId?: string;
  bridgeSlot?: React.ReactNode;
  capSecondaryToPrimary?: boolean;
  symbol?: string | null;
  locale?: string;
  singleRow?: boolean;
  showWords?: boolean;
  allowDecimals?: boolean;
  defaultStep?: number;
  readOnly?: boolean;
}
