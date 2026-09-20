'use server';
import { ensureTables, getDb, getUserFromToken } from '@/lib/db';
import { fetchAISettings } from './tax-ai/defaultSettings';
import { buildTaxPrompt, callGeminiApi } from './tax-ai/geminiPrompt';
export async function getTaxAIStatusAction(): Promise<{
  enabled: boolean;
  provider: string;
  model: string;
  hasApiKey: boolean;
}> {
  const aiSettings = await fetchAISettings();
  return {
    enabled: aiSettings.enabled,
    provider: aiSettings.provider,
    model: aiSettings.model,
    hasApiKey: Boolean(
      aiSettings.api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    ),
  };
}
export async function generateTaxAIAdviceAction(
  body: {
    financialSummary?: Record<string, unknown>;
    userQuestion?: string;
  },
  token?: string | null
): Promise<{
  enabled: boolean;
  needsUpgrade?: boolean;
  requiredTier?: string;
  model?: string;
  advice?: string;
  error?: string;
  message?: string;
}> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  const isTaxPro =
    user &&
    (user.role === 'admin' ||
      (user.subscription_status === 'active' &&
        (user.subscription_plan === 'tax_monthly' || user.subscription_plan === 'tax_yearly')));
  if (!isTaxPro) {
    return {
      enabled: true,
      needsUpgrade: true,
      requiredTier: 'tax_pro',
      message:
        'Personalized Tax Strategy & Optimization Advisory is available exclusively with the Tax Pro plan (₹129/month or ₹999/year).',
    };
  }
  const aiSettings = await fetchAISettings();
  if (!aiSettings.enabled) {
    return {
      enabled: false,
      message: 'Tax Strategy Advisory is currently disabled by administrator.',
    };
  }
  const apiKey =
    aiSettings.api_key?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    return {
      enabled: true,
      error: 'NO_API_KEY',
      message:
        'Tax Strategy Engine is not configured. Please add an API key in the Admin Panel or configure GEMINI_API_KEY in server environment variables.',
    };
  }
  const { financialSummary, userQuestion } = body;
  const model = aiSettings.model || 'gemini-2.5-flash';
  const promptText = buildTaxPrompt(aiSettings.system_prompt, financialSummary, userQuestion);
  const result = await callGeminiApi(model, apiKey, promptText);
  if (result.error) {
    return {
      enabled: true,
      error: result.error,
      message: result.message,
    };
  }
  return {
    enabled: true,
    model,
    advice: result.text,
  };
}
