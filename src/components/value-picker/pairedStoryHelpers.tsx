import React, { useState } from 'react';
import type { Meta } from '@storybook/nextjs';
import PairedValuePicker, { type PairedValuePickerProps } from '../PairedValuePicker';
export const STEP_UP_OPTIONS = Array.from({ length: 21 }, (_, pct) => ({ label: `${pct}%`, value: pct }));
export const pairedPickerArgTypes: Meta<typeof PairedValuePicker>['argTypes'] = {
  primaryTitle: { description: 'Heading over the left field.' },
  primaryValue: { description: 'Left value. Controlled — pair with `onPrimaryChange`.', control: 'number' },
  onPrimaryChange: { description: 'Receives the clamped left value.' },
  primaryMin: { control: 'number', table: { defaultValue: { summary: '0' } } },
  primaryMax: { control: 'number' },
  primaryStepData: { description: 'Quick steps for both fields unless `secondaryStepData` overrides.' },
  secondaryTitle: { description: 'Heading over the right field.' },
  secondaryValue: { description: 'Right value. Controlled — pair with `onSecondaryChange`.', control: 'number' },
  onSecondaryChange: { description: 'Receives the clamped right value.' },
  secondaryMin: { control: 'number', table: { defaultValue: { summary: '0' } } },
  secondaryMax: { description: 'An explicit ceiling.', control: 'number' },
  secondaryStepData: { description: 'Separate step list for the right field.' },
  capSecondaryToPrimary: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
  bridgeLabel: { control: 'text' },
  bridgeValue: { description: 'Current bridge selection.' },
  onBridgeChange: { description: 'Receives the new bridge value.' },
  bridgeOptions: { description: 'Dropdown options.' },
  bridgeSlot: { description: 'Custom bridge slot node.' },
  bridgeId: { control: 'text' },
  symbol: { control: 'text' },
  singleRow: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
  showWords: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
  allowDecimals: { control: 'boolean' },
  defaultStep: { control: 'number' },
  scale: { control: 'inline-radio', options: ['container', 'mobile', 'desktop'], table: { defaultValue: { summary: 'container' } } },
  compact: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
  embedded: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
  disabled: { control: 'boolean' },
  readOnly: { control: 'boolean' },
  locale: { control: 'text', table: { defaultValue: { summary: 'en-IN' } } },
};
export const Controlled = ({
  primaryValue: initialPrimary = 0,
  secondaryValue: initialSecondary = 0,
  bridgeValue: initialBridge,
  onPrimaryChange,
  onSecondaryChange,
  onBridgeChange,
  ...rest
}: PairedValuePickerProps & { showState?: boolean }) => {
  const [primary, setPrimary] = useState(initialPrimary);
  const [secondary, setSecondary] = useState(initialSecondary);
  const [bridge, setBridge] = useState(initialBridge ?? '');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <PairedValuePicker
        {...rest}
        primaryValue={primary}
        secondaryValue={secondary}
        bridgeValue={bridge}
        onPrimaryChange={(next) => {
          setPrimary(next);
          onPrimaryChange?.(next);
        }}
        onSecondaryChange={(next) => {
          setSecondary(next);
          onSecondaryChange?.(next);
        }}
        onBridgeChange={(next) => {
          setBridge(next);
          onBridgeChange?.(next);
        }}
      />
      <pre
        style={{
          margin: 0,
          padding: '0.4rem 0.6rem',
          borderRadius: 6,
          background: 'var(--color-bg-tertiary)',
          fontSize: 11,
          lineHeight: 1.6,
          color: 'var(--color-text-secondary)',
        }}
      >
        {`committed state
  primary   : ${primary.toLocaleString('en-IN')}
  secondary : ${secondary.toLocaleString('en-IN')}${rest.bridgeOptions ? `\n  bridge    : ${bridge}` : ''}
  personal  : ${Math.max(0, primary - secondary).toLocaleString('en-IN')}`}
      </pre>
    </div>
  );
};
