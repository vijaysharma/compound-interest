'use server';
import { AISettings, ensureTables, getDb, getUserFromToken } from '@/lib/db';
export async function getTaxAIStatusAction(): Promise<{
  enabled: boolean;
  provider: string;
  model: string;
  hasApiKey: boolean;
}> {
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
    console.warn('DB read failed in getTaxAIStatusAction, using defaults:', err);
  }
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
    const rows = (await sql`
      SELECT id, enabled, provider, model, api_key, system_prompt, updated_at
      FROM ai_settings
      WHERE id = 'default'
    `) as AISettings[];
    if (rows.length > 0) {
      aiSettings = rows[0];
    }
  } catch (err) {
    console.warn('DB read failed in generateTaxAIAdviceAction, using defaults:', err);
  }
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

Keep it structured with bullet points, bold key figures in ₹, and maintain a friendly, authoritative tone. Do not mention artificial intelligence, AI models, or automated bots. Speak as a seasoned Indian Chartered Accountant and tax strategist.
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
    console.error('Tax Strategy API error:', geminiResponse.status, errBody);
    return {
      enabled: true,
      error: 'API_ERROR',
      message: `Tax Strategy Engine returned an error: ${geminiResponse.statusText}`,
    };
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
  return {
    enabled: true,
    model,
    advice: generatedText,
  };
}
