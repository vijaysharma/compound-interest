import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-types";

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
  const parts = date.split("-");

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

const Chart = ({ className, datasets }: ChartProps) => {
  if (datasets.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <span className="text-sm opacity-60">No chart data available</span>
      </div>
    );
  }

  /*
   * ==========================================================
   * COLLECT ALL DATES
   * ==========================================================
   */

  const dates = Array.from(
    new Set(datasets.flatMap((dataset) => dataset.data.map((point) => point.date)))
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

    datasets.forEach((dataset, index) => {
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

  const series = datasets.map((dataset, index) => ({
    type: "line" as const,
    xKey: "date",
    xName: "Date",
    yKey: `fund_${index}`,
    yName: dataset.label,
    /*
     * Color is explicitly supplied by mutual_fund.tsx.
     *
     * Four pinned funds therefore get four different
     * colors.
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
            typeof value === "number" && Number.isFinite(value) ? `₹${value.toFixed(4)}` : "N/A",
        };
      },
    },
  }));

  /*
   * ==========================================================
   * CHART OPTIONS
   * ==========================================================
   */

  const chartOptions: AgChartOptions = {
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
     * Display-only legend.
     *
     * Clicking a legend item will NOT hide/show its line.
     */

    legend: {
      enabled: false,
      position: "bottom",
      toggleSeries: false,
    },
    series,
    axes: [
      {
        type: "category",
        position: "bottom",
        label: {
          enabled: false,
          rotation: 0,
          avoidCollisions: true,
          fontSize: 9,
          fontWeight: "bold",
        },
      },
      {
        type: "number",
        position: "left",
        label: {
          avoidCollisions: true,
          fontSize: 9,
          fontWeight: "bold",
        },
      },
    ],
  };

  return (
    <div className={className}>
      <AgCharts className="chart" options={chartOptions} />
    </div>
  );
};

export default Chart;
