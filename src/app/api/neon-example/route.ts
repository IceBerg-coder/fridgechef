import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

/**
 * Example API route demonstrating how to use Neon Database
 * GET /api/neon-example
 */
export async function GET(req: NextRequest) {
  try {
    const data = await getData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in Neon example API:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown database error' },
      { status: 500 }
    );
  }
}

/**
 * Example data fetching function using Neon Database
 */
export async function getData() {
  const sql = neon(process.env.DATABASE_URL);
  
  // You can create the posts table if it doesn't exist
  await sql`CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`;
  
  // Insert a sample post if none exist
  const existingPosts = await sql`SELECT COUNT(*) FROM posts`;
  if (parseInt(existingPosts[0].count) === 0) {
    await sql`INSERT INTO posts (title, content) VALUES 
      ('First Post', 'This is a sample post created by the Neon Database example'),
      ('Recipe Ideas', 'Some recipe ideas for FridgeChef application')`;
  }
  
  // Fetch all posts from the table
  const data = await sql`SELECT * FROM posts;`;
  return data;
}