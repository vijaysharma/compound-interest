import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import PairedValuePicker from './PairedValuePicker';
import { DEFAULT_PAIRED_AMOUNT_STEPS } from '../data/valuePickerData';
import { Controlled, pairedPickerArgTypes } from './value-picker/pairedStoryHelpers';
import { Default } from './PairedValuePicker.stories';
const meta = {
  title: 'Components/PairedValuePicker/Sizing',
  component: PairedValuePicker,
  tags: ['autodocs'],
  parameters: { width: '420px' },
  argTypes: pairedPickerArgTypes,
} satisfies Meta<typeof PairedValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ContainerTiers: Story = {
  name: 'Container tiers (condensed)',
  parameters: { width: '100%', showRuler: false },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {['320px', '360px', '420px', '560px', '700px'].map((width) => (
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
  args: { ...Default.args, scale: 'container' },
};
export const NarrowColumn: Story = {
  parameters: { width: '340px' },
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, scale: 'container' },
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
          <div style={{ width: '420px', maxWidth: '100%' }}>
            <Controlled {...args} scale={scale} />
          </div>
        </div>
      ))}
    </div>
  ),
  args: { ...Default.args },
};
export const Embedded: Story = {
  parameters: { width: '420px' },
  render: (args) => (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 0.5rem)',
        padding: '0.75rem',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <Controlled {...args} />
    </div>
  ),
  args: { ...Default.args, compact: true, embedded: true },
};
export const InContext: Story = {
  parameters: { width: '380px' },
  render: (args) => (
    <div
      style={{
        padding: '1rem',
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg, 0.75rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Withdrawal period 1</h4>
      <Controlled {...args} />
    </div>
  ),
  args: {
    primaryTitle: 'Withdrawal per instalment',
    primaryValue: 450000,
    secondaryTitle: 'Of which to growth funds',
    secondaryValue: 400000,
    bridgeLabel: 'Yearly increase',
    bridgeValue: 0,
    primaryStepData: DEFAULT_PAIRED_AMOUNT_STEPS,
    compact: true,
    embedded: true,
    onPrimaryChange: () => {},
    onSecondaryChange: () => {},
  },
};
