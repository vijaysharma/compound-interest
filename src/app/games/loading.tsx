import { CalculatorSkeleton } from '@/components/skeleton';

export default function GamesLoading() {
  return <CalculatorSkeleton withChart={false} pickers={2} />;
}
