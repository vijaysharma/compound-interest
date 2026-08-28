import { AgCharts } from 'ag-charts-react';
import { AgCartesianChartOptions } from 'ag-charts-types';
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
const Chart = ({ className, datasets, investmentAmount }: ChartProps) => {
  if (datasets.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <span className="text-sm opacity-60">No chart data available</span>
      </div>
    );
  }
  /*
   * ==========================================================
   * VALID INVESTMENT AMOUNT
   * ==========================================================
   */
  const initialInvestment =
    Number.isFinite(investmentAmount) && investmentAmount > 0 ? investmentAmount : 0;
  if (initialInvestment <= 0) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <span className="text-sm opacity-60">Enter an investment amount to view growth</span>
      </div>
    );
  }
  /*
   * ==========================================================
   * PREPARE EACH FUND INDEPENDENTLY
   * ==========================================================
   *
   * Every fund has a different starting NAV.
   *
   * Example:
   *
   * Fund A:
   *   Start NAV = 20
   *   NAV today = 40
   *
   * Fund B:
   *   Start NAV = 50
   *   NAV today = 75
   *
   * For ₹1,00,000:
   *
   * Fund A:
   *   1,00,000 × (40 / 20)
   *   = 2,00,000
   *
   * Fund B:
   *   1,00,000 × (75 / 50)
   *   = 1,50,000
   *
   * Both lines therefore start at ₹1,00,000.
   *
   * This makes the chart a true investment-growth comparison.
   * ==========================================================
   */
  const normalizedDatasets = datasets.map((dataset) => {
    /*
     * Sort the fund's own data first.
     */
    const sortedData = [...dataset.data]
      .filter(
        (point) =>
          Number.isFinite(point.nav) && point.nav > 0 && Number.isFinite(getDateTime(point.date))
      )
      .sort((a, b) => getDateTime(a.date) - getDateTime(b.date));
    if (sortedData.length === 0) {
      return {
        ...dataset,
        data: [],
      };
    }
    /*
     * The first NAV in the selected range is the
     * reference NAV for this particular fund.
     */
    const startingNav = sortedData[0].nav;
    if (!Number.isFinite(startingNav) || startingNav <= 0) {
      return {
        ...dataset,
        data: [],
      };
    }
    /*
     * Convert NAV -> investment value.
     *
     * investmentValue =
     *
     * initialInvestment *
     * (currentNAV / startingNAV)
     */
    const growthData = sortedData.map((point) => ({
      date: point.date,
      nav: Number((initialInvestment * (point.nav / startingNav)).toFixed(2)),
    }));
    return {
      ...dataset,
      data: growthData,
    };
  });
  /*
   * ==========================================================
   * COLLECT ALL DATES
   * ==========================================================
   */
  const dates = Array.from(
    new Set(normalizedDatasets.flatMap((dataset) => dataset.data.map((point) => point.date)))
  );
  /*
   * ==========================================================
   * SORT OLDEST -> NEWEST
   * ==========================================================
   */
  const sortedDates = [...dates].sort((a, b) => getDateTime(a) - getDateTime(b));
  /*
   * ==========================================================
   * BUILD CHART DATA
   * ==========================================================
   */
  const chartData = sortedDates.map((date) => {
    const row: Record<string, string | number> = {
      date,
    };
    normalizedDatasets.forEach((dataset, index) => {
      const point = dataset.data.find((item) => item.date === date);
      row[`fund_${index}`] = point?.nav ?? NaN;
    });
    return row;
  });
  /*
   * ==========================================================
   * BUILD SERIES
   * ==========================================================
   */
  const series = normalizedDatasets.map((dataset, index) => ({
    type: 'line' as const,
    xKey: 'date',
    xName: 'Date',
    yKey: `fund_${index}`,
    yName: dataset.label,
    /*
     * Color comes from mutual_fund.tsx.
     */
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
          content:
            typeof value === 'number' && Number.isFinite(value) ? formatCurrency(value) : 'N/A',
        };
      },
    },
  }));
  /*
   * ==========================================================
   * CHART OPTIONS
   * ==========================================================
   */
  const chartOptions: AgCartesianChartOptions = {
    background: {
      visible: false,
    },
    data: chartData,
    height: 240,
    zoom: {
      enableAxisDragging: false,
      enablePanning: false,
      enableScrolling: false,
      enableSelecting: true,
    },
    /*
     * We keep the AG Charts legend disabled because
     * you wanted a display-only legend.
     *
     * The custom legend below is therefore completely
     * non-clickable.
     */
    legend: {
      enabled: false,
      position: 'bottom',
      toggleSeries: false,
    },
    series,
    /*
     * AG Charts v14 keys axes by name instead of taking an array.
     * `x` and `y` are the default cartesian keys the series bind to.
     */
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
          formatter: ({ value }: { value: number }) => formatCurrency(value),
        },
      },
    },
  };
  return (
    <div className={className}>
      <AgCharts className="chart" options={chartOptions} />
    </div>
  );
};
export default Chart;
