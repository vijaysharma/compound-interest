import { SEO_TAX_AND_LOANS } from './seo/seoTaxAndLoans';
import { SEO_DEPOSITS_AND_FUNDS } from './seo/seoDepositsAndFunds';
import { SEO_MUTUAL_FUNDS } from './seo/seoMutualFunds';
import { SEO_TOOLS_AND_STATIC } from './seo/seoToolsAndStatic';
export type { PageMetadataOptions } from './seo/seoConfig';
export {
  DOMAIN,
  DEFAULT_OG_IMAGE,
  createPageMetadata,
} from './seo/seoConfig';
export const SEO_PAGES = {
  ...SEO_TAX_AND_LOANS,
  ...SEO_DEPOSITS_AND_FUNDS,
  ...SEO_MUTUAL_FUNDS,
  ...SEO_TOOLS_AND_STATIC,
};
