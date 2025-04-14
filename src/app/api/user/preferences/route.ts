import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Define preferences schema validation
const preferencesSchema = z.object({
  dietaryPreferences: z.string().optional(),
  allergies: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Fetch user preferences from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dietaryPreferences: true,
        allergies: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user preferences
    return NextResponse.json({
      dietaryPreferences: user.dietaryPreferences || '',
      allergies: user.allergies || '',
    });
    
  } catch (error: any) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Parse request body
    const body = await req.json();
    const { dietaryPreferences, allergies } = preferencesSchema.parse(body);
    
    // Update user preferences in the database
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        dietaryPreferences: dietaryPreferences || null,
        allergies: allergies || null,
      },
    });
    
    // Return success response
    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: {
        dietaryPreferences: user.dietaryPreferences,
        allergies: user.allergies,
      }
    });
    
  } catch (error: any) {
    console.error('Update preferences error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}