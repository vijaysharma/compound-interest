import PageComponent from '@/views/games/minesweeper';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.minesweeper;
export default function Page() {
  return <PageComponent />;
}
