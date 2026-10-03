import PageComponent from '@/views/games/queens';
import { SEO_PAGES } from '@/data/seoMetadata';

export const metadata = SEO_PAGES.queens;

export default function Page() {
  return <PageComponent />;
}
