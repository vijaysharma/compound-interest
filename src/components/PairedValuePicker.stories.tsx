import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import PairedValuePicker from './PairedValuePicker';
import { DEFAULT_AMOUNT_STEPS, DEFAULT_PAIRED_AMOUNT_STEPS } from '../data/valuePickerData';
import { Controlled, STEP_UP_OPTIONS, pairedPickerArgTypes } from './value-picker/pairedStoryHelpers';
const meta = {
  title: 'Components/PairedValuePicker',
  component: PairedValuePicker,
  tags: ['autodocs'],
  parameters: {
    width: '420px',
    docs: {
      description: {
        component:
          'A paired amount field with a shared stepper. Built for "X per instalment, of which Y goes onward".',
      },
    },
  },
  argTypes: pairedPickerArgTypes,
} satisfies Meta<typeof PairedValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    primaryTitle: 'Withdrawal per instalment',
    primaryValue: 270000,
    secondaryTitle: 'Of which to growth funds',
    secondaryValue: 200000,
    bridgeLabel: 'Yearly increase',
    bridgeValue: 0,
    bridgeOptions: STEP_UP_OPTIONS,
    primaryStepData: DEFAULT_PAIRED_AMOUNT_STEPS,
    onPrimaryChange: () => {},
    onSecondaryChange: () => {},
  },
};
export const NoBridge: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    bridgeLabel: undefined,
    bridgeValue: undefined,
    bridgeOptions: undefined,
  },
};
export const CustomBridge: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    bridgeLabel: 'Escalate',
    bridgeSlot: (
      <div style={{ display: 'flex', gap: 4 }}>
        {['0%', '5%', '10%'].map((label) => (
          <button
            key={label}
            type="button"
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 6,
              border: '1px solid var(--color-primary)',
              background: label === '5%' ? 'var(--color-primary)' : 'transparent',
              color: label === '5%' ? 'var(--color-primary-content)' : 'var(--color-primary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    ),
  },
};
export const CapOnByDefault: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    primaryTitle: 'Withdrawal per instalment',
    primaryValue: 450000,
    secondaryTitle: 'Of which to growth funds',
    secondaryValue: 450000,
    primaryStepData: DEFAULT_AMOUNT_STEPS,
    onPrimaryChange: () => {},
    onSecondaryChange: () => {},
  },
};
export const CapOff: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    primaryTitle: 'Equity allocation',
    primaryValue: 300000,
    secondaryTitle: 'Debt allocation',
    secondaryValue: 700000,
    capSecondaryToPrimary: false,
    primaryStepData: DEFAULT_PAIRED_AMOUNT_STEPS,
    onPrimaryChange: () => {},
    onSecondaryChange: () => {},
  },
};
export const ExplicitSecondaryCeiling: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    primaryTitle: 'Instalment',
    primaryValue: 500000,
    secondaryTitle: 'Routed onward (max ₹1L)',
    secondaryValue: 50000,
    secondaryMax: 100000,
    primaryStepData: DEFAULT_PAIRED_AMOUNT_STEPS,
    onPrimaryChange: () => {},
    onSecondaryChange: () => {},
  },
};
