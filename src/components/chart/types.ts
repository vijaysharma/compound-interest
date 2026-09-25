export interface ChartPoint {
  date: string;
  nav: number;
}
export interface ChartDataset {
  label: string;
  color: string;
  data: ChartPoint[];
  /**
   * Draws the line dashed. Used to mark a series as extrapolated rather than
   * measured — a projection past the last published NAV should not look like
   * data of the same standing as the history beside it.
   */
  dashed?: boolean;
  /** Custom line dash pattern (e.g. [6, 4] or [2, 3]). */
  lineDash?: number[];
  /** 0–1. Pairs with `dashed` to push a projected series visually back. */
  strokeOpacity?: number;
  /**
   * Appended to this series' tooltip, after the value. Carries the context a
   * date and a number cannot: which scenario produced it and whether it is
   * measured or projected.
   */
  tooltipNote?: string;
}
export interface ChartProps {
  className: string;
  datasets: ChartDataset[];
  investmentAmount: number;
  dataMode?: 'nav' | 'value';
  height?: number | 'auto';
  autoHeight?: boolean;
  minHeight?: number;
  enableZoom?: boolean;
  showPresets?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  emptyMessage?: string;
  startDate?: string | null;
  endDate?: string | null;
  onPresetChange?: (preset: string) => void;
  /**
   * Draws a labelled vertical rule at this date.
   *
   * On a chart that runs from real history into a projection, this is the
   * clearest single cue available: it says exactly where measurement stops.
   * Dashes and opacity alone leave the reader guessing at the boundary.
   */
  markerDate?: string | null;
  markerLabel?: string;
}
export interface DragState {
  isDragging: boolean;
  startX: number;
  currentX: number;
}
export interface ZoomRange {
  start: string;
  end: string;
}
