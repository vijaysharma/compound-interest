import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import ValuePicker from './ValuePicker';
import { DEFAULT_AMOUNT_STEPS, DEFAULT_PAIRED_AMOUNT_STEPS } from '../data/valuePickerData';
import { Controlled } from './value-picker/valuePickerStoryHelpers';
import { valuePickerArgTypes } from './value-picker/valuePickerStoryArgTypes';
const meta = {
  title: 'Components/ValuePicker/Scale',
  component: ValuePicker,
  tags: ['autodocs'],
  parameters: { width: '420px' },
  argTypes: valuePickerArgTypes,
} satisfies Meta<typeof ValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ScaleComparison: Story = {
  name: 'Scale: auto vs container (condensed)',
  parameters: { width: '380px' },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>scale=&quot;auto&quot; — off the viewport</p>
        <Controlled {...args} title="Initial investment" />
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
          scale=&quot;container&quot; — off this 380px column
        </p>
        <Controlled {...args} title="Initial investment" scale="container" />
      </div>
    </div>
  ),
  args: { value: '7000000', stepData: DEFAULT_AMOUNT_STEPS, singleRow: true, compact: true },
};
export const ScaleContainerTiers: Story = {
  name: 'Scale: container tiers (condensed)',
  parameters: { width: '100%', showRuler: false },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {['320px', '420px', '560px', '700px'].map((width) => (
        <div key={width}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            container: {width}
          </p>
          <div style={{ width, maxWidth: '100%' }}>
            <Controlled {...args} />
          </div>
        </div>
      ))}
    </div>
  ),
  args: {
    title: 'Withdrawal per instalment',
    value: '450000',
    stepData: DEFAULT_PAIRED_AMOUNT_STEPS,
    singleRow: true,
    scale: 'container',
    compact: true,
  },
};
export const ScalePinned: Story = {
  parameters: { width: '100%', showRuler: false },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {(['mobile', 'desktop'] as const).map((scale) => (
        <div key={scale}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            scale: {scale}
          </p>
          <div style={{ width: '460px', maxWidth: '100%' }}>
            <Controlled {...args} scale={scale} />
          </div>
        </div>
      ))}
    </div>
  ),
  args: { title: 'Monthly investment', value: '25000', stepData: DEFAULT_AMOUNT_STEPS, singleRow: true },
};
