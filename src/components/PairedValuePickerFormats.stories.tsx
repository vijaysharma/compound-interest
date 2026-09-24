import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import PairedValuePicker from './PairedValuePicker';
import { DEFAULT_AMOUNT_STEPS, DEFAULT_PAIRED_AMOUNT_STEPS } from '../data/valuePickerData';
import { Controlled, pairedPickerArgTypes } from './value-picker/pairedStoryHelpers';
import { Default } from './PairedValuePicker.stories';
const meta = {
  title: 'Components/PairedValuePicker/Formats',
  component: PairedValuePicker,
  tags: ['autodocs'],
  parameters: { width: '420px' },
  argTypes: pairedPickerArgTypes,
} satisfies Meta<typeof PairedValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithFloors: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    primaryTitle: 'Instalment (min ₹10,000)',
    primaryMin: 10000,
    secondaryMin: 5000,
    secondaryTitle: 'Onward (min ₹5,000)',
    secondaryValue: 50000,
    primaryValue: 100000,
  },
};
export const SeparateStepLists: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    primaryStepData: DEFAULT_AMOUNT_STEPS,
    secondaryStepData: DEFAULT_PAIRED_AMOUNT_STEPS,
  },
  parameters: { width: '560px' },
};
export const Percentages: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    primaryTitle: 'Equity %',
    primaryValue: 60,
    secondaryTitle: 'Of which mid-cap %',
    secondaryValue: 15,
    symbol: '%',
    primaryMax: 100,
    primaryStepData: [
      { id: 'p1', value: '25', title: '25%' },
      { id: 'p2', value: '10', title: '10%' },
      { id: 'p3', value: '5', title: '5%' },
      { id: 'p4', value: '1', title: '1%' },
    ],
    onPrimaryChange: () => {},
    onSecondaryChange: () => {},
  },
};
export const NoSymbol: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, symbol: null },
};
export const WithWordsReadout: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, showWords: true },
  parameters: { width: '560px' },
};
export const Disabled: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, disabled: true },
};
export const ReadOnly: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, readOnly: true },
};
export const AtZero: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, primaryValue: 0, secondaryValue: 0 },
};
export const LongTitles: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    primaryTitle: 'Withdrawal per instalment from the core corpus',
    secondaryTitle: 'Of which routed onward to the growth funds',
  },
  parameters: { width: '380px' },
};
