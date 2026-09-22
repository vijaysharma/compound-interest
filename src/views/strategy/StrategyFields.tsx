'use client';
import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { DEFAULT_AMOUNT_STEPS } from '../../data/valuePickerData';
import { sanctnum } from '../../utilities/numSanitity';
import { FREQUENCY_LABEL, FREQUENCY_OPTIONS } from './schedule';
import { MAX_STEP_UP_PCT } from './defaults';
import type { Frequency } from './types';
import styles from './StrategyCalculator.module.scss';
interface AmountFieldProps {
  title: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  symbol?: string;
  stepData?: { id: string; value: string; title: string }[];
}
/** Rupee (or percentage) input, built on the shared ValuePicker. */
export const AmountField = ({ title, value, onChange, max, symbol, stepData }: AmountFieldProps) => (
  <ValuePicker
    title={title}
    value={String(value)}
    onChange={(next) => onChange(sanctnum(next, 0, max))}
    stepData={stepData ?? DEFAULT_AMOUNT_STEPS}
    singleRow
    compact
    embedded
    condensed
    showWords={false}
    symbol={symbol ?? '₹'}
    min={0}
    max={max}
  />
);
export const PERCENT_STEPS = [
  { id: 'pc-25', value: '25', title: '25%' },
  { id: 'pc-10', value: '10', title: '10%' },
  { id: 'pc-5', value: '5', title: '5%' },
  { id: 'pc-1', value: '1', title: '1%' },
];
interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
}
export const DateField = ({ label, value, onChange, minDate }: DateFieldProps) => (
  <ValuePicker
    variant="date-range"
    singleDate
    startTitle={label}
    startDate={value}
    setStartDate={onChange}
    startMinDate={minDate}
    compact
    embedded
    condensed
  />
);
interface DateRangeFieldProps {
  startLabel: string;
  endLabel: string;
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  minDate?: string;
}
export const DateRangeField = ({
  startLabel, endLabel, startDate, endDate, onStartChange, onEndChange, minDate,
}: DateRangeFieldProps) => (
  <ValuePicker
    variant="date-range"
    startTitle={startLabel}
    endTitle={endLabel}
    startDate={startDate}
    endDate={endDate}
    setStartDate={onStartChange}
    setEndDate={onEndChange}
    startMinDate={minDate}
    compact
    embedded
    condensed
  />
);
interface FrequencyFieldProps {
  title?: string;
  value: Frequency;
  onChange: (value: Frequency) => void;
}
export const FrequencyField = ({ title, value, onChange }: FrequencyFieldProps) => (
  <JoinedButtonGroup<Frequency>
    title={title}
    data={FREQUENCY_OPTIONS.map((frequency) => ({
      id: frequency,
      value: frequency,
      title: FREQUENCY_LABEL[frequency],
    }))}
    selectedValue={value}
    updateSelectedValue={onChange}
    sizePrefix="xs"
    compact
  />
);
interface StepUpSelectProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}
const STEP_UP_CHOICES = Array.from({ length: MAX_STEP_UP_PCT + 1 }, (_, pct) => pct);
/** The same choices, shaped for a component that renders its own dropdown. */
export const STEP_UP_OPTIONS = STEP_UP_CHOICES.map((pct) => ({ label: `${pct}%`, value: pct }));
/**
 * Yearly increase for an escalating withdrawal, as a dropdown. Mirrors the
 * "Yearly increase" control the SWP calculator already uses.
 */
export const StepUpSelect = ({ id, label, value, onChange }: StepUpSelectProps) => (
  <div className={styles.selectRow}>
    <label className={styles.selectLabel} htmlFor={id}>
      {label}
    </label>
    <select
      id={id}
      className={styles.selectInput}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {STEP_UP_CHOICES.map((pct) => (
        <option key={pct} value={pct}>
          {pct}%
        </option>
      ))}
    </select>
  </div>
);
