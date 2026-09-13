import PageComponent from '@/views/login';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.login;
export default function Page() {
  return <PageComponent />;
}
