import { NextRequest, NextResponse } from 'next/server';
import { testNeonConnection, fetchNeonData } from '@/lib/neon-db';
import { isUsingNeonDatabase } from '@/lib/db-config';

/**
 * API route to test the Neon Database connection
 * GET /api/test-neon
 */
export async function GET(req: NextRequest) {
  try {
    // Check if Neon Database is configured
    const isNeonConfigured = isUsingNeonDatabase();
    
    if (!isNeonConfigured) {
      return NextResponse.json({
        success: false,
        message: 'Neon Database not configured. Please set NEON_DATABASE_URL in your environment variables.',
        status: 'not_configured'
      }, { status: 200 });
    }
    
    // Test the connection
    const connectionSuccessful = await testNeonConnection();
    
    if (!connectionSuccessful) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Neon Database. Please check your connection string.',
        status: 'connection_failed'
      }, { status: 500 });
    }
    
    // Run a simple query to verify functionality
    const result = await fetchNeonData('SELECT version();');
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Neon Database!',
      version: result[0].version,
      status: 'connected'
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error testing Neon connection:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 'error'
    }, { status: 500 });
  }
}