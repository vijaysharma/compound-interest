import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import PairedValuePicker, { type PairedValuePickerProps } from './PairedValuePicker';
import { DEFAULT_AMOUNT_STEPS, DEFAULT_PAIRED_AMOUNT_STEPS } from '../data/valuePickerData';
/**
 * Two amounts in one `ValuePicker`-styled card: a split title bar, both fields
 * behind a single currency badge, and **one** `C / + / -` and step strip shared
 * between them. An optional "bridge" row sits under the card.
 *
 * ### Why the three controls are one component
 * Their values constrain each other. The right field is a share carved out of
 * the left one, so it caps at the left value and a cut on the left drags it
 * down. Keeping them separate meant every caller re-implemented that rule.
 *
 * ### The shared strip follows focus
 * A single stepper has to act on one field. It targets whichever field was
 * focused last and starts on the left. The active field is ringed, and the
 * strip is a `role="group"` labelled `Adjust <field name>`, so the target is
 * never ambiguous — including to a screen reader. Click into the right field
 * and the same buttons now drive it.
 *
 * ### Sizing
 * `scale` is the size knob, and it defaults to `container` here rather than to
 * `auto` — the card is built for a ~380px column on a full-size screen, so it
 * sizes off its own box at the same tiers as `ValuePicker`'s
 * `scale="container"`. See *Container Tiers*.
 *
 * `auto` is deliberately not offered: the card has no viewport-keyed tier set
 * of its own, so passing it is a type error rather than a silent no-op. The
 * pinned `mobile` / `desktop` values are there for preview frames — see
 * *Scale Pinned*. `compact` (gaps) and `embedded` (border) are separate knobs
 * and compose with any scale.
 *
 * **Looking for `condensed`?** It was renamed: `scale="container"` is that
 * prop, and it is this card's default, so every story here is the condensed
 * rendering. *Container Tiers (condensed)* shows it across five widths.
 */
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
  argTypes: {
    primaryTitle: { description: 'Heading over the left field.' },
    primaryValue: { description: 'Left value. Controlled — pair with `onPrimaryChange`.', control: 'number' },
    onPrimaryChange: { description: 'Receives the clamped left value. Also fires for the right field when a cut drags it down.' },
    primaryMin: { control: 'number', table: { defaultValue: { summary: '0' } } },
    primaryMax: { control: 'number' },
    primaryStepData: { description: 'Quick steps for both fields unless `secondaryStepData` overrides the right one.' },
    secondaryTitle: { description: 'Heading over the right field.' },
    secondaryValue: { description: 'Right value. Controlled — pair with `onSecondaryChange`.', control: 'number' },
    onSecondaryChange: { description: 'Receives the clamped right value.' },
    secondaryMin: { control: 'number', table: { defaultValue: { summary: '0' } } },
    secondaryMax: { description: 'An explicit ceiling. The tighter of this and the left value wins.', control: 'number' },
    secondaryStepData: { description: 'Separate step list for the right field.' },
    capSecondaryToPrimary: {
      description:
        'Treats the right field as a share of the left: it caps there, and cutting the left drags it down. Turn off for two independent amounts.',
      control: 'boolean',
      table: { defaultValue: { summary: 'true' } },
    },
    bridgeLabel: { description: 'Label for the row under the card, e.g. "Yearly increase".', control: 'text' },
    bridgeValue: { description: 'Current bridge selection.' },
    onBridgeChange: { description: 'Receives the new bridge value as a string.' },
    bridgeOptions: { description: 'Dropdown options. Supply these (or `bridgeSlot`) or the row is dropped.' },
    bridgeSlot: { description: 'Renders in place of the generated dropdown, for a non-select bridge.' },
    bridgeId: { description: 'Ties the label to the dropdown. Defaults to a generated id.', control: 'text' },
    symbol: { description: 'Shared prefix badge. `null` removes it.', control: 'text' },
    singleRow: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    showWords: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    allowDecimals: { control: 'boolean' },
    defaultStep: { description: 'Step for the +/- buttons. Defaults to 500 (0.5 for decimals).', control: 'number' },
    scale: {
      description:
        'What the control sizes itself against: its own box (`container`, the default) or a pinned scale for preview frames (`mobile` / `desktop`). `container` is the former `condensed` prop. `auto` is not supported — see the notes above.',
      control: 'inline-radio',
      options: ['container', 'mobile', 'desktop'],
      table: { defaultValue: { summary: 'container' } },
    },
    compact: {
      description: 'Tightens the gaps between the card, bridge row and words row. Independent of `scale`.',
      control: 'boolean',
      table: { defaultValue: { summary: 'true' } },
    },
    embedded: {
      description:
        'Sheds the card border and radius, for nesting inside a slot that already draws one. Independent of `scale`.',
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    locale: { control: 'text', table: { defaultValue: { summary: 'en-IN' } } },
  },
} satisfies Meta<typeof PairedValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
const STEP_UP_OPTIONS = Array.from({ length: 21 }, (_, pct) => ({ label: `${pct}%`, value: pct }));
/**
 * Holds both amounts and the bridge in local state, so the cap and the drag
 * behave exactly as they do in the app. A readout underneath shows the
 * committed values — the point being that the *state* stays consistent, not
 * just the display.
 */
