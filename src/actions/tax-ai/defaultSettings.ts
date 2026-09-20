import { AISettings, ensureTables, getDb } from '@/lib/db';
export const DEFAULT_AI_SETTINGS: AISettings = {
  id: 'default',
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  api_key: '',
  system_prompt:
    'You are an expert Indian Chartered Accountant and Tax Planner. Analyze the user financial numbers, income sources, deductions, capital gains, and dual regime comparison. Provide actionable, structured, prioritized recommendations to legally minimize Indian income tax, optimize Section 80C/80CCD/80D, capital gains harvesting, and recommend the optimal regime.',
  updated_at: new Date().toISOString(),
};
export async function fetchAISettings(): Promise<AISettings> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT id, enabled, provider, model, api_key, system_prompt, updated_at
      FROM ai_settings
      WHERE id = 'default'
    `) as AISettings[];
    if (rows.length > 0) {
      return rows[0];
    }
  } catch (err) {
    console.warn('DB read failed in fetchAISettings, using defaults:', err);
  }
  return DEFAULT_AI_SETTINGS;
}
