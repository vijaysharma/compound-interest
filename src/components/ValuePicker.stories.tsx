import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import ValuePicker from './ValuePicker';
import type { ValuePickerProps } from './value-picker/types';
import {
  DEFAULT_AMOUNT_STEPS,
  DEFAULT_PAIRED_AMOUNT_STEPS,
  DEFAULT_VALUE_PICKER_ROWS,
  DEFAULT_VALUE_PICKER_TABS,
} from '../data/valuePickerData';
/**
 * `ValuePicker` is the umbrella control. It dispatches on `variant`:
 *
 * | `variant` | renders | use for |
 * | --- | --- | --- |
 * | `amount` / `value` (default) | `GenericValuePicker` | a single number with a stepper grid |
 * | `paired` | `PairedPicker` | two slots side by side in one joined box |
 * | `stacked-paired` | `PairedPicker` | the same two slots, stacked |
 * | `date-range` | `DateRangePicker` | one date, a date range, or a year range |
 *
 * `amount` and `value` are the same thing — two spellings of the default, kept
 * because call sites use both. Props belonging to a variant you are not
 * rendering are ignored, so the control table below is the union of all four.
 *
 * ### Controlled, always
 * The picker never owns its value. Pass `value` + `onChange` and echo the
 * change back, or the field will not move. Every story below is wired that way.
 *
 * ### Two things worth knowing before you use it
 * 1. **`scale` is the one size knob.** `auto` sizes off the viewport, so a
 *    picker in a narrow column on a wide screen renders at full web scale and
 *    crowds the column; `container` sizes off the picker's own box instead. See
 *    the *Scale* stories. `compact` (margins) and `embedded` (border) are
 *    separate, and compose with any scale.
 *
 *    **Looking for `condensed`?** That was the prop's old name, and
 *    `scale="container"` is it — same behaviour, same `.condensed` class in the
 *    stylesheet. It was folded into `scale` along with `compact` and `layout`,
 *    which had drifted into three names for one idea. The two stories below
 *    with *(condensed)* in the title are the ones to look at.
 * 2. **`arePropsEqual` ignores callbacks.** A memoised instance keeps the
 *    `onChange` from the render it last committed, so never close over a value
 *    the picker's own props don't include — read it from a ref instead.
 */
