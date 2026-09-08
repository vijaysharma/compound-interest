import {
  AISettings,
  ensureTables,
  getDb,
  isAuthorized,
  jsonResponse,
  unauthorized,
} from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  let sql;
  try {
    sql = getDb();
    await ensureTables(sql);
  } catch (err) {
    return jsonResponse({ error: 'Database unavailable', detail: String(err) }, 500);
  }
  if (request.method === 'GET') {
    if (!(await isAuthorized(request, sql))) {
      return unauthorized();
    }
    try {
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
      return jsonResponse({
        settings: {
          ...current,
          api_key: maskedKey,
          has_api_key: hasApiKey,
        },
      });
    } catch (error) {
      return jsonResponse({ error: 'Failed to fetch AI settings', detail: String(error) }, 500);
    }
  }
  if (request.method === 'POST') {
    if (!(await isAuthorized(request, sql))) {
      return unauthorized();
    }
    try {
      const body = (await request.json()) as {
        enabled?: boolean;
        provider?: string;
        model?: string;
        api_key?: string;
        system_prompt?: string;
      };
      const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
      const provider = typeof body.provider === 'string' && body.provider.trim() ? body.provider.trim() : 'gemini';
      const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'gemini-2.5-flash';
      const systemPrompt =
        typeof body.system_prompt === 'string' && body.system_prompt.trim()
          ? body.system_prompt.trim().slice(0, 2000)
          : 'You are an expert Indian Chartered Accountant and Tax Planner.';
      // Check if updating API key
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
      return jsonResponse({ success: true, message: 'AI settings updated successfully' });
    } catch (error) {
      return jsonResponse({ error: 'Failed to update AI settings', detail: String(error) }, 500);
    }
  }
  return jsonResponse({ error: 'Method not allowed' }, 405);
}
