import PageComponent from '@/views/games/sudoku';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.sudoku;
export default function Page() {
  return <PageComponent />;
}
