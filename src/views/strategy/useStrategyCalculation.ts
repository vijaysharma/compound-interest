'use client';
import { useMemo } from 'react';
import { EMPTY_RESULT, runStrategy } from './engine';
import { hasBlockingError, validateStrategy, type ValidationIssue } from './validation';
import type { NavBook, StrategyConfig, StrategyResult } from './types';
export interface StrategyCalculation {
  result: StrategyResult;
  issues: ValidationIssue[];
  /** True when a configuration error stopped the engine from running. */
  blocked: boolean;
  hasNavData: boolean;
}
/**
 * Validates the configuration, then runs the engine once per change. The chart
 * and the statistics card both read this single result.
 */
export function useStrategyCalculation(
  config: StrategyConfig,
  navBook: NavBook
): StrategyCalculation {
  const hasNavData = Boolean(
    config.column1.fund && navBook[config.column1.fund.schemeCode]?.length
  );
  const issues = useMemo(() => validateStrategy(config, navBook), [config, navBook]);
  const blocked = hasBlockingError(issues);
  const result = useMemo(
    () => (blocked || !hasNavData ? EMPTY_RESULT : runStrategy(config, navBook)),
    [blocked, hasNavData, config, navBook]
  );
  return { result, issues, blocked, hasNavData };
}
