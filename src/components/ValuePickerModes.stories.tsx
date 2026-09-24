import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import ValuePicker from './ValuePicker';
import { DEFAULT_AMOUNT_STEPS, DEFAULT_VALUE_PICKER_TABS } from '../data/valuePickerData';
import { Controlled } from './value-picker/valuePickerStoryHelpers';
import { valuePickerArgTypes } from './value-picker/valuePickerStoryArgTypes';
import { Default } from './ValuePicker.stories';
const meta = {
  title: 'Components/ValuePicker/Modes',
  component: ValuePicker,
  tags: ['autodocs'],
  parameters: { width: '420px' },
  argTypes: valuePickerArgTypes,
} satisfies Meta<typeof ValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithTabs: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    value: '500000',
    tabs: DEFAULT_VALUE_PICKER_TABS,
    defaultTab: 'one-time',
    stepData: DEFAULT_AMOUNT_STEPS,
    singleRow: true,
  },
  parameters: { width: '520px' },
};
export const SmallTabs: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...WithTabs.args, tabSize: 'xs' },
  parameters: { width: '520px' },
};
export const ClampedRange: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Capped at ₹1,00,000', value: '50000', min: 1000, max: 100000 },
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
  args: { ...Default.args, value: '0' },
};
export const Decimals: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Units held', value: '1743.805', symbol: null, allowDecimals: true, defaultStep: 0.5 },
};
export const Embedded: Story = {
  parameters: { width: '380px' },
  render: (args) => (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 0.5rem)',
        padding: '0.5rem',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <Controlled {...args} />
    </div>
  ),
  args: { ...Default.args, title: 'Nested field', compact: true, embedded: true, scale: 'container' },
};
