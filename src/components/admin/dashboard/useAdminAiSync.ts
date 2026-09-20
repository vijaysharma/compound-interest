import { useState, useEffect, useCallback, FormEvent } from 'react';
import type { AlertMessage } from './types';
import {
  getAISettingsAction,
  updateAISettingsAction,
  syncMutualFundsAction,
  syncIMFAction,
  syncPPPAction,
} from '../../../actions/admin';
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
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    'You are an expert Indian Chartered Accountant and Tax Planner. Analyze the user financial numbers, income sources, deductions, capital gains, and dual regime comparison. Provide actionable, structured, prioritized recommendations to legally minimize Indian income tax, optimize Section 80C/80CCD/80D, capital gains harvesting, and recommend the optimal regime.'
  );
  const [imfJson, setImfJson] = useState('');
  const [pppJson, setPppJson] = useState('');
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
    return () => {
      cancelled = true;
    };
  }, [effectiveToken]);
  const handleSaveAiSettings = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('saving_ai_settings');
    setMessage(null);
    try {
      const res = await updateAISettingsAction(
        {
          enabled: aiEnabled,
          provider: aiProvider,
          model: aiModel,
          api_key: aiApiKey,
          system_prompt: aiSystemPrompt,
        },
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
      let synced: number | boolean | undefined;
      if (endpoint.includes('sync-mutual-funds')) {
        const res = await syncMutualFundsAction(effectiveToken);
        synced = res.synced;
      } else if (endpoint.includes('sync-imf')) {
        const res = await syncIMFAction(effectiveToken, body);
        synced = res.synced;
      } else if (endpoint.includes('sync-ppp')) {
        const res = await syncPPPAction(effectiveToken, body);
        synced = res.synced;
      } else {
        throw new Error('Unknown sync action');
      }
      let successText = 'Dataset synced successfully.';
      if (endpoint.includes('sync-mutual-funds')) {
        successText = `Mutual funds synced: ${synced}.`;
      } else if (endpoint.includes('sync-imf')) {
        successText = 'IMF inflation data synced successfully.';
      } else if (endpoint.includes('sync-ppp')) {
        successText =
          typeof synced === 'number'
            ? `World Bank PPP synced: ${synced} records.`
            : 'World Bank PPP data synced successfully.';
      }
      setMessage({ type: 'success', text: successText });
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
    fetchAiSettings,
    handleSaveAiSettings,
    sync,
  };
}
