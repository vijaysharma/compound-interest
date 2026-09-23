import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  CalculatorSkeleton,
  ChartSkeleton,
  NavValuesSkeleton,
  PickerSkeleton,
  StatRowSkeleton,
} from './index';
/**
 * Route and region placeholders.
 *
 * These replace centred spinners. A spinner says "something is happening" but
 * nothing about what, so the viewport still reads as blank, and because it is a
 * different shape from the content it stands in for, the layout jumps when data
 * lands.
 *
 * ### The one thing to get right
 * `ChartSkeleton` is normally rendered *inside* a container that has already
 * reserved the chart's box — `Chart`'s `.emptyContainer`, which centres its
 * child. It must therefore fill its parent, not size itself from its children.
 * *In Centring Container* is that exact case, kept as a story because getting
 * it wrong is not subtle: every bar collapsed to zero width and all that showed
 * on screen were the frame's own left and right borders as two tall hairlines.
 */
const meta = {
  title: 'Components/Skeleton',
  parameters: {
    width: '100%',
    showRuler: false,
    layout: 'fullscreen',
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
/** How a calculator route appears the instant it is requested. */
export const CalculatorRoute: Story = {
  render: () => <CalculatorSkeleton />,
};
/** Content and utility routes, which reserve no chart region. */
export const RouteWithoutChart: Story = {
  render: () => <CalculatorSkeleton withChart={false} pickers={3} />,
};
/**
 * The real deployment context: a parent that has already reserved the height
 * and centres its child. The placeholder must fill the box edge to edge.
 */
export const InCentringContainer: Story = {
  render: () => (
    <div style={{ padding: '1rem' }}>
      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
        parent: 320px tall, display:flex, justify-content:center
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: 320,
          outline: '2px dashed rgba(255,0,0,.35)',
        }}
      >
        <ChartSkeleton />
      </div>
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
        The bars must span the dashed box. If they hug the centre, the collapse
        has regressed.
      </p>
    </div>
  ),
};
/** Standalone: nothing above has reserved a height, so it supplies its own. */
export const ChartStandalone: Story = {
  render: () => (
    <div style={{ padding: '1rem' }}>
      <ChartSkeleton standalone />
    </div>
  ),
};
/** Region placeholders, at the sizes they stand in for. */
export const Regions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>NavValuesSkeleton</p>
        <div style={{ maxWidth: 320 }}>
          <NavValuesSkeleton />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>PickerSkeleton</p>
        <div style={{ maxWidth: 380 }}>
          <PickerSkeleton />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>StatRowSkeleton</p>
        <StatRowSkeleton />
      </div>
    </div>
  ),
};
