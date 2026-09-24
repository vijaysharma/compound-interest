import React from 'react';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { InfoTooltip } from './InfoTooltip';
import {
  HORIZON_PRESETS,
  SCENARIO_BLURBS,
  SCENARIO_BUTTON_LABELS,
  SCENARIO_KEYS,
  type ProjectionSettings,
} from './projectionProfiles';
import styles from './StrategyCalculator.module.scss';
const VALUE_MODES = [
  { id: 'value-today', value: 'today' as const, title: "Today's ₹", tooltip: "Discounted to today's purchasing power" },
  { id: 'value-nominal', value: 'nominal' as const, title: 'Nominal', tooltip: 'Future unadjusted rupee figure' },
];
interface ProjectionControlsBarProps {
  settings: ProjectionSettings;
  onSettingsChange: (patch: Partial<ProjectionSettings>) => void;
}
export const ProjectionControlsBar = ({ settings, onSettingsChange }: ProjectionControlsBarProps) => (
  <div className={styles.chartControls}>
    <JoinedButtonGroup<number>
      title="Project to"
      data={HORIZON_PRESETS.map((years) => ({ id: `horizon-${years}`, value: years, title: `${years}y` }))}
      selectedValue={settings.horizonYears}
      updateSelectedValue={(horizonYears) => onSettingsChange({ horizonYears })}
      sizePrefix="sm"
      compact
      className={`${styles.chartControl} ${styles.chartControlWide}`}
    />
    <JoinedButtonGroup<ProjectionSettings['scenarioKey']>
      title={
        <span className={styles.chartControlTitle}>
          <span>Risk profile</span>
          <InfoTooltip ariaLabel="Explain Risk Profiles" align="center">
            <p className={styles.infoTitle}>Risk Profiles (Cons / Mod / Risk)</p>
            <p className={styles.infoDesc}>Market projections grounded in historical data and real market cycles:</p>
            <ul>
              <li><strong>Cons:</strong> ~8.5% nominal return, ~10% drawdowns for capital preservation.</li>
              <li><strong>Mod:</strong> ~12.0% nominal return (25-yr Nifty average), periodic ~20% market cycles.</li>
              <li><strong>Risk:</strong> ~14.5% nominal return, ~32% drawdowns for aggressive growth.</li>
            </ul>
          </InfoTooltip>
        </span>
      }
      data={SCENARIO_KEYS.map((key) => ({
        id: `scenario-${key}`,
        value: key,
        title: SCENARIO_BUTTON_LABELS[key],
        tooltip: SCENARIO_BLURBS[key],
      }))}
      selectedValue={settings.scenarioKey}
      updateSelectedValue={(scenarioKey) => onSettingsChange({ scenarioKey })}
      sizePrefix="sm"
      compact
      className={styles.chartControl}
    />
    <JoinedButtonGroup<ProjectionSettings['valueMode']>
      title={
        <span className={styles.chartControlTitle}>
          <span>Money</span>
          <InfoTooltip ariaLabel="Explain Money Modes" align="right">
            <p className={styles.infoTitle}>Today&apos;s ₹ vs Nominal (Inflation)</p>
            <p className={styles.infoDesc}>Future purchasing power adjustment at {settings.inflationPct}% annual inflation.</p>
            <ul>
              <li><strong>Today&apos;s ₹:</strong> Strips inflation to show actual goods and services purchasing power today.</li>
              <li><strong>Nominal:</strong> Raw future rupee figure as printed on account statements.</li>
            </ul>
          </InfoTooltip>
        </span>
      }
      data={VALUE_MODES}
      selectedValue={settings.valueMode}
      updateSelectedValue={(valueMode) => onSettingsChange({ valueMode })}
      sizePrefix="sm"
      compact
      className={styles.chartControl}
    />
  </div>
);