const meta = {
  title: 'Components/ValuePicker',
  component: ValuePicker,
  tags: ['autodocs'],
  parameters: {
    width: '420px',
    docs: {
      description: {
        component:
          'The shared numeric / date input used by every calculator. See the notes on each story for the scenario it covers.',
      },
    },
  },
  argTypes: {
    // ── Variant ──────────────────────────────────────────────────────────────
    variant: {
      description: 'Which sub-component renders. Drives the whole shape of the control.',
      control: 'select',
      options: ['amount', 'value', 'paired', 'stacked-paired', 'date-range'],
      table: { category: 'Variant', defaultValue: { summary: 'amount' } },
    },
    // ── Value ────────────────────────────────────────────────────────────────
    value: {
      description: 'The current value. Controlled — pair with `onChange`.',
      table: { category: 'Value' },
    },
    onChange: {
      description: 'Receives the new value as a string, already clamped to min/max.',
      table: { category: 'Value' },
    },
    min: { control: 'number', table: { category: 'Value' } },
    max: { control: 'number', table: { category: 'Value' } },
    defaultStep: {
      description: 'Step for the +/- buttons and Arrow Up/Down. Defaults to 500 (0.5 for decimals).',
      table: { category: 'Value' },
    },
    allowDecimals: {
      description: 'Forces fractional input. Inferred from a `%` symbol or a rate-ish title.',
      control: 'boolean',
      table: { category: 'Value' },
    },
    placeholder: { control: 'text', table: { category: 'Value' } },
    // ── Label ────────────────────────────────────────────────────────────────
    title: {
      description: 'Heading text. Rendered in the merged purple bar unless `titleStyle="default"`.',
      table: { category: 'Label' },
    },
    titleStyle: {
      description: '`merged` fuses the title to the top of the card; `default` puts it above as plain text.',
      control: 'inline-radio',
      options: ['merged', 'default'],
      table: { category: 'Label', defaultValue: { summary: 'merged' } },
    },
    showWords: {
      description: 'Renders the amount in words below the card.',
      control: 'boolean',
      table: { category: 'Label' },
    },
    locale: {
      description: 'Number formatting locale. `en-IN` groups in lakhs, `en-US` in thousands.',
      control: 'text',
      table: { category: 'Label' },
    },
    // ── Symbol ───────────────────────────────────────────────────────────────
    symbol: {
      description: 'Prefix badge content. `null` removes the badge; `%` also switches on decimal support.',
      control: 'text',
      table: { category: 'Symbol', defaultValue: { summary: '₹' } },
    },
    symbolPosition: {
      control: 'inline-radio',
      options: ['left', 'right'],
      table: { category: 'Symbol', defaultValue: { summary: 'left' } },
    },
    symbolBg: {
      description: 'Set `false` to drop the badge background and leave the bare glyph.',
      control: 'boolean',
      table: { category: 'Symbol', defaultValue: { summary: 'true' } },
    },
    endAdornment: {
      description: 'Slots an extra control between the field and the action buttons.',
      table: { category: 'Symbol' },
    },
    // ── Steps ────────────────────────────────────────────────────────────────
    stepData: {
      description: 'Quick-step buttons, as `{ id, value, title }`. Ignored when `stepRows` is set.',
      table: { category: 'Steps' },
    },
    stepRows: {
      description: 'Multi-row step grid. Takes precedence over `stepData`.',
      table: { category: 'Steps' },
    },
    singleRow: {
      description: 'Flattens the steps into one scrollable row instead of wrapping them.',
      control: 'boolean',
      table: { category: 'Steps' },
    },
    // ── Tabs ─────────────────────────────────────────────────────────────────
    tabs: {
      description: 'Tab strip above the input. Pass `[]` (with a `title` set) for no tabs.',
      table: { category: 'Tabs' },
    },
    activeTab: {
      description: 'Set this and `onTabChange` to drive the strip; leave unset for internal state.',
      table: { category: 'Tabs' },
    },
    defaultTab: {
      description: 'Seeds the internal tab when `activeTab` is not supplied.',
      table: { category: 'Tabs' },
    },
    onTabChange: { table: { category: 'Tabs' } },
    tabSize: {
      description: 'Tab height only — `md` is the base scale.',
      control: 'inline-radio',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      table: { category: 'Tabs', defaultValue: { summary: 'md' } },
    },
    // ── Chrome ───────────────────────────────────────────────────────────────
    scale: {
      description:
        'What the control sizes itself against: the viewport (`auto`), its own box (`container`), or a pinned scale for preview frames (`mobile` / `desktop`). `container` is the former `condensed` prop.',
      control: 'inline-radio',
      options: ['auto', 'container', 'mobile', 'desktop'],
      table: { category: 'Chrome', defaultValue: { summary: 'auto' } },
    },
    compact: {
      description: 'Trims the outer vertical margins. Independent of `scale`.',
      control: 'boolean',
      table: { category: 'Chrome' },
    },
    embedded: {
      description: 'Sheds the border/radius for use inside another bordered slot.',
      control: 'boolean',
      table: { category: 'Chrome' },
    },
    disabled: { control: 'boolean', table: { category: 'Chrome' } },
    readOnly: { control: 'boolean', table: { category: 'Chrome' } },
    className: { table: { category: 'Chrome' } },
    // ── variant="paired" / "stacked-paired" ──────────────────────────────────
    sourceBadgeText: {
      description: 'Label over the left (or upper) slot.',
      control: 'text',
      table: { category: 'Paired slots' },
    },
    targetBadgeText: {
      description: 'Label over the right (or lower) slot.',
      control: 'text',
      table: { category: 'Paired slots' },
    },
    sourceSlot: {
      description: 'Any node. Takes precedence over `sourceOptions`.',
      table: { category: 'Paired slots' },
    },
    targetSlot: { table: { category: 'Paired slots' } },
    sourceOptions: {
      description: 'Renders a generated `<select>` when no `sourceSlot` is given.',
      table: { category: 'Paired slots' },
    },
    targetOptions: { table: { category: 'Paired slots' } },
    sourceValue: { table: { category: 'Paired slots' } },
    targetValue: { table: { category: 'Paired slots' } },
    onSourceChange: { table: { category: 'Paired slots' } },
    onTargetChange: { table: { category: 'Paired slots' } },
    sourcePlaceholder: { table: { category: 'Paired slots' } },
    targetPlaceholder: { table: { category: 'Paired slots' } },
    // ── variant="date-range" ─────────────────────────────────────────────────
    dateMode: {
      description: '`year` swaps both date inputs for year dropdowns.',
      control: 'inline-radio',
      options: ['date', 'year'],
      table: { category: 'Date range', defaultValue: { summary: 'date' } },
    },
    singleDate: {
      description: 'Renders a single labelled date field instead of a pair.',
      control: 'boolean',
      table: { category: 'Date range' },
    },
    startTitle: {
      description: 'Label over the start field.',
      control: 'text',
      table: { category: 'Date range', defaultValue: { summary: 'Start' } },
    },
    endTitle: {
      description: 'Label over the end field. Ignored when `singleDate` is set.',
      control: 'text',
      table: { category: 'Date range', defaultValue: { summary: 'End' } },
    },
    startDate: { table: { category: 'Date range' } },
    endDate: { table: { category: 'Date range' } },
    setStartDate: { table: { category: 'Date range' } },
    setEndDate: { table: { category: 'Date range' } },
    startMinDate: {
      description: 'ISO floor for the start field.',
      control: 'text',
      table: { category: 'Date range' },
    },
    startYearOptions: {
      description: 'Year options for the start dropdown. Only read when `dateMode="year"`.',
      table: { category: 'Date range' },
    },
    endYearOptions: {
      description: 'Year options for the end dropdown; years before the start are filtered out.',
      table: { category: 'Date range' },
    },
  },
} satisfies Meta<typeof ValuePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Wraps the picker in local state so the stories behave like the real thing.
 * Storybook's `args` stay the initial value; typing and stepping update the copy.
 */
