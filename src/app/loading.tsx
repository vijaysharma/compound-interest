import { CalculatorSkeleton } from '@/components/skeleton';
/**
 * Streamed the moment this segment is requested, ahead of any data — the generic shell — most routes here are content or utility pages.
 *
 * Replaces a centred spinner, which told the user something was happening but
 * nothing about what, so the viewport still read as blank and the layout jumped
 * once content arrived.
 */
export default function Loading() {
  return <CalculatorSkeleton withChart={false} pickers={3} />;
}
