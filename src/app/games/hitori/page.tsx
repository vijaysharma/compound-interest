import PageComponent from '@/views/games/hitori';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.hitori;
export default function Page() {
  return <PageComponent />;
}
