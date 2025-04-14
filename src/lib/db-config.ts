/**
 * Database configuration helper for handling both local SQLite and Vercel Postgres
 */

/**
 * Returns true if we're using Vercel Postgres
 */
export const isUsingVercelPostgres = (): boolean => {
  return Boolean(
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL_NON_POOLING || 
    process.env.POSTGRES_URL
  );
};

/**
 * Returns the appropriate database URL based on the environment
 */
export const getDatabaseUrl = (): string => {
  // Prefer Vercel Postgres if available
  if (process.env.POSTGRES_PRISMA_URL) {
    return process.env.POSTGRES_PRISMA_URL;
  }
  
  // Fall back to SQLite for local development
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  throw new Error('No database URL configured. Please set DATABASE_URL or POSTGRES_PRISMA_URL');
};