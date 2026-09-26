'use server';
import { ensureTables, getDb, isAuthorizedUser, type AISettings } from '@/lib/db';
export async function getAISettingsAction(token?: string | null): Promise<{
  settings: AISettings & { has_api_key: boolean };
}> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const rows = (await sql`
    SELECT id, enabled, provider, model, api_key, system_prompt, updated_at
    FROM ai_settings
    WHERE id = 'default'
  `) as AISettings[];
  const current = rows[0] || {
    id: 'default',
    enabled: true,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    api_key: '',
    system_prompt:
      'You are an expert Indian Chartered Accountant and Tax Planner. Analyze the user financial numbers, income sources, deductions, capital gains, and dual regime comparison. Provide actionable, structured, prioritized recommendations to legally minimize Indian income tax, optimize Section 80C/80CCD/80D, capital gains harvesting, and recommend the optimal regime.',
    updated_at: new Date().toISOString(),
  };
  const hasApiKey = Boolean(current.api_key && current.api_key.trim().length > 0);
  const maskedKey = hasApiKey
    ? `${current.api_key.slice(0, 4)}••••••••${current.api_key.slice(-4)}`
    : '';
  return {
    settings: {
      ...current,
      api_key: maskedKey,
      has_api_key: hasApiKey,
    },
  };
}
export async function updateAISettingsAction(
  body: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    api_key?: string;
    system_prompt?: string;
  },
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
  const provider =
    typeof body.provider === 'string' && body.provider.trim() ? body.provider.trim() : 'gemini';
  const model =
    typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'gemini-2.5-flash';
  const systemPrompt =
    typeof body.system_prompt === 'string' && body.system_prompt.trim()
      ? body.system_prompt.trim().slice(0, 2000)
      : 'You are an expert Indian Chartered Accountant and Tax Planner.';
  const newApiKey = typeof body.api_key === 'string' ? body.api_key.trim() : null;
  if (newApiKey !== null && newApiKey !== '' && !newApiKey.includes('••••')) {
    await sql`
      INSERT INTO ai_settings (id, enabled, provider, model, api_key, system_prompt, updated_at)
      VALUES ('default', ${enabled}, ${provider}, ${model}, ${newApiKey}, ${systemPrompt}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        provider = EXCLUDED.provider,
        model = EXCLUDED.model,
        api_key = EXCLUDED.api_key,
        system_prompt = EXCLUDED.system_prompt,
        updated_at = NOW()
    `;
  } else {
    await sql`
      INSERT INTO ai_settings (id, enabled, provider, model, system_prompt, updated_at)
      VALUES ('default', ${enabled}, ${provider}, ${model}, ${systemPrompt}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        provider = EXCLUDED.provider,
        model = EXCLUDED.model,
        system_prompt = EXCLUDED.system_prompt,
        updated_at = NOW()
    `;
  }
  return { success: true, message: 'AI settings updated successfully' };
}