const Controlled = ({ value: initial = '0', onChange, ...rest }: ValuePickerProps) => {
  const [value, setValue] = useState(String(initial ?? '0'));
  return (
    <ValuePicker
      {...rest}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};
const DateControlled = ({ startDate, endDate, ...rest }: ValuePickerProps) => {
  const [start, setStart] = useState(startDate ?? '');
  const [end, setEnd] = useState(endDate ?? '');
  return (
    <ValuePicker
      {...rest}
      startDate={start}
      endDate={end}
      setStartDate={setStart}
      setEndDate={setEnd}
    />
  );
};
const PairedControlled = ({ sourceValue, targetValue, ...rest }: ValuePickerProps) => {
  const [source, setSource] = useState(sourceValue ?? '');
  const [target, setTarget] = useState(targetValue ?? '');
  return (
    <ValuePicker
      {...rest}
      sourceValue={source}
      targetValue={target}
      onSourceChange={setSource}
      onTargetChange={setTarget}
    />
  );
};
// ── Baseline ────────────────────────────────────────────────────────────────
/**
 * The shape every calculator uses: merged title, rupee badge, one row of quick
 * steps, and the `C / + / -` cluster. `+` and `-` do double duty — they set the
 * direction the step buttons apply, and press again to nudge by `defaultStep`.
 */
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
/** `showWords` spells the figure out underneath — worth it for large amounts. */
export const WithWordsReadout: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, value: '7500000', showWords: true },
};
/**
 * `titleStyle="default"` detaches the heading from the card. Use it when the
 * picker sits under its own section label rather than inside a dense stack.
 */
export const PlainTitle: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, titleStyle: 'default' },
};
/** No `title` and no `tabs` — the card is just the input row and the grid. */
export const Untitled: Story = {
  render: (args) => <Controlled {...args} />,
  args: { value: '1000', stepData: DEFAULT_AMOUNT_STEPS, singleRow: true, tabs: [] },
};
// ── Step grids ──────────────────────────────────────────────────────────────
/**
 * `stepRows` renders a multi-row grid and takes precedence over `stepData`.
 * Row one is styled as the primary row, the rest as secondary.
 */
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
/**
 * A coarser preset list. Fewer, larger steps suit a field that moves in big
 * jumps; this is the set `PairedValuePicker` defaults to.
 */
export const CoarseSteps: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Withdrawal per instalment', stepData: DEFAULT_PAIRED_AMOUNT_STEPS },
};
/** `stepData: []` drops the grid entirely, leaving a typed field with +/-. */
export const NoSteps: Story = {
  render: (args) => <Controlled {...args} />,
  args: { title: 'Exact amount', value: '12345', stepData: [], tabs: [] },
};
// ── Units and formatting ────────────────────────────────────────────────────
/**
 * A `%` symbol switches on decimal support automatically, and `defaultStep`
 * drops to 0.5. Titles containing "rate" or "roi" do the same.
 */
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
/** `symbol: null` removes the badge for a unitless quantity. */
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
/** `symbolBg: false` keeps the glyph but drops its filled badge. */
export const BareSymbol: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Unbadged symbol', symbolBg: false },
};
/** `locale` drives the grouping. `en-US` groups in thousands, `en-IN` in lakhs. */
export const USLocale: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Monthly investment (US grouping)', value: '1250000', locale: 'en-US', symbol: '$' },
};
/** `endAdornment` slots an extra control between the field and the buttons. */
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
// ── Tabs ────────────────────────────────────────────────────────────────────
/**
 * With `tabs` and no `title`, the card leads with a tab strip. Leave
 * `activeTab` unset for internal state, or pass `activeTab` + `onTabChange`
 * to drive it yourself.
 */
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
/** `tabSize` trades tab height for vertical room: `xs` through `xl`. */
export const SmallTabs: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...WithTabs.args, tabSize: 'xs' },
  parameters: { width: '520px' },
};
// ── Bounds and states ───────────────────────────────────────────────────────
/**
 * `min` / `max` clamp typing, stepping and the +/- buttons. Here the ceiling is
 * ₹1,00,000: press `+1L` twice and the value stops rather than overshooting.
 * `-` is disabled at the floor, and `C` at `min`.
 */
