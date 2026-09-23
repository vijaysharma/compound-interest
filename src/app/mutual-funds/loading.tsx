import { CalculatorSkeleton } from '@/components/skeleton';
/**
 * Streamed the moment this segment is requested, ahead of any data — every mutual-fund route renders a chart, so reserve the plot area.
 *
 * Replaces a centred spinner, which told the user something was happening but
 * nothing about what, so the viewport still read as blank and the layout jumped
 * once content arrived.
 */
export default function Loading() {
  return <CalculatorSkeleton withChart={true} pickers={4} />;
}
