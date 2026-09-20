export interface ChartPoint {
  date: string;
  nav: number;
}
export interface ChartDataset {
  label: string;
  color: string;
  data: ChartPoint[];
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
