import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import ValuePicker from './ValuePicker';
import {
  DEFAULT_AMOUNT_STEPS,
  DEFAULT_PAIRED_AMOUNT_STEPS,
  DEFAULT_VALUE_PICKER_ROWS,
} from '../data/valuePickerData';
import { Controlled } from './value-picker/valuePickerStoryHelpers';
import { valuePickerArgTypes } from './value-picker/valuePickerStoryArgTypes';
const meta = {
  title: 'Components/ValuePicker',
  component: ValuePicker,
  tags: ['autodocs'],
  parameters: {
    width: '420px',
    docs: {
      description: {
        component:
          'The shared numeric / date input used by every calculator. Dispatches on variant: amount, paired, date, date-range.',
      },
    },
  },
  argTypes: valuePickerArgTypes,
} satisfies Meta<typeof ValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    title: 'Monthly investment',
    value: '25000',
    stepData: DEFAULT_AMOUNT_STEPS,
    singleRow: true,
    symbol: '₹',
    min: 0,
  },
};
export const WithWordsReadout: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, value: '7500000', showWords: true },
};
export const PlainTitle: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, titleStyle: 'default' },
};
export const Untitled: Story = {
  render: (args) => <Controlled {...args} />,
  args: { value: '1000', stepData: DEFAULT_AMOUNT_STEPS, singleRow: true, tabs: [] },
};
export const MultiRowSteps: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    title: 'Target corpus',
    value: '5000000',
    stepRows: DEFAULT_VALUE_PICKER_ROWS,
    showWords: true,
  },
  parameters: { width: '520px' },
};
export const CoarseSteps: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Withdrawal per instalment', stepData: DEFAULT_PAIRED_AMOUNT_STEPS },
};
export const NoSteps: Story = {
  render: (args) => <Controlled {...args} />,
  args: { title: 'Exact amount', value: '12345', stepData: [], tabs: [] },
};
export const PercentageRate: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    title: 'Expected return rate (p.a)',
    value: '12.5',
    symbol: '%',
    symbolPosition: 'right',
    stepData: [
      { id: 'r1', value: '5', title: '5%' },
      { id: 'r2', value: '1', title: '1%' },
      { id: 'r3', value: '0.5', title: '0.5%' },
      { id: 'r4', value: '0.1', title: '0.1%' },
    ],
    singleRow: true,
    max: 100,
  },
};
export const NoSymbol: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    title: 'Number of instalments',
    value: '120',
    symbol: null,
    stepData: [
      { id: 't1', value: '60', title: '60' },
      { id: 't2', value: '12', title: '12' },
      { id: 't3', value: '1', title: '1' },
    ],
    singleRow: true,
  },
};
export const BareSymbol: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Unbadged symbol', symbolBg: false },
};
export const USLocale: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Monthly investment (US grouping)', value: '1250000', locale: 'en-US', symbol: '$' },
};
export const WithEndAdornment: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    title: 'Instalment',
    endAdornment: (
      <select aria-label="Frequency" defaultValue="monthly" style={{ padding: '0.3rem', fontWeight: 600 }}>
        <option value="monthly">/mo</option>
        <option value="yearly">/yr</option>
      </select>
    ),
  },
  parameters: { width: '520px' },
};
