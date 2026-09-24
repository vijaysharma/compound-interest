'use client';
import React, { useCallback, useState } from 'react';
import SEOHead from '../components/SEOHead';
import { useStrategyConfig } from './strategy/useStrategyConfig';
import { useStrategyNav } from './strategy/useStrategyNav';
import { useStrategyCalculation } from './strategy/useStrategyCalculation';
import { useStrategyLibrary } from './strategy/useStrategyLibrary';
import { StrategyLibraryBar } from './strategy/StrategyLibraryBar';
import { StrategyChartCard } from './strategy/StrategyChartCard';
import { FinalStatsCard } from './strategy/FinalStatsCard';
import { StrategyIssues } from './strategy/StrategyIssues';
import { Column1Panel } from './strategy/Column1Panel';
import { Column2Panel } from './strategy/Column2Panel';
import { Column3Panel } from './strategy/Column3Panel';
import { useStrategyProjection } from './strategy/useStrategyProjection';
import { StrategyFundModal } from './strategy/StrategyFundModal';
import { COLUMN_WORDS } from './strategy/labels';
import { DEFAULT_PROJECTION_SETTINGS, type ProjectionSettings } from './strategy/projection';
import type { FundRef } from './strategy/types';
import styles from './strategy/StrategyCalculator.module.scss';
type PickerTarget = 'column1' | 'column2' | null;
const StrategyCalculatorView = () => {
  const api = useStrategyConfig();
  const library = useStrategyLibrary(api.config, api.restoreConfig);
  const { navBook, isLoading, error } = useStrategyNav(api.config);
  const { result, issues, blocked, hasNavData } = useStrategyCalculation(api.config, navBook);
  const [picker, setPicker] = useState<PickerTarget>(null);
  /*
   * Projection settings are deliberately not part of StrategyConfig: they ask
   * "what if this carried on", which is a question about the strategy rather
   * than part of it, and keeping them out leaves the saved shape unchanged.
   * The yearly increase starts at 0, i.e. whatever the configuration already
   * says, and the note under the table points out what that means over decades.
   */
  const [projectionSettings, setProjectionSettings] = useState<ProjectionSettings>(
    DEFAULT_PROJECTION_SETTINGS
  );
  const patchProjection = useCallback((patch: Partial<ProjectionSettings>) => {
    setProjectionSettings((prev) => ({ ...prev, ...patch }));
  }, []);
  const projection = useStrategyProjection(
    api.config,
    navBook,
    result,
    projectionSettings,
    // Gated on the user's own switch as well as on there being data: with the
    // projection off, no extra engine run happens at all.
    projectionSettings.enabled && !blocked && hasNavData
    // All three scenarios are only needed for the comparison table, and only
  );
  const handleToggleFund = (fund: FundRef) => {
    if (picker === 'column1') {
      const isSelected = api.config.column1.fund?.schemeCode === fund.schemeCode;
      api.setColumn1Fund(isSelected ? null : fund);
      return;
    }
    api.toggleColumn2Fund(fund);
  };
  const selectedFunds =
    picker === 'column1'
      ? api.config.column1.fund
        ? [api.config.column1.fund]
        : []
      : api.config.column2.map((entry) => entry.fund);
  const chartMessage = !api.config.column1.fund
    ? `Select the ${COLUMN_WORDS.core} fund to plot its actual NAV history.`
    : !hasNavData
      ? 'Historical NAV data is unavailable for the selected fund.'
      : blocked
        ? 'Fix the configuration errors below to calculate the strategy.'
        : null;
  return (
    <main
      className={`${styles.page} strategy-calculator-page`}
      aria-labelledby="strategy-calculator-title"
    >
      <SEOHead
        title="Historical NAV Strategy Calculator — Backtest SWP, SIP & Reinvestment | Rupee Calculator"
        description="Backtest a real mutual fund strategy on actual AMFI NAV history: an initial lumpsum, staged withdrawals, SIPs into multiple funds, SWPs, and reinvestment back into the original fund."
        keywords="historical NAV calculator, mutual fund strategy backtest, SWP SIP reinvestment, AMFI NAV history, actual NAV portfolio value"
        canonicalPath="/strategy-calculator"
      />
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.headerTitle}>Strategy calculator</h1>
          <StrategyLibraryBar library={library} onReset={api.resetConfig} />
        </div>
        {/* <p className={styles.headerNote}>
          Every figure on this page is calculated from actual published NAVs. Units are bought and
          sold at the NAV applicable to each transaction date, and holdings are valued at the NAV
          applicable to the valuation date. Nothing here assumes a rate of return. Your
          configuration is saved in this browser.
        </p> */}
      </header>
      <div className={styles.topRow}>
        <StrategyChartCard
          config={api.config}
          result={result}
          isLoading={isLoading}
          projection={projection}
          settings={projectionSettings}
          onSettingsChange={patchProjection}
          message={chartMessage}
        />
        <FinalStatsCard totals={result.totals} />
      </div>
      <StrategyIssues issues={issues} warnings={result.warnings} navError={error} />
      <div className={styles.columns}>
        <Column1Panel
          api={api}
          navBook={navBook}
          result={result}
          onOpenFundPicker={() => setPicker('column1')}
        />
        <Column2Panel
          api={api}
          navBook={navBook}
          result={result}
          onOpenFundPicker={() => setPicker('column2')}
        />
        <Column3Panel api={api} result={result} />
      </div>
      <StrategyFundModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        selected={selectedFunds}
        onToggle={handleToggleFund}
        colorOffset={picker === 'column2' ? 1 : 0}
      />
    </main>
  );
};
export default StrategyCalculatorView;
