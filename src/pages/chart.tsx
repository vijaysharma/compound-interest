import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-types";
const Chart = ({
  className,
  jsonData,
  mf,
  color,
}: {
  className: string;
  jsonData: { date: string; nav: number }[];
  mf: string;
  color?: string;
}) => {
  const chartOptions: AgChartOptions = {
    zoom: {
      enableAxisDragging: false,
      enablePanning: false,
      enableScrolling: false,
      enableSelecting: true,
    },
    background: {
      visible: false,
    },
    title: {
      text: `${mf}`,
      fontSize: 12,
    },
    data: jsonData,
    series: [
      {
        type: "line",
        xKey: "date",
        xName: "Date",
        yKey: "nav",
        yName: "NAV",
        stroke: color,
        marker: {
          enabled: false,
        },
        tooltip: {
          showArrow: false,
          renderer: function ({ datum, xKey, yKey }) {
            return {
              content: `<b>₹${datum[yKey].toFixed(4)}</b>`,
              title: datum[xKey],
            };
          },
        },
      },
    ],
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

      <p className="text-center text-xs -mt-5">
        from {jsonData[0].date} to {jsonData[jsonData.length - 1].date}
      </p>
    </div>
  );
};

export default Chart;
