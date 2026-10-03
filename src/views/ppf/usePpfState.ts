import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  calculatePPF,
  type PPFDepositTiming,
  type PPFExtensionMode,
  type PPFFrequency,
  type PPFFutureMode,
  type PPFCalculationResult,
  type PpfInvestmentRecord,
} from '../../utilities/ppfCalculations';
import {
  DEFAULT_PROJECTED_PPF_RATE,
  MAX_PPF_ANNUAL_DEPOSIT,
  MIN_PPF_ANNUAL_DEPOSIT,
} from '../../data/ppfRates';
import {
  getPpfDataAction,
  savePpfInvestmentAction,
  batchImportPpfInvestmentsAction,
  deletePpfInvestmentAction,
  clearPpfInvestmentsAction,
  savePpfPreferencesAction,
} from '../../actions/ppfHistory';

const PPF_GUEST_ID_KEY = 'rupee_ppf_guest_id';
const PPF_LOCAL_INVESTMENTS_KEY = 'rupee_ppf_investments_cache';
const PPF_LOCAL_PREFS_KEY = 'rupee_ppf_prefs_cache';

function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';
  let gid = localStorage.getItem(PPF_GUEST_ID_KEY);
  if (!gid) {
    gid = `guest_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    localStorage.setItem(PPF_GUEST_ID_KEY, gid);
  }
  return gid;
}

export function usePpfState() {
  const [frequency, setFrequency] = useState<PPFFrequency>('yearly');
  const [depositAmount, setDepositAmount] = useState<string>('150000');
  const [depositTiming, setDepositTiming] = useState<PPFDepositTiming>('before_5th');
  const [startYear, setStartYear] = useState<number>(2025);
  const [extensionBlocks, setExtensionBlocks] = useState<number>(0);
  const [extensionMode, setExtensionMode] = useState<PPFExtensionMode>('with_contribution');
  const [projectedRate, setProjectedRate] = useState<number>(DEFAULT_PROJECTED_PPF_RATE);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // History & Projections state
  const [investments, setInvestments] = useState<PpfInvestmentRecord[]>([]);
  const [futureContributionMode, setFutureContributionMode] = useState<PPFFutureMode>('continue');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>('synced');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const guestIdRef = useRef<string>('');
  const authTokenRef = useRef<string | null>(null);

  // Hydrate local cache immediately on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    guestIdRef.current = getOrCreateGuestId();
    authTokenRef.current = localStorage.getItem('auth_token');

    // Load cached investments from localStorage
    const cachedInv = localStorage.getItem(PPF_LOCAL_INVESTMENTS_KEY);
    if (cachedInv) {
      try {
        const parsed = JSON.parse(cachedInv);
        if (Array.isArray(parsed)) {
          setInvestments(parsed);
        }
      } catch {
        // Ignore JSON error
      }
    }

    // Load cached preferences from localStorage
    const cachedPrefs = localStorage.getItem(PPF_LOCAL_PREFS_KEY);
    if (cachedPrefs) {
      try {
        const p = JSON.parse(cachedPrefs);
        if (p.frequency) setFrequency(p.frequency);
        if (p.depositAmount) setDepositAmount(String(p.depositAmount));
        if (p.depositTiming) setDepositTiming(p.depositTiming);
        if (p.startYear) setStartYear(Number(p.startYear));
        if (p.extensionBlocks !== undefined) setExtensionBlocks(Number(p.extensionBlocks));
        if (p.extensionMode) setExtensionMode(p.extensionMode);
        if (p.projectedRate) setProjectedRate(Number(p.projectedRate));
        if (p.futureContributionMode) setFutureContributionMode(p.futureContributionMode);
      } catch {
        // Ignore JSON error
      }
    }

    // Fetch latest data from database
    const loadFromDb = async () => {
      try {
        const res = await getPpfDataAction(authTokenRef.current, guestIdRef.current);
        if (res.success) {
          if (Array.isArray(res.investments) && res.investments.length > 0) {
            setInvestments(res.investments);
            localStorage.setItem(PPF_LOCAL_INVESTMENTS_KEY, JSON.stringify(res.investments));
          }
          if (res.preferences) {
            const p = res.preferences;
            setFrequency(p.frequency);
            setDepositAmount(String(p.depositAmount));
            setDepositTiming(p.depositTiming);
            setStartYear(p.startYear);
            setExtensionBlocks(p.extensionBlocks);
            setExtensionMode(p.extensionMode);
            setProjectedRate(p.projectedRate);
            if (p.futureContributionMode) setFutureContributionMode(p.futureContributionMode);
          }
        }
      } catch (err) {
        console.warn('Failed to load PPF data from DB, using local cache:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFromDb();
  }, []);

  // Save preferences to DB and localStorage
  const persistPreferences = useCallback(
    async (overridePrefs?: Partial<Parameters<typeof savePpfPreferencesAction>[0]>) => {
      const prefsPayload = {
        frequency,
        depositAmount: Number(depositAmount) || 150000,
        depositTiming,
        startYear,
        extensionBlocks,
        extensionMode,
        projectedRate,
        futureContributionMode,
        ...overridePrefs,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(PPF_LOCAL_PREFS_KEY, JSON.stringify(prefsPayload));
      }

      try {
        await savePpfPreferencesAction(prefsPayload, authTokenRef.current, guestIdRef.current);
      } catch {
        // Fallback silently if offline
      }
    },
    [
      frequency,
      depositAmount,
      depositTiming,
      startYear,
      extensionBlocks,
      extensionMode,
      projectedRate,
      futureContributionMode,
    ]
  );

  const numericDeposit = useMemo(() => {
    const raw = Number(depositAmount.replace(/[^0-9]/g, '')) || 0;
    if (frequency === 'yearly') {
      return Math.min(MAX_PPF_ANNUAL_DEPOSIT, Math.max(MIN_PPF_ANNUAL_DEPOSIT, raw));
    }
    return Math.min(12500, Math.max(100, raw));
  }, [depositAmount, frequency]);

  // PPF Calculation result based on actual history (if available) or assumptions
  const ppfResult: PPFCalculationResult = useMemo(() => {
    return calculatePPF({
      depositAmount: numericDeposit,
      frequency,
      depositTiming,
      startYear,
      extensionBlocks,
      extensionMode,
      projectedRate,
      history: investments,
      futureContributionMode,
    });
  }, [
    numericDeposit,
    frequency,
    depositTiming,
    startYear,
    extensionBlocks,
    extensionMode,
    projectedRate,
    investments,
    futureContributionMode,
  ]);

  const investedPercent = useMemo(() => {
    if (!ppfResult.maturityAmount) return 50;
    return Math.round((ppfResult.totalInvested / ppfResult.maturityAmount) * 100);
  }, [ppfResult]);

  const gainsPercent = 100 - investedPercent;
  const wealthMultiplier = (ppfResult.maturityAmount / (ppfResult.totalInvested || 1)).toFixed(1);

  // Add a new investment entry
  const addInvestment = useCallback(
    async (entry: { investmentDate: string; amount: number; notes?: string }) => {
      setIsSaving(true);
      setSyncStatus('saving');
      const tempId = `ppf_inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newRecord: PpfInvestmentRecord = {
        id: tempId,
        investmentDate: entry.investmentDate,
        amount: entry.amount,
        notes: entry.notes || '',
      };

      const updated = [...investments, newRecord].sort((a, b) =>
        a.investmentDate.localeCompare(b.investmentDate)
      );
      setInvestments(updated);
      localStorage.setItem(PPF_LOCAL_INVESTMENTS_KEY, JSON.stringify(updated));

      try {
        const res = await savePpfInvestmentAction(entry, authTokenRef.current, guestIdRef.current);
        if (res.success && res.id !== tempId) {
          const synced = updated.map((item) => (item.id === tempId ? { ...item, id: res.id } : item));
          setInvestments(synced);
          localStorage.setItem(PPF_LOCAL_INVESTMENTS_KEY, JSON.stringify(synced));
        }
        setSyncStatus('synced');
        setStatusMessage('Investment added and saved to database');
      } catch (err: unknown) {
        setSyncStatus('offline');
        setStatusMessage(err instanceof Error ? err.message : 'Saved locally (offline mode)');
      } finally {
        setIsSaving(false);
      }
    },
    [investments]
  );

  // Edit an existing investment entry
  const editInvestment = useCallback(
    async (entry: { id: string; investmentDate: string; amount: number; notes?: string }) => {
      setIsSaving(true);
      setSyncStatus('saving');
      const updated = investments
        .map((item) => (item.id === entry.id ? { ...item, ...entry } : item))
        .sort((a, b) => a.investmentDate.localeCompare(b.investmentDate));
      setInvestments(updated);
      localStorage.setItem(PPF_LOCAL_INVESTMENTS_KEY, JSON.stringify(updated));

      try {
        await savePpfInvestmentAction(entry, authTokenRef.current, guestIdRef.current);
        setSyncStatus('synced');
        setStatusMessage('Record updated');
      } catch (err: unknown) {
        setSyncStatus('offline');
        setStatusMessage(err instanceof Error ? err.message : 'Updated locally');
      } finally {
        setIsSaving(false);
      }
    },
    [investments]
  );

  // Delete an investment entry
  const deleteInvestment = useCallback(
    async (id: string) => {
      setIsSaving(true);
      setSyncStatus('saving');
      const updated = investments.filter((item) => item.id !== id);
      setInvestments(updated);
      localStorage.setItem(PPF_LOCAL_INVESTMENTS_KEY, JSON.stringify(updated));

      try {
        await deletePpfInvestmentAction(id, authTokenRef.current, guestIdRef.current);
        setSyncStatus('synced');
        setStatusMessage('Record deleted');
      } catch (err: unknown) {
        setSyncStatus('offline');
        setStatusMessage(err instanceof Error ? err.message : 'Removed locally');
      } finally {
        setIsSaving(false);
      }
    },
    [investments]
  );

  // Batch import investments (from CSV / bulk text)
  const importInvestments = useCallback(
    async (entries: Array<{ investmentDate: string; amount: number; notes?: string }>) => {
      setIsSaving(true);
      setSyncStatus('saving');

      try {
        const res = await batchImportPpfInvestmentsAction(
          entries,
          authTokenRef.current,
          guestIdRef.current
        );
        // Refresh from DB to get newly generated IDs and sanitized dates
        const fresh = await getPpfDataAction(authTokenRef.current, guestIdRef.current);
        if (fresh.success && fresh.investments) {
          setInvestments(fresh.investments);
          localStorage.setItem(PPF_LOCAL_INVESTMENTS_KEY, JSON.stringify(fresh.investments));
        }
        setSyncStatus('synced');
        setStatusMessage(res.message);
      } catch (err: unknown) {
        // Fallback local import
        const importedRecords: PpfInvestmentRecord[] = entries.map((e, idx) => ({
          id: `local_imp_${Date.now()}_${idx}`,
          investmentDate: e.investmentDate,
          amount: e.amount,
          notes: e.notes || '',
        }));
        const merged = [...investments, ...importedRecords].sort((a, b) =>
          a.investmentDate.localeCompare(b.investmentDate)
        );
        setInvestments(merged);
        localStorage.setItem(PPF_LOCAL_INVESTMENTS_KEY, JSON.stringify(merged));
        setSyncStatus('offline');
        setStatusMessage(err instanceof Error ? err.message : 'Imported into local memory');
      } finally {
        setIsSaving(false);
      }
    },
    [investments]
  );

  // Clear all investment records
  const clearAllInvestments = useCallback(async () => {
    setIsSaving(true);
    setSyncStatus('saving');
    setInvestments([]);
    localStorage.removeItem(PPF_LOCAL_INVESTMENTS_KEY);

    try {
      await clearPpfInvestmentsAction(authTokenRef.current, guestIdRef.current);
      setSyncStatus('synced');
      setStatusMessage('History cleared');
    } catch {
      setSyncStatus('synced');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    frequency, setFrequency,
    depositAmount, setDepositAmount,
    depositTiming, setDepositTiming,
    startYear, setStartYear,
    extensionBlocks, setExtensionBlocks,
    extensionMode, setExtensionMode,
    projectedRate, setProjectedRate,
    expandedYear, setExpandedYear,
    ppfResult,
    investedPercent,
    gainsPercent,
    wealthMultiplier,
    // History & persistence
    investments,
    futureContributionMode,
    setFutureContributionMode,
    isLoading,
    isSaving,
    syncStatus,
    statusMessage,
    addInvestment,
    editInvestment,
    deleteInvestment,
    importInvestments,
    clearAllInvestments,
    persistPreferences,
  };
}
