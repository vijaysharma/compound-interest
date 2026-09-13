import Home from '@/views/home';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.home;
export default function Page() {
  return <Home />;
}
