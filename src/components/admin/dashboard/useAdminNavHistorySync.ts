import { useState, useEffect } from 'react';
import type { AlertMessage } from './types';
import { getNavHistorySyncStatusAction, syncNavHistoryAction } from '../../../actions/admin';
import type { NavHistoryCheckpoint, NavHistorySyncReport } from '../../../actions/admin/navHistoryTypes';
import {
  calculateNext90DayWindow,
  calculateShiftedWindow,
  validate90DayInterval,
  MAX_AMFI_HISTORY_DAYS,
} from '../../../actions/admin/navHistoryDates';
export function useAdminNavHistorySync(
  effectiveToken: string,
  setBusy: (val: string | null) => void,
  setMessage: (msg: AlertMessage | null) => void
) {
  const [fromDate, setFromDate] = useState('2026-06-27');
  const [toDate, setToDate] = useState('2026-09-24');
  const [schemeCodes, setSchemeCodes] = useState('');
  const [report, setReport] = useState<NavHistorySyncReport | null>(null);
  const [checkpoint, setCheckpoint] = useState<NavHistoryCheckpoint | null>(null);
  const validation = validate90DayInterval(fromDate, toDate);
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!effectiveToken || cancelled) return;
      try {
        const res = await getNavHistorySyncStatusAction(effectiveToken);
        if (res && !cancelled) {
          setCheckpoint(res);
          setFromDate(res.nextFrom);
          setToDate(res.nextTo);
        }
      } catch {
        // initial load silent
      }
    };
    void init();
    return () => { cancelled = true; };
  }, [effectiveToken]);
  const shiftWindow = (direction: 'back' | 'forward') => {
    const shift = direction === 'back' ? -MAX_AMFI_HISTORY_DAYS : MAX_AMFI_HISTORY_DAYS;
    const next = calculateShiftedWindow(fromDate, toDate, shift);
    setFromDate(next.fromDate);
    setToDate(next.toDate);
  };
  const loadNextWindow = () => {
    if (report) {
      setFromDate(report.nextFromDate);
      setToDate(report.nextToDate);
    } else if (checkpoint) {
      setFromDate(checkpoint.nextFrom);
      setToDate(checkpoint.nextTo);
    } else {
      const next = calculateNext90DayWindow(fromDate);
      setFromDate(next.nextFrom);
      setToDate(next.nextTo);
    }
  };
  const syncHistory = async (customFrom?: string, customTo?: string) => {
    const targetFrom = customFrom ?? fromDate;
    const targetTo = customTo ?? toDate;
    const check = validate90DayInterval(targetFrom, targetTo);
    if (!check.isValid) {
      setMessage({ type: 'error', text: check.error ?? 'Invalid date interval' });
      return;
    }
    setBusy('sync-nav-history');
    setMessage(null);
    try {
      const codes = schemeCodes.split(/[\s,]+/).map((c) => c.trim()).filter(Boolean);
      const res = await syncNavHistoryAction(effectiveToken, {
        fromDate: targetFrom,
        toDate: targetTo,
        schemeCodes: codes.length ? codes : undefined,
      });
      setReport(res);
      setCheckpoint({
        lastSyncedFrom: res.fromDate,
        lastSyncedTo: res.toDate,
        nextFrom: res.nextFromDate,
        nextTo: res.nextToDate,
        recordsStored: res.totalRecords,
        schemesUpdated: res.schemesUpdated,
        syncedAt: Date.now(),
      });
      setMessage({
        type: 'success',
        text: `AMFI historical sync completed! ${res.totalRecords.toLocaleString()} records merged across ${res.schemesUpdated} schemes in ${(res.elapsedMs / 1000).toFixed(1)}s. Ready for next window (${res.nextFromAmfi} → ${res.nextToAmfi}).`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Historical sync failed' });
    } finally {
      setBusy(null);
    }
  };
  return {
    fromDate,
    toDate,
    schemeCodes,
    report,
    checkpoint,
    validation,
    setFromDate,
    setToDate,
    setSchemeCodes,
    shiftWindow,
    loadNextWindow,
    syncHistory,
  };
}
