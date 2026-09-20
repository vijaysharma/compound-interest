export function buildTaxPrompt(
  systemPrompt: string,
  financialSummary?: Record<string, unknown>,
  userQuestion?: string
): string {
  return `
${systemPrompt}

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
}
export async function callGeminiApi(
  model: string,
  apiKey: string,
  promptText: string
): Promise<{ text?: string; error?: string; message?: string }> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;
  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
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
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Unable to generate advice at this moment. Please try again.';
  return { text };
}
