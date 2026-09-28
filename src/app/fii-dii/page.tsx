import type { Metadata } from 'next';
import { FiiDiiTracker } from '@/views/fiiDii/FiiDiiTracker';
export const metadata: Metadata = {
  title: 'FII & DII Tracker | Historical Institutional Flows, Nifty 50 & Sensex',
  description:
    'Interactive historical tracking of Foreign and Domestic Institutional Investors (FII/DII) flows in India with CPI inflation & PPP adjustments and stock index overlays.',
  keywords: [
    'FII DII data',
    'FII DII activity',
    'institutional flows India',
    'Nifty 50 FII flow',
    'Sensex FII DII',
    'inflation adjusted FII flow',
    'PPP FII DII tracker',
    'NSE FII DII daily net',
  ],
};
export default function FiiDiiPage() {
  return <FiiDiiTracker />;
}
