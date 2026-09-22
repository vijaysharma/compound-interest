import React from 'react';
import type { Decorator, Preview } from '@storybook/nextjs';
import '../src/index.scss';
import './docs.css';
/**
 * Every picker sizes itself off its nearest container, so a story rendered
 * edge-to-edge in the preview iframe would only ever show the widest tier. The
 * `width` parameter puts each story in a fixed-width box — set it per story to
 * demonstrate a specific tier, and read the live width off the label.
 */
const withWidth: Decorator = (Story, context) => {
  const width = (context.parameters.width as string | undefined) ?? '100%';
  const showRuler = context.parameters.showRuler !== false;
  return (
    <div style={{ padding: '1rem', background: 'var(--color-bg)' }}>
      <div style={{ width, maxWidth: '100%' }}>
        {showRuler && (
          <div
            style={{
              marginBottom: '0.4rem',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            container: {width}
          </div>
        )}
        <Story />
      </div>
    </div>
  );
};
const preview: Preview = {
  decorators: [withWidth],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true, sort: 'requiredFirst' },
    docs: { toc: true },
    options: {
      storySort: {
        order: ['Components', ['ValuePicker', 'PairedValuePicker']],
      },
    },
  },
};
export default preview;
