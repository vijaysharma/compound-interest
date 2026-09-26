import { neon } from '@neondatabase/serverless';
import type { Query } from './db/types';
export * from './db/types';
export * from './db/cryptoUtils';
export * from './db/userUtils';
export * from './db/migrations';
export function getDb(): Query {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(databaseUrl);
}