export const ClampedRange: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Capped at ₹1,00,000', value: '50000', min: 1000, max: 100000 },
};
/** `disabled` greys the whole control and blocks every input path. */
export const Disabled: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, disabled: true },
};
/**
 * `readOnly` keeps the field focusable and selectable but rejects typing. The
 * step buttons still work — use `disabled` to freeze the value outright.
 */
export const ReadOnly: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, readOnly: true },
};
/** Zero renders as a bare `0`, and both `C` and `-` are disabled at the floor. */
export const AtZero: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, value: '0' },
};
/** `allowDecimals` forces fractional input even for a rupee field. */
export const Decimals: Story = {
  render: (args) => <Controlled {...args} />,
  args: { ...Default.args, title: 'Units held', value: '1743.805', symbol: null, allowDecimals: true, defaultStep: 0.5 },
};
// ── Scale: the `scale` prop ─────────────────────────────────────────────────
/**
 * **The case for `scale="container"`.** Both pickers below sit in a 380px
 * column on a wide screen. The top one is `auto` — its chrome read `tablet-up`,
 * which emits a media query as well as a container one, so it took the full web
 * scale and crowds the column. The bottom one sizes off the container instead.
 */
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
/**
 * The same `scale="container"` picker at four container widths. Nothing about
 * the viewport changes between them — only the box around the component — so
 * every difference here is the container query doing its work.
 *
 * | container | controls | step cells | input |
 * | --- | --- | --- | --- |
 * | ≥640px | 44px | 46px / 14px | 20px |
 * | 360–640px | 32px | 32px / 13px | 16.5px |
 * | ≤360px | 32px, 28px badge | 32px / 11px | 15.5px |
 *
 * Every control in the condensed tier is 32px — tabs, badge, input, the
 * `C/+/-` cluster and the step cells — and all four picker shells share the
 * `$control-height-condensed` token, so they cannot drift apart. Only the
 * decorative badge goes below it, to buy the field room in the tightest
 * columns. The input keeps 16.5px type regardless: iOS zooms the page when a
 * focused field's text drops under 16px.
 */
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
/**
 * `mobile` and `desktop` pin a fixed scale, ignoring both the viewport and the
 * container. They exist for preview frames that imitate a viewport they are not
 * in — everywhere else, `auto` or `container` is the right answer.
 */
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
/**
 * `embedded` sheds the border and radius so the picker can sit inside a slot
 * that already draws them — how the strategy calculator nests its fields. It
 * composes with `compact` and `scale`; all three are independent.
 */
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
// ── variant="paired" ────────────────────────────────────────────────────────
/**
 * `variant="paired"` is the generic two-slot box, side by side: a label over
 * each half and one joined border around both. `sourceSlot` / `targetSlot` take
 * any node, which is how the currency and unit converters drop their own
 * dropdowns in.
 */
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
/**
 * With no `sourceOptions` and no `sourceSlot`, each half falls back to a plain
 * text input. `sourcePlaceholder` / `targetPlaceholder` label the empty state.
 */
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
/**
 * Any node works in a slot, so the two halves need not match. Here the right
 * one is a read-only result rather than a second input — the unit converter's
 * shape.
 */
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
// ── variant="stacked-paired" ────────────────────────────────────────────────
/**
 * `stacked-paired` is the same two slots stacked instead of side by side — for
 * columns too narrow to halve. For two *amounts* that constrain each other,
 * reach for `PairedValuePicker` instead; it shares one stepper between them.
 */
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
// ── variant="date-range" ────────────────────────────────────────────────────
/** `variant="date-range"` with `singleDate` — one labelled date field. */
export const SingleDate: Story = {
  render: (args) => <DateControlled {...args} />,
  args: {
    variant: 'date-range',
    singleDate: true,
    startTitle: 'Investment date',
    startDate: '2018-01-01',
  },
};
/**
 * A start/end pair in one joined box. The component keeps the range ordered:
 * moving the start past the end drags the end with it, and vice versa.
 */
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
/** `scale="container"` applies to the date variant too, for the same reason. */
export const DateRangeContainerScale: Story = {
  name: 'Date range, container scale (condensed)',
  parameters: { width: '340px' },
  render: (args) => <DateControlled {...args} />,
  args: { ...DateRange.args, scale: 'container', compact: true, embedded: true },
};
/** `dateMode="year"` swaps the date inputs for year dropdowns. */
export const YearRange: Story = {
  render: (args) => <DateControlled {...args} />,
  args: {
    variant: 'date-range',
    dateMode: 'year',
    startTitle: 'From year',
    endTitle: 'To year',
    startDate: '2019',
    endDate: '2026',
    startYearOptions: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    endYearOptions: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
  },
};
