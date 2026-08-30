import { useMemo } from 'react';
import { AgCharts } from 'ag-charts-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
import { AgCartesianChartOptions } from 'ag-charts-types';
ModuleRegistry.registerModules([AllCommunityModule]);
interface ChartPoint {
  date: string;
  nav: number;
}
interface ChartDataset {
  label: string;
  color: string;
  data: ChartPoint[];
}
interface ChartProps {
  className: string;
  datasets: ChartDataset[];
  investmentAmount: number;
  dataMode?: 'nav' | 'value';
}
/*
 * NAV dates are DD-MM-YYYY.
 *
 * Do not use:
 *
 * new Date("24-08-2026")
 *
 * because that format is not reliably parsed by JavaScript.
 */
const getDateTime = (date: string): number => {
  const parts = date.split('-');
  if (parts.length !== 3) {
    return Number.NaN;
  }
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return Number.NaN;
  }
  return new Date(year, month, day).getTime();
};
/*
 * Format investment values for tooltips.
 */
const formatCurrency = (value: number): string =>
  `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
const formatAxisCurrency = (value: number): string => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (absoluteValue >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (absoluteValue >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
};
const Chart = ({ className, datasets, investmentAmount, dataMode = 'nav' }: ChartProps) => {
  const initialInvestment =
    Number.isFinite(investmentAmount) && investmentAmount > 0 ? investmentAmount : 0;
  const chartOptions = useMemo<AgCartesianChartOptions | null>(() => {
    if (datasets.length === 0 || initialInvestment <= 0) {
      return null;
    }
    const uniqueDateTimes = new Map<string, number>();
    const normalizedDatasets = datasets.map((dataset) => {
      const validPoints: { date: string; time: number; nav: number }[] = [];
      for (const point of dataset.data) {
        if (Number.isFinite(point.nav) && point.nav > 0) {
          const time = getDateTime(point.date);
          if (Number.isFinite(time)) {
            validPoints.push({ date: point.date, time, nav: point.nav });
            if (!uniqueDateTimes.has(point.date)) {
              uniqueDateTimes.set(point.date, time);
            }
          }
        }
      }
      validPoints.sort((a, b) => a.time - b.time);
      if (validPoints.length === 0) {
        return {
          label: dataset.label,
          color: dataset.color,
          valueMap: new Map<string, number>(),
        };
      }
      const startingNav = validPoints[0].nav;
      const valueMap = new Map<string, number>();
      if (dataMode === 'value') {
        for (const pt of validPoints) {
          valueMap.set(pt.date, pt.nav);
        }
      } else if (Number.isFinite(startingNav) && startingNav > 0) {
        const factor = initialInvestment / startingNav;
        for (const pt of validPoints) {
          valueMap.set(pt.date, Number((pt.nav * factor).toFixed(2)));
        }
      }
      return {
        label: dataset.label,
        color: dataset.color,
        valueMap,
      };
    });
    const sortedDates = Array.from(uniqueDateTimes.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([date]) => date);
    const chartData = sortedDates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (let i = 0; i < normalizedDatasets.length; i++) {
        row[`fund_${i}`] = normalizedDatasets[i].valueMap.get(date) ?? NaN;
      }
      return row;
    });
    const series = normalizedDatasets.map((dataset, index) => ({
      type: 'line' as const,
      xKey: 'date',
      xName: 'Date',
      yKey: `fund_${index}`,
      yName: dataset.label,
      stroke: dataset.color,
      marker: {
        enabled: false,
      },
      tooltip: {
        showArrow: false,
        renderer: ({ datum }: { datum: Record<string, string | number> }) => {
          const value = datum[`fund_${index}`];
          return {
            title: dataset.label,
            data: [
              {
                label: 'Value',
                value:
                  typeof value === 'number' && Number.isFinite(value)
                    ? formatCurrency(value)
                    : 'N/A',
              },
            ],
          };
        },
      },
    }));
    return {
      background: {
        visible: false,
      },
      data: chartData,
      height: 240,
      legend: {
        enabled: false,
        position: 'bottom',
        toggleSeries: false,
      },
      series,
      axes: {
        x: {
          type: 'category',
          position: 'bottom',
          label: {
            enabled: false,
            rotation: 0,
            avoidCollisions: true,
            fontSize: 9,
            fontWeight: 'bold',
          },
        },
        y: {
          type: 'number',
          position: 'left',
          label: {
            avoidCollisions: true,
            fontSize: 9,
            fontWeight: 'bold',
            formatter: ({ value }: { value: number }) => formatAxisCurrency(value),
          },
        },
      },
    };
  }, [datasets, initialInvestment, dataMode]);
  if (datasets.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <span className="text-sm opacity-60">No chart data available</span>
      </div>
    );
  }
  if (initialInvestment <= 0 || !chartOptions) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <span className="text-sm opacity-60">Enter an investment amount to view growth</span>
      </div>
    );
  }
  return (
    <div className={className}>
      <AgCharts className="chart" options={chartOptions} />
    </div>
  );
};
export default Chart;
