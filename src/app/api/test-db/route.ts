import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/test-db
// A simple endpoint to test database connectivity
export async function GET(request: NextRequest) {
  try {
    // Test database connectivity by fetching user count
    const userCount = await prisma.user.count();
    
    // Test recipe count
    const recipeCount = await prisma.recipe.count();
    
    // Test collection count
    const collectionCount = await prisma.collection.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counts: {
        users: userCount,
        recipes: recipeCount,
        collections: collectionCount
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to database',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}