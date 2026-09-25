import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChartDatasets, buildChartSeries } from '../chartSeriesBuilder';
import { getSortedDates } from '../chartUtils';
import type { ChartDataset } from '../types';
test('normalizeChartDatasets preserves zero values in value mode', () => {
  const datasets: ChartDataset[] = [
    {
      label: 'Core Fund',
      color: '#6d0b74',
      data: [
        { date: '2024-01-01', nav: 1000 },
        { date: '2024-02-01', nav: 0 },
        { date: '2024-03-01', nav: 500 },
      ],
    },
  ];
  const normalized = normalizeChartDatasets(datasets, 1000, 'value');
  assert.equal(normalized[0].valueMap.size, 3);
  assert.equal(normalized[0].valueMap.get('2024-02-01'), 0);
});
test('normalizeChartDatasets rejects zero or negative in nav mode', () => {
  const datasets: ChartDataset[] = [
    {
      label: 'Core Fund',
      color: '#6d0b74',
      data: [
        { date: '2024-01-01', nav: 10 },
        { date: '2024-02-01', nav: 0 },
        { date: '2024-03-01', nav: -5 },
        { date: '2024-04-01', nav: 12 },
      ],
    },
  ];
  const normalized = normalizeChartDatasets(datasets, 1000, 'nav');
  assert.equal(normalized[0].valueMap.size, 2);
  assert.equal(normalized[0].valueMap.has('2024-02-01'), false);
  assert.equal(normalized[0].valueMap.has('2024-03-01'), false);
});
test('getSortedDates preserves dates with zero nav/value', () => {
  const datasets: ChartDataset[] = [
    {
      label: 'Core Fund',
      color: '#6d0b74',
      data: [
        { date: '2024-01-01', nav: 0 },
        { date: '2024-02-01', nav: 100 },
      ],
    },
  ];
  const sorted = getSortedDates(datasets);
  assert.deepEqual(sorted, ['2024-01-01', '2024-02-01']);
});
test('buildChartSeries applies connectMissingData and custom lineDash', () => {
  const datasets: ChartDataset[] = [
    {
      label: 'Growth Proj',
      color: '#0891b2',
      dashed: true,
      lineDash: [2, 3],
      strokeOpacity: 0.85,
      data: [{ date: '2024-01-01', nav: 100 }],
    },
  ];
  const normalized = normalizeChartDatasets(datasets, 100, 'value');
  const series = buildChartSeries(normalized, { isMobile: false });
  assert.equal(series[0].connectMissingData, true);
  assert.deepEqual(series[0].lineDash, [2, 3]);
  assert.equal(series[0].strokeOpacity, 0.85);
});
