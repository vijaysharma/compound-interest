import { getDb } from '@/lib/db';
import { readWatermark } from '@/actions/data/navWatermark';
export async function GET(): Promise<Response> {
  const sql = getDb();
  const watermark = await readWatermark();
  let directoryCount = 0;
  let navCount = 0;
  try {
    const s = (await sql`SELECT count(*) FROM mutual_fund_schemes`) as Array<{ count: string | number }>;
    const n = (await sql`SELECT count(*) FROM mutual_fund_nav`) as Array<{ count: string | number }>;
    directoryCount = Number(s[0]?.count ?? 0);
    navCount = Number(n[0]?.count ?? 0);
  } catch {
    // DB query fallback
  }
  return Response.json({
    service: 'Indian Mutual Fund NAV API',
    provider: 'Rupee Calculator',
    source: 'Official AMFI (Association of Mutual Funds in India)',
    market_watermark_date: watermark?.date ?? null,
    total_schemes_directory: directoryCount,
    total_schemes_with_nav: navCount,
    documentation: {
      single_scheme: '/api/nav/:schemeCode',
      filtered_range: '/api/nav/:schemeCode?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD',
      example: '/api/nav/122639',
    },
  });
}
