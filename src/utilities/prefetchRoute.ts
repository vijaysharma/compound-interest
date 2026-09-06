const routeImporters: Record<string, () => Promise<unknown>> = {
  '/login': () => import('../pages/login.tsx'),
  '/upgrade': () => import('../pages/upgrade.tsx'),
  '/admin': () => import('../pages/admin.tsx'),
  '/admin/shiprocket-rates': () => import('../pages/admin/shiprocketRatesPage.tsx'),
  '/admin/volumetric-weight': () => import('../pages/admin/volumetricWeightPage.tsx'),
  '/admin/wood-calculator': () => import('../pages/admin/woodCalculatorPage.tsx'),
  '/utilities/quick-notes': () => import('../pages/quickNotesPage.tsx'),
  '/admin/quick-notes': () => import('../pages/quickNotesPage.tsx'),
  '/admin/notes': () => import('../pages/quickNotesPage.tsx'),
  '/notes': () => import('../pages/quickNotesPage.tsx'),
  '/about': () => import('../pages/about.tsx'),
  '/privacy': () => import('../pages/privacy.tsx'),
  '/disclaimer': () => import('../pages/disclaimer.tsx'),
  '/emi-calculator': () => import('../pages/emiCalculator.tsx'),
  '/emi': () => import('../pages/emiCalculator.tsx'),
  '/fd-calculator': () => import('../pages/fd.tsx'),
  '/deposits/fd': () => import('../pages/fd.tsx'),
  '/rd-calculator': () => import('../pages/rd.tsx'),
  '/deposits/rd': () => import('../pages/rd.tsx'),
  '/compound-interest-calculator': () => import('../pages/fd.tsx'),
  '/inflation-calculator': () => import('../pages/inflationRates.tsx'),
  '/economics/inflation-rates': () => import('../pages/inflationRates.tsx'),
  '/ppp-calculator': () => import('../pages/pppExchangeRate.tsx'),
  '/economics/ppp-exchange-rate': () => import('../pages/pppExchangeRate.tsx'),
  '/currency-converter': () => import('../pages/currencyConverter.tsx'),
  '/utilities/currency-converter': () => import('../pages/currencyConverter.tsx'),
  '/economics/currency-converter': () => import('../pages/currencyConverter.tsx'),
  '/sip-calculator': () => import('../pages/fixedRateSip.tsx'),
  '/fixed-plans/fixed-rate-sip': () => import('../pages/fixedRateSip.tsx'),
  '/swp-calculator': () => import('../pages/fixedRateSwp.tsx'),
  '/fixed-plans/fixed-rate-swp': () => import('../pages/fixedRateSwp.tsx'),
  '/calculator': () => import('../pages/calculator.tsx'),
  '/utilities/calculator': () => import('../pages/calculator.tsx'),
  '/date-calculator': () => import('../pages/dateCalculator.tsx'),
  '/utilities/date-calculator': () => import('../pages/dateCalculator.tsx'),
  '/utilities/unit-converter': () => import('../pages/unitConverter.tsx'),
  '/mutual-funds/lumpsum': () => import('../pages/lumpsum.tsx'),
  '/mutual-funds/sip': () => import('../pages/sip.tsx'),
  '/mutual-funds/swp': () => import('../pages/swp.tsx'),
};
const prefetchedRoutes = new Set<string>();
export const prefetchRoute = (path: string): void => {
  if (!path || typeof path !== 'string') return;
  const cleanPath = path.split('?')[0].split('#')[0];
  if (prefetchedRoutes.has(cleanPath)) return;
  const importer = routeImporters[cleanPath];
  if (importer) {
    prefetchedRoutes.add(cleanPath);
    importer().catch(() => {
      prefetchedRoutes.delete(cleanPath);
    });
  }
};