const Controlled = ({
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
// ── Baseline ────────────────────────────────────────────────────────────────
/**
 * The strategy calculator's withdrawal field, which is what this component was
 * built for: an instalment, the share of it routed to the growth funds, and a
 * yearly escalation underneath.
 *
 * **Try it:** press `+1L` — it applies to the left field. Now click into the
 * right field and press `+1L` again; the same button drives the right field and
 * stops at the left value instead of overshooting.
 */
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
/**
 * Omit both `bridgeOptions` and `bridgeSlot` and the bridge row disappears —
 * the card is then just the paired amounts.
 */
export const NoBridge: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    bridgeLabel: undefined,
    bridgeValue: undefined,
    bridgeOptions: undefined,
  },
};
/** `bridgeSlot` replaces the generated dropdown with any node. */
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
// ── The cap, which is the whole point of the pairing ────────────────────────
/**
 * **The cap.** `capSecondaryToPrimary` is on by default. The right field can
 * never exceed the left one, and lowering the left drags the right down with
 * it — so the state can never claim more is routed onward than the instalment
 * carries.
 *
 * **Try it:** both start at ₹4,50,000. Press `+1L` on the right field — it
 * stays put, already at the ceiling. Now press `C` on the left field: the right
 * one follows to ₹0. Watch the readout, not just the inputs — the inputs alone
 * would hide a state drift.
 */
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
/**
 * `capSecondaryToPrimary={false}` unlinks them: two independent amounts that
 * share one card and one stepper. Here the right field can exceed the left.
 */
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
/**
 * An explicit `secondaryMax` narrows the share further. The tighter of the two
 * ceilings wins, so with a ₹5,00,000 instalment and a ₹1,00,000 cap the right
 * field stops at ₹1,00,000.
 */
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
/** Floors work too: `primaryMin` / `secondaryMin` disable `C` and `-` there. */
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
// ── Units and steps ─────────────────────────────────────────────────────────
/** Separate step lists per field, when the two move at different magnitudes. */
export const SeparateStepLists: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    primaryStepData: DEFAULT_AMOUNT_STEPS,
    secondaryStepData: DEFAULT_PAIRED_AMOUNT_STEPS,
  },
  parameters: { width: '560px' },
};
/**
 * A `%` symbol switches on decimal support for both fields and drops
 * `defaultStep` to 0.5.
 */
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
/** `symbol: null` drops the badge and hands its width back to the fields. */
export const NoSymbol: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, symbol: null },
};
/** `showWords` adds an in-words readout per field, in the same two columns. */
export const WithWordsReadout: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, showWords: true },
  parameters: { width: '560px' },
};
// ── States ──────────────────────────────────────────────────────────────────
/** `disabled` blocks both fields and every button in the shared strip. */
export const Disabled: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, disabled: true },
};
/** `readOnly` rejects typing but leaves the step buttons live. */
export const ReadOnly: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, readOnly: true },
};
/** Both at zero: `C` and `-` are disabled, and the fields read a bare `0`. */
export const AtZero: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, primaryValue: 0, secondaryValue: 0 },
};
/** Long headings wrap to a second line rather than truncating. */
export const LongTitles: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    ...Default.args,
    primaryTitle: 'Withdrawal per instalment from the core corpus',
    secondaryTitle: 'Of which routed onward to the growth funds',
  },
  parameters: { width: '380px' },
};
// ── Sizing ──────────────────────────────────────────────────────────────────
/**
 * The same component at five container widths, with the viewport unchanged —
 * so every difference is the container query.
 *
 * | container | field | actions | step cell | input | glyph col |
 * | --- | --- | --- | --- | --- | --- |
 * | ≥640px | 44px | 44px | 46px / 14px | 20px | 14px |
 * | 360–640px | 32px | 32px | 32px / 13px | 16.5px | 12px |
 * | ≤360px | 32px | 32px | 32px / 11px | 15.5px | 12px |
 * | ≤340px | — | — | 32px / 10px | — | — |
 *
 * The condensed tier holds every control at 32px, from the shared
 * `$control-height-condensed` token the other three picker shells also read —
 * this card's action cluster used to be 32px while ValuePicker's was 38px, so
 * the two sat side by side in the same column at different sizes. Only the
 * glyph column and the label sizes go below 32px. Below ~300px the step labels
 * begin to crowd, which is narrower than any column the app renders.
 *
 * The last column is the currency glyph's, and the title bar and the in-words
 * row each reserve a blank cell exactly that wide — which is what keeps the two
 * headings, the two fields and the two readouts in one pair of columns at every
 * tier. Turn on `showWords` at a couple of widths to see all three rows line up.
 */
