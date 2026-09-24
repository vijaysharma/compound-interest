import { useState, useEffect, useCallback, FormEvent } from 'react';
import type { AlertMessage } from './types';
import { getAISettingsAction, updateAISettingsAction } from '../../../actions/admin';
import type { NavSyncReport } from '../../../actions/admin/navSync';
import { executeAdminSync } from './adminSyncExecutor';
const DEFAULT_SYSTEM_PROMPT =
  'You are an expert Indian Chartered Accountant and Tax Planner. Analyze the user financial numbers, income sources, deductions, capital gains, and dual regime comparison. Provide actionable, structured, prioritized recommendations to legally minimize Indian income tax, optimize Section 80C/80CCD/80D, capital gains harvesting, and recommend the optimal regime.';
export function useAdminAiSync(
  effectiveToken: string,
  setBusy: (val: string | null) => void,
  setMessage: (msg: AlertMessage | null) => void
) {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiHasKey, setAiHasKey] = useState(false);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [imfJson, setImfJson] = useState('');
  const [pppJson, setPppJson] = useState('');
  const [navSchemeCodes, setNavSchemeCodes] = useState('');
  const [navReport, setNavReport] = useState<NavSyncReport | null>(null);
  const fetchAiSettings = useCallback(async () => {
    if (!effectiveToken) return;
    try {
      const res = await getAISettingsAction(effectiveToken);
      if (res.settings) {
        if (typeof res.settings.enabled === 'boolean') setAiEnabled(res.settings.enabled);
        if (res.settings.provider) setAiProvider(res.settings.provider);
        if (res.settings.model) setAiModel(res.settings.model);
        if (res.settings.api_key) setAiApiKey(res.settings.api_key);
        setAiHasKey(Boolean(res.settings.has_api_key));
        if (res.settings.system_prompt) setAiSystemPrompt(res.settings.system_prompt);
      }
    } catch (err) {
      console.warn('Failed to fetch AI settings:', err);
    }
  }, [effectiveToken]);
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (effectiveToken && !cancelled) {
        try {
          const aiRes = await getAISettingsAction(effectiveToken);
          if (aiRes.settings && !cancelled) {
            if (typeof aiRes.settings.enabled === 'boolean') setAiEnabled(aiRes.settings.enabled);
            if (aiRes.settings.provider) setAiProvider(aiRes.settings.provider);
            if (aiRes.settings.model) setAiModel(aiRes.settings.model);
            if (aiRes.settings.api_key) setAiApiKey(aiRes.settings.api_key);
            setAiHasKey(Boolean(aiRes.settings.has_api_key));
            if (aiRes.settings.system_prompt) setAiSystemPrompt(aiRes.settings.system_prompt);
          }
        } catch (err) {
          console.warn('Failed to fetch AI settings in init:', err);
        }
      }
    };
    void init();
    return () => { cancelled = true; };
  }, [effectiveToken]);
  const handleSaveAiSettings = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('saving_ai_settings');
    setMessage(null);
    try {
      const res = await updateAISettingsAction(
        { enabled: aiEnabled, provider: aiProvider, model: aiModel, api_key: aiApiKey, system_prompt: aiSystemPrompt },
        effectiveToken
      );
      if (!res.success) throw new Error(res.message || 'Failed to save AI settings');
      setMessage({ type: 'success', text: 'AI Tax Advisor settings updated successfully.' });
      void fetchAiSettings();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setBusy(null);
    }
  };
  const sync = async (endpoint: string, body?: string) => {
    setBusy(endpoint);
    setMessage(null);
    try {
      const result = await executeAdminSync(endpoint, effectiveToken, body, navSchemeCodes);
      if (result.report) setNavReport(result.report);
      setMessage({ type: 'success', text: result.messageText });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Sync failed' });
    } finally {
      setBusy(null);
    }
  };
  return {
    aiEnabled,
    setAiEnabled,
    aiProvider,
    setAiProvider,
    aiModel,
    setAiModel,
    aiApiKey,
    setAiApiKey,
    aiHasKey,
    aiSystemPrompt,
    setAiSystemPrompt,
    imfJson,
    setImfJson,
    pppJson,
    setPppJson,
    navSchemeCodes,
    setNavSchemeCodes,
    navReport,
    fetchAiSettings,
    handleSaveAiSettings,
    sync,
  };
}
