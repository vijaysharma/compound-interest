import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import ValuePicker from './ValuePicker';
import { DateControlled, PairedControlled } from './value-picker/valuePickerStoryHelpers';
import { valuePickerArgTypes } from './value-picker/valuePickerStoryArgTypes';
const meta = {
  title: 'Components/ValuePicker/Variants',
  component: ValuePicker,
  tags: ['autodocs'],
  parameters: { width: '420px' },
  argTypes: valuePickerArgTypes,
} satisfies Meta<typeof ValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Paired: Story = {
  render: (args) => <PairedControlled {...args} />,
  args: {
    variant: 'paired',
    sourceBadgeText: 'From',
    targetBadgeText: 'To',
    sourceOptions: [
      { label: 'Indian Rupee', value: 'inr' },
      { label: 'US Dollar', value: 'usd' },
    ],
    targetOptions: [
      { label: 'US Dollar', value: 'usd' },
      { label: 'Euro', value: 'eur' },
    ],
    sourceValue: 'inr',
    targetValue: 'usd',
  },
  parameters: { width: '460px' },
};
export const PairedFreeText: Story = {
  render: (args) => <PairedControlled {...args} />,
  args: {
    variant: 'paired',
    title: 'Route',
    sourceBadgeText: 'Origin',
    targetBadgeText: 'Destination',
    sourcePlaceholder: 'Where from?',
    targetPlaceholder: 'Where to?',
  },
  parameters: { width: '460px' },
};
export const PairedCustomSlots: Story = {
  args: {
    variant: 'paired',
    sourceBadgeText: 'Value',
    targetBadgeText: 'Converted',
    sourceSlot: (
      <input
        aria-label="Value"
        defaultValue="1000"
        style={{ width: '100%', border: 0, background: 'transparent', font: 'inherit', padding: '0.4rem' }}
      />
    ),
    targetSlot: (
      <output style={{ display: 'block', padding: '0.4rem', fontWeight: 700 }}>1 km</output>
    ),
  },
  parameters: { width: '460px' },
};
export const StackedPaired: Story = {
  render: (args) => <PairedControlled {...args} />,
  args: {
    variant: 'stacked-paired',
    title: 'Transfer',
    sourceBadgeText: 'From',
    targetBadgeText: 'To',
    sourceOptions: [
      { label: 'Core corpus', value: 'core' },
      { label: 'Growth funds', value: 'growth' },
    ],
    targetOptions: [
      { label: 'Growth funds', value: 'growth' },
      { label: 'Reinvestment loop', value: 'loop' },
    ],
    sourceValue: 'core',
    targetValue: 'growth',
  },
};
export const SingleDate: Story = {
  name: 'Date (single field)',
  render: (args) => <DateControlled {...args} />,
  args: {
    variant: 'date',
    startTitle: 'Reinvestment start',
    startDate: '2024-01-01',
  },
};
export const DateRange: Story = {
  render: (args) => <DateControlled {...args} />,
  args: {
    variant: 'date-range',
    startTitle: 'From',
    endTitle: 'To',
    startDate: '2019-01-01',
    endDate: '2019-12-31',
  },
};
export const DateRangeContainerScale: Story = {
  name: 'Date range, container scale (condensed)',
  parameters: { width: '340px' },
  render: (args) => <DateControlled {...args} />,
  args: { ...DateRange.args, scale: 'container', compact: true, embedded: true },
};
export const YearRange: Story = {
  render: (args) => <DateControlled {...args} />,
  args: {
    variant: 'date-range',
    dateMode: 'year',
    startTitle: 'From',
    endTitle: 'To',
    startDate: '2019',
    endDate: '2026',
    startYearOptions: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    endYearOptions: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
  },
};