export const ContainerTiers: Story = {
  name: 'Container tiers (condensed)',
  parameters: { width: '100%', showRuler: false },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {['320px', '380px', '480px', '620px', '760px'].map((width) => (
        <div key={width}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            container: {width}
          </p>
          <div style={{ width, maxWidth: '100%' }}>
            <PairedValuePicker {...args} />
          </div>
        </div>
      ))}
    </div>
  ),
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
/**
 * Ten controls on one strip in a phone-width column. All of them stay inside
 * the card and clickable — the step tracks compress rather than scrolling the
 * last ones out of reach, which matters more here than usual because the strip
 * is shared by both fields.
 */
export const NarrowColumn: Story = {
  parameters: { width: '320px' },
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, primaryStepData: DEFAULT_AMOUNT_STEPS },
};
/**
 * `mobile` and `desktop` pin a fixed scale, ignoring the card's own width. Both
 * frames below are the same 760px wide, so a `container` instance would render
 * at its roomy tier in each; the pinned ones hold their tier instead.
 *
 * This is for preview frames that imitate a viewport the card is not actually
 * in. Each pin reuses the same tier declarations the container queries do, so a
 * pinned card and a container-sized one at the matching width are identical.
 */
export const ScalePinned: Story = {
  parameters: { width: '100%', showRuler: false },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {(['mobile', 'desktop'] as const).map((scale) => (
        <div key={scale}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            scale: {scale}
          </p>
          <div style={{ width: '760px', maxWidth: '100%' }}>
            <PairedValuePicker {...args} scale={scale} />
          </div>
        </div>
      ))}
    </div>
  ),
  args: { ...ContainerTiers.args },
};
/**
 * `embedded` sheds the card's border and radius so it can sit inside a slot
 * that already draws one — compare with *In Context*, which keeps both and
 * nests a second box inside the first. Composes with `compact` and `scale`.
 */
export const Embedded: Story = {
  parameters: { width: '380px' },
  render: (args) => (
    <div
      style={{
        border: '1px solid var(--color-primary)',
        borderRadius: 'var(--radius-md, 0.5rem)',
        padding: '0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        background: 'var(--color-bg)',
      }}
    >
      <strong style={{ fontSize: 13 }}>Withdrawal period 1</strong>
      <Controlled {...args} />
    </div>
  ),
  args: { ...Default.args, compact: true, embedded: true },
};
/**
 * How it actually appears in the strategy calculator: inside a bordered card
 * in a ~380px column, with sibling readouts below.
 */
export const InContext: Story = {
  parameters: { width: '380px' },
  render: (args) => (
    <div
      style={{
        border: '1px solid var(--color-primary)',
        borderRadius: 'var(--radius-md, 0.5rem)',
        padding: '0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        background: 'var(--color-bg)',
      }}
    >
      <strong style={{ fontSize: 13 }}>Withdrawal period 1</strong>
      <PairedValuePicker {...args} />
      {[
        ['Personal use per instalment', '₹70,000'],
        ['Instalments taken', '12'],
      ].map(([label, value]) => (
        <div
          key={label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>{label}</span>
          <strong style={{ color: 'var(--color-text)' }}>{value}</strong>
        </div>
      ))}
    </div>
  ),
  args: ContainerTiers.args,
};
