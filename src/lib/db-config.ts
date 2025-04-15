/**
 * Database configuration helper for handling local SQLite, Vercel Postgres, and Neon Database
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
 * Returns true if we're using Neon Database
 */
export const isUsingNeonDatabase = (): boolean => {
  return Boolean(process.env.NEON_DATABASE_URL);
};

/**
 * Returns the appropriate database URL based on the environment
 */
export const getDatabaseUrl = (): string => {
  // Prefer Vercel Postgres if available
  if (process.env.POSTGRES_PRISMA_URL) {
    return process.env.POSTGRES_PRISMA_URL;
  }
  
  // Use Neon Database if configured
  if (process.env.NEON_DATABASE_URL) {
    return process.env.NEON_DATABASE_URL;
  }
  
  // Fall back to SQLite for local development
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  throw new Error('No database URL configured. Please set DATABASE_URL, POSTGRES_PRISMA_URL, or NEON_DATABASE_URL');
};

/**
 * Determines if the current database is PostgreSQL (either Vercel or Neon)
 */
export const isPostgresDatabase = (): boolean => {
  return isUsingVercelPostgres() || isUsingNeonDatabase();
};