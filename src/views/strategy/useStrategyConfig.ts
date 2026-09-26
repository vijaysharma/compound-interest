'use client';
import { useCallback, useState } from 'react';
import { createDefaultConfig, nextId } from './defaults';
import {
  withAddedWithdrawal,
  withColumn1,
  withPatchedColumn2,
  withPatchedColumn3,
  withPatchedSwp,
  withPatchedWithdrawal,
  withToggledColumn2Fund,
  withoutWithdrawal,
  withBulkSwp,
  withDisabledSwp,
} from './configMutators';
import type {
  BulkSwpConfig,
  Column2FundConfig,
  Column3Config,
  FundRef,
  StrategyConfig,
  SwpRule,
  WithdrawalPeriod,
} from './types';
export interface StrategyConfigApi {
  config: StrategyConfig;
  setColumn1Fund: (fund: FundRef | null) => void;
  setColumn1Amount: (amount: number) => void;
  setInvestmentDate: (date: string) => void;
  /** Adds a period and returns its id, so the caller can expand it. */
  addWithdrawal: () => string;
  patchWithdrawal: (id: string, patch: Partial<WithdrawalPeriod>) => void;
  removeWithdrawal: (id: string) => void;
  toggleColumn2Fund: (fund: FundRef) => void;
  patchColumn2: (id: string, patch: Partial<Column2FundConfig>) => void;
  patchSwp: (id: string, patch: Partial<SwpRule>) => void;
  applyBulkSwp: (params: BulkSwpConfig) => void;
  disableBulkSwp: () => void;
  patchColumn3: (patch: Partial<Column3Config>) => void;
  /** Replaces the whole config, used when restoring a saved strategy. */
  restoreConfig: (config: StrategyConfig) => void;
  /** Returns the active strategy to the defaults, keeping it in the library. */
  resetConfig: () => void;
}
/** All user-editable strategy state, with the Column 1 -> Column 2 defaults applied. */
export function useStrategyConfig(): StrategyConfigApi {
  const [config, setConfig] = useState<StrategyConfig>(createDefaultConfig);
  const setColumn1Fund = useCallback((fund: FundRef | null) => {
    setConfig((prev) => withColumn1(prev, { fund }));
  }, []);
  const setColumn1Amount = useCallback((amount: number) => {
    setConfig((prev) => withColumn1(prev, { amount }));
  }, []);
  const setInvestmentDate = useCallback((investmentDate: string) => {
    setConfig((prev) => withColumn1(prev, { investmentDate }));
  }, []);
  const addWithdrawal = useCallback((): string => {
    // Minted up front so the caller can expand the period it just added.
    const id = nextId('wd');
    setConfig((prev) => withAddedWithdrawal(prev, id));
    return id;
  }, []);
  const patchWithdrawal = useCallback((id: string, patch: Partial<WithdrawalPeriod>) => {
    setConfig((prev) => withPatchedWithdrawal(prev, id, patch));
  }, []);
  const removeWithdrawal = useCallback((id: string) => {
    setConfig((prev) => withoutWithdrawal(prev, id));
  }, []);
  const toggleColumn2Fund = useCallback((fund: FundRef) => {
    setConfig((prev) => withToggledColumn2Fund(prev, fund));
  }, []);
  const patchColumn2 = useCallback((id: string, patch: Partial<Column2FundConfig>) => {
    setConfig((prev) => withPatchedColumn2(prev, id, patch));
  }, []);
  const patchSwp = useCallback((id: string, patch: Partial<SwpRule>) => {
    setConfig((prev) => withPatchedSwp(prev, id, patch));
  }, []);
  const applyBulkSwp = useCallback((params: BulkSwpConfig) => {
    setConfig((prev) => withBulkSwp(prev, params));
  }, []);
  const disableBulkSwp = useCallback(() => {
    setConfig((prev) => withDisabledSwp(prev));
  }, []);
  const patchColumn3 = useCallback((patch: Partial<Column3Config>) => {
    setConfig((prev) => withPatchedColumn3(prev, patch));
  }, []);
  const restoreConfig = useCallback((restored: StrategyConfig) => {
    setConfig(restored);
  }, []);
  const resetConfig = useCallback(() => {
    // Persistence belongs to the library, which writes this back to the active
    // entry; clearing storage here would fight it.
    setConfig(createDefaultConfig());
  }, []);
  return {
    config,
    setColumn1Fund,
    setColumn1Amount,
    setInvestmentDate,
    addWithdrawal,
    patchWithdrawal,
    removeWithdrawal,
    toggleColumn2Fund,
    patchColumn2,
    patchSwp,
    applyBulkSwp,
    disableBulkSwp,
    patchColumn3,
    restoreConfig,
    resetConfig,
  };
}
