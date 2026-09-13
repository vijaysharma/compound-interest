import PageComponent from '@/views/about';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.about;
export default function Page() {
  return <PageComponent />;
}
