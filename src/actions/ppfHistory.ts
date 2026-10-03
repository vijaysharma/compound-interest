'use server';

import { ensureTables, getDb } from '@/lib/db';
import type { Query } from '@/lib/db/types';
import { handleGetMe } from './auth/sessionAndUsage';
import type { PpfInvestmentRecord } from '@/utilities/ppfTypes';

export interface PpfPreferencesData {
  frequency: 'monthly' | 'yearly';
  depositAmount: number;
  depositTiming: 'before_5th' | 'after_5th';
  startYear: number;
  extensionBlocks: number;
  extensionMode: 'with_contribution' | 'without_contribution';
  projectedRate: number;
  futureContributionMode?: 'continue' | 'stop';
}

interface ResolvedOwner {
  userId: string | null;
  guestId: string | null;
}

async function resolveOwner(
  token: string | null | undefined,
  guestId: string | null | undefined
): Promise<ResolvedOwner> {
  if (token) {
    try {
      const me = await handleGetMe(token);
      if (me?.user?.id) {
        return { userId: me.user.id, guestId: null };
      }
    } catch {
      // Fallback to guest if token is invalid
    }
  }

  const cleanGuest = (guestId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return { userId: null, guestId: cleanGuest || null };
}

function validateDate(dateStr: unknown): string {
  if (typeof dateStr !== 'string') throw new Error('Invalid date');
  const clean = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
  if (!match) throw new Error('Date must be in YYYY-MM-DD format');
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 1968 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('Invalid date values');
  }
  return clean;
}

function validateAmount(amount: unknown): number {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error('Investment amount must be a positive number');
  }
  if (num > 10000000) {
    throw new Error('Investment amount exceeds realistic limits');
  }
  return Math.round(num * 100) / 100;
}

function validateNotes(notes: unknown): string {
  if (!notes || typeof notes !== 'string') return '';
  return notes.trim().slice(0, 255);
}

