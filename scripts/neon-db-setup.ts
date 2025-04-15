/**
 * Neon Database setup and migration script
 * 
 * Usage:
 *   npm run setup-neon-db
 * 
 * This script will:
 * 1. Test connection to the Neon Database
 * 2. Create tables based on your Prisma schema
 * 3. Migrate any existing data if needed
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../.env') });

/**
 * Check if Neon Database is configured
 */
function isUsingNeonDatabase(): boolean {
  return Boolean(process.env.NEON_DATABASE_URL);
}

/**
 * Returns the appropriate database URL
 */
function getDatabaseUrl(): string {
  // Use Neon Database if configured
  if (process.env.NEON_DATABASE_URL) {
    return process.env.NEON_DATABASE_URL;
  }
  
  // Fall back to Postgres or SQLite
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    return process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
  }
  
  throw new Error('No database URL configured. Please set NEON_DATABASE_URL in your .env file.');
}

async function main() {
  // Ensure Neon Database URL is configured
  if (!isUsingNeonDatabase()) {
    console.error('❌ Neon Database URL not configured. Please set NEON_DATABASE_URL in your .env file.');
    process.exit(1);
  }

  // Get database URL and create connection
  const dbUrl = process.env.NEON_DATABASE_URL || getDatabaseUrl();
  const sql = neon(dbUrl);

  console.log('🔌 Connecting to Neon Database...');
  
  try {
    // Test connection
    const testResult = await sql`SELECT version()`;
    console.log(`✅ Connected to PostgreSQL ${testResult[0].version}`);

    // Create tables based on Prisma schema
    console.log('📦 Creating tables based on Prisma schema...');
    
    // User table
    await sql`
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      image TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dietaryPreferences" TEXT,
      "allergies" TEXT
    )`;
    console.log('✅ User table created or already exists');

    // Recipe table
    await sql`
    CREATE TABLE IF NOT EXISTS "Recipe" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      ingredients TEXT NOT NULL,
      instructions TEXT NOT NULL,
      "cookingTime" TEXT,
      difficulty TEXT,
      servings INTEGER,
      "imageUrl" TEXT,
      tags TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
    )`;
    console.log('✅ Recipe table created or already exists');

    // Collection table
    await sql`
    CREATE TABLE IF NOT EXISTS "Collection" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
    )`;
    console.log('✅ Collection table created or already exists');

    // Create junction tables for many-to-many relationships
    await sql`
    CREATE TABLE IF NOT EXISTS "_UserFavorites" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      FOREIGN KEY ("A") REFERENCES "User"(id) ON DELETE CASCADE,
      FOREIGN KEY ("B") REFERENCES "Recipe"(id) ON DELETE CASCADE,
      UNIQUE("A", "B")
    )`;
    console.log('✅ _UserFavorites junction table created or already exists');

    await sql`
    CREATE TABLE IF NOT EXISTS "_CollectionRecipes" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      FOREIGN KEY ("A") REFERENCES "Collection"(id) ON DELETE CASCADE,
      FOREIGN KEY ("B") REFERENCES "Recipe"(id) ON DELETE CASCADE,
      UNIQUE("A", "B")
    )`;
    console.log('✅ _CollectionRecipes junction table created or already exists');
    
    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS "Recipe_userId_idx" ON "Recipe"("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS "Collection_userId_idx" ON "Collection"("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS "UserFavorites_A_idx" ON "_UserFavorites"("A")`;
    await sql`CREATE INDEX IF NOT EXISTS "UserFavorites_B_idx" ON "_UserFavorites"("B")`;
    await sql`CREATE INDEX IF NOT EXISTS "CollectionRecipes_A_idx" ON "_CollectionRecipes"("A")`;
    await sql`CREATE INDEX IF NOT EXISTS "CollectionRecipes_B_idx" ON "_CollectionRecipes"("B")`;
    console.log('✅ Created performance indexes');
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up Neon Database:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});