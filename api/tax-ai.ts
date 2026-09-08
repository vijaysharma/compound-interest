import {
  AISettings,
  ensureTables,
  getDb,
  jsonResponse,
} from './_db';
declare const process: { env: Record<string, string | undefined> };
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  let aiSettings: AISettings = {
    id: 'default',
    enabled: true,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    api_key: '',
    system_prompt:
      'You are an expert Indian Chartered Accountant and Tax Planner. Analyze the user financial numbers, income sources, deductions, capital gains, and dual regime comparison. Provide actionable, structured, prioritized recommendations to legally minimize Indian income tax, optimize Section 80C/80CCD/80D, capital gains harvesting, and recommend the optimal regime.',
    updated_at: new Date().toISOString(),
  };
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT id, enabled, provider, model, api_key, system_prompt, updated_at
      FROM ai_settings
      WHERE id = 'default'
    `) as AISettings[];
    if (rows.length > 0) {
      aiSettings = rows[0];
    }
  } catch (err) {
    console.warn('DB read failed in tax-ai handler, using defaults:', err);
  }
  // GET: Public status check
  if (request.method === 'GET') {
    return jsonResponse({
      enabled: aiSettings.enabled,
      provider: aiSettings.provider,
      model: aiSettings.model,
      hasApiKey: Boolean(
        aiSettings.api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
      ),
    });
  }
  // POST: Generate AI tax optimization advice
  if (request.method === 'POST') {
    if (!aiSettings.enabled) {
      return jsonResponse({
        enabled: false,
        message: 'AI Tax Advisor is currently disabled by administrator in the Admin Panel.',
      });
    }
    const apiKey =
      aiSettings.api_key?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
      return jsonResponse({
        enabled: true,
        error: 'NO_API_KEY',
        message:
          'Gemini API key is not configured. Please add an API key in the Admin Panel or configure GEMINI_API_KEY in server environment variables.',
      });
    }
    try {
      const body = (await request.json()) as {
        financialSummary?: Record<string, unknown>;
        userQuestion?: string;
      };
      const { financialSummary, userQuestion } = body;
      const model = aiSettings.model || 'gemini-2.5-flash';
      const promptText = `
${aiSettings.system_prompt}

Here is the user's detailed financial & tax data (Income Tax India FY 2024-25 / FY 2025-26):
${JSON.stringify(financialSummary, null, 2)}

${userQuestion ? `The user has also asked this specific question:\n"${userQuestion}"\n` : ''}

Please provide a concise, high-impact, professional tax optimization advisory in clear markdown:
1. **Regime Recommendation & Breakeven Analysis**: Explain why New vs Old is better for their numbers and what exact deductions would tip the scale.
2. **Immediate Actionable Strategies**:
   - Section 80C & PPF utilization (highlighting that PPF interest is 100% tax-free under EEE).
   - Section 80CCD(1B) NPS Tier 1 exclusive ₹50,000 benefit.
   - Section 80CCD(2) Employer NPS contribution (works in BOTH regimes).
   - Section 80D Health Insurance deductions.
   - Capital gains harvesting for equity (the ₹1.25 Lakh tax-free LTCG limit under Budget 2024).
3. **Restructuring & Long-Term Wealth Advice**: Practical tips before March 31.

Keep it structured with bullet points, bold key figures in ₹, and maintain a friendly, authoritative tone.
      `.trim();
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        }),
      });
      if (!geminiResponse.ok) {
        const errBody = await geminiResponse.text();
        console.error('Gemini API error:', geminiResponse.status, errBody);
        return jsonResponse(
          {
            enabled: true,
            error: 'API_ERROR',
            message: `Gemini API returned an error: ${geminiResponse.statusText}`,
            detail: errBody,
          },
          502
        );
      }
      const data = (await geminiResponse.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };
      const generatedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Unable to generate advice at this moment. Please try again.';
      return jsonResponse({
        enabled: true,
        model,
        advice: generatedText,
      });
    } catch (error) {
      console.error('Tax AI handler error:', error);
      return jsonResponse(
        {
          enabled: true,
          error: 'INTERNAL_ERROR',
          message: 'An error occurred while generating AI tax advice.',
          detail: String(error),
        },
        500
      );
    }
  }
  return jsonResponse({ error: 'Method not allowed' }, 405);
}