export async function getPpfDataAction(
  token?: string | null,
  guestId?: string | null
): Promise<{
  success: boolean;
  investments: PpfInvestmentRecord[];
  preferences: PpfPreferencesData | null;
}> {
  const sql = getDb();
  await ensureTables(sql);
  const owner = await resolveOwner(token, guestId);

  if (!owner.userId && !owner.guestId) {
    return { success: true, investments: [], preferences: null };
  }

  let investmentRows: Array<{
    id: string;
    investment_date: string | Date;
    amount: number | string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }> = [];

  let prefRows: Array<{
    frequency: string;
    deposit_amount: number | string;
    deposit_timing: string;
    start_year: number;
    extension_blocks: number;
    extension_mode: string;
    projected_rate: number | string;
  }> = [];

  if (owner.userId) {
    investmentRows = (await sql`
      SELECT id, investment_date, amount, notes, created_at, updated_at
      FROM ppf_investments
      WHERE user_id = ${owner.userId}
      ORDER BY investment_date ASC, created_at ASC
    `) as typeof investmentRows;

    prefRows = (await sql`
      SELECT frequency, deposit_amount, deposit_timing, start_year, extension_blocks, extension_mode, projected_rate
      FROM ppf_preferences
      WHERE user_id = ${owner.userId}
      LIMIT 1
    `) as typeof prefRows;
  } else if (owner.guestId) {
    investmentRows = (await sql`
      SELECT id, investment_date, amount, notes, created_at, updated_at
      FROM ppf_investments
      WHERE guest_id = ${owner.guestId}
      ORDER BY investment_date ASC, created_at ASC
    `) as typeof investmentRows;

    prefRows = (await sql`
      SELECT frequency, deposit_amount, deposit_timing, start_year, extension_blocks, extension_mode, projected_rate
      FROM ppf_preferences
      WHERE guest_id = ${owner.guestId}
      LIMIT 1
    `) as typeof prefRows;
  }

  const investments: PpfInvestmentRecord[] = investmentRows.map((r) => {
    let dateStr = '';
    if (r.investment_date instanceof Date) {
      dateStr = r.investment_date.toISOString().slice(0, 10);
    } else {
      dateStr = String(r.investment_date).slice(0, 10);
    }
    return {
      id: r.id,
      investmentDate: dateStr,
      amount: Number(r.amount),
      notes: r.notes || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  let preferences: PpfPreferencesData | null = null;
  if (prefRows.length > 0) {
    const p = prefRows[0];
    preferences = {
      frequency: p.frequency === 'monthly' ? 'monthly' : 'yearly',
      depositAmount: Number(p.deposit_amount) || 150000,
      depositTiming: p.deposit_timing === 'after_5th' ? 'after_5th' : 'before_5th',
      startYear: Number(p.start_year) || 2025,
      extensionBlocks: Number(p.extension_blocks) || 0,
      extensionMode: p.extension_mode === 'without_contribution' ? 'without_contribution' : 'with_contribution',
      projectedRate: Number(p.projected_rate) || 7.1,
    };
  }

  return {
    success: true,
    investments,
    preferences,
  };
}

export async function savePpfInvestmentAction(
  entry: {
    id?: string;
    investmentDate: string;
    amount: number;
    notes?: string;
  },
  token?: string | null,
  guestId?: string | null
): Promise<{ success: boolean; id: string; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  const owner = await resolveOwner(token, guestId);

  if (!owner.userId && !owner.guestId) {
    throw new Error('Session or guest identification is required to save investment');
  }

  const date = validateDate(entry.investmentDate);
  const amount = validateAmount(entry.amount);
  const notes = validateNotes(entry.notes);
  const id = entry.id?.trim() || `ppf_inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (entry.id) {
    // Update existing record
    if (owner.userId) {
      await sql`
        UPDATE ppf_investments
        SET investment_date = ${date}, amount = ${amount}, notes = ${notes}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${owner.userId}
      `;
    } else {
      await sql`
        UPDATE ppf_investments
        SET investment_date = ${date}, amount = ${amount}, notes = ${notes}, updated_at = NOW()
        WHERE id = ${id} AND guest_id = ${owner.guestId}
      `;
    }
  } else {
    // Insert new record
    await sql`
      INSERT INTO ppf_investments (id, user_id, guest_id, investment_date, amount, notes, created_at, updated_at)
      VALUES (${id}, ${owner.userId}, ${owner.guestId}, ${date}, ${amount}, ${notes}, NOW(), NOW())
    `;
  }

  return {
    success: true,
    id,
    message: 'Investment record saved successfully',
  };
}

export async function batchImportPpfInvestmentsAction(
  entries: Array<{
    investmentDate: string;
    amount: number;
    notes?: string;
  }>,
  token?: string | null,
  guestId?: string | null
): Promise<{ success: boolean; count: number; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  const owner = await resolveOwner(token, guestId);

  if (!owner.userId && !owner.guestId) {
    throw new Error('Session or guest identification is required to import investments');
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return { success: true, count: 0, message: 'No entries to import' };
  }

  let importedCount = 0;
  for (const item of entries) {
    try {
      const date = validateDate(item.investmentDate);
      const amount = validateAmount(item.amount);
      const notes = validateNotes(item.notes);
      const id = `ppf_inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await sql`
        INSERT INTO ppf_investments (id, user_id, guest_id, investment_date, amount, notes, created_at, updated_at)
        VALUES (${id}, ${owner.userId}, ${owner.guestId}, ${date}, ${amount}, ${notes}, NOW(), NOW())
      `;
      importedCount++;
    } catch {
      // Skip invalid entries during batch import
    }
  }

  return {
    success: true,
    count: importedCount,
    message: `Successfully imported ${importedCount} investment records`,
  };
}

export async function deletePpfInvestmentAction(
  id: string,
  token?: string | null,
  guestId?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  const owner = await resolveOwner(token, guestId);

  if (!owner.userId && !owner.guestId) {
    throw new Error('Unauthorized');
  }

  const cleanId = id.trim();
  if (owner.userId) {
    await sql`DELETE FROM ppf_investments WHERE id = ${cleanId} AND user_id = ${owner.userId}`;
  } else {
    await sql`DELETE FROM ppf_investments WHERE id = ${cleanId} AND guest_id = ${owner.guestId}`;
  }

  return {
    success: true,
    message: 'Investment record removed',
  };
}

export async function clearPpfInvestmentsAction(
  token?: string | null,
  guestId?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  const owner = await resolveOwner(token, guestId);

  if (!owner.userId && !owner.guestId) {
    throw new Error('Unauthorized');
  }

  if (owner.userId) {
    await sql`DELETE FROM ppf_investments WHERE user_id = ${owner.userId}`;
  } else {
    await sql`DELETE FROM ppf_investments WHERE guest_id = ${owner.guestId}`;
  }

  return {
    success: true,
    message: 'All PPF investment records cleared',
  };
}

export async function savePpfPreferencesAction(
  prefs: PpfPreferencesData,
  token?: string | null,
  guestId?: string | null
): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  const owner = await resolveOwner(token, guestId);

  if (!owner.userId && !owner.guestId) {
    throw new Error('Unauthorized');
  }

  const id = owner.userId ? `pref_user_${owner.userId}` : `pref_guest_${owner.guestId}`;
  const freq = prefs.frequency === 'monthly' ? 'monthly' : 'yearly';
  const amount = Number(prefs.depositAmount) || 150000;
  const timing = prefs.depositTiming === 'after_5th' ? 'after_5th' : 'before_5th';
  const startYr = Number(prefs.startYear) || 2025;
  const blocks = Number(prefs.extensionBlocks) || 0;
  const extMode = prefs.extensionMode === 'without_contribution' ? 'without_contribution' : 'with_contribution';
  const rate = Number(prefs.projectedRate) || 7.1;

  if (owner.userId) {
    await sql`
      INSERT INTO ppf_preferences (id, user_id, guest_id, frequency, deposit_amount, deposit_timing, start_year, extension_blocks, extension_mode, projected_rate, updated_at)
      VALUES (${id}, ${owner.userId}, NULL, ${freq}, ${amount}, ${timing}, ${startYr}, ${blocks}, ${extMode}, ${rate}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        frequency = EXCLUDED.frequency,
        deposit_amount = EXCLUDED.deposit_amount,
        deposit_timing = EXCLUDED.deposit_timing,
        start_year = EXCLUDED.start_year,
        extension_blocks = EXCLUDED.extension_blocks,
        extension_mode = EXCLUDED.extension_mode,
        projected_rate = EXCLUDED.projected_rate,
        updated_at = NOW()
    `;
  } else {
    await sql`
      INSERT INTO ppf_preferences (id, user_id, guest_id, frequency, deposit_amount, deposit_timing, start_year, extension_blocks, extension_mode, projected_rate, updated_at)
      VALUES (${id}, NULL, ${owner.guestId}, ${freq}, ${amount}, ${timing}, ${startYr}, ${blocks}, ${extMode}, ${rate}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        frequency = EXCLUDED.frequency,
        deposit_amount = EXCLUDED.deposit_amount,
        deposit_timing = EXCLUDED.deposit_timing,
        start_year = EXCLUDED.start_year,
        extension_blocks = EXCLUDED.extension_blocks,
        extension_mode = EXCLUDED.extension_mode,
        projected_rate = EXCLUDED.projected_rate,
        updated_at = NOW()
    `;
  }

  return {
    success: true,
    message: 'PPF preferences saved',
  };
}
