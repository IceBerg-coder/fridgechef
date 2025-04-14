import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Define update schema validation
const updateSchema = z.object({
  name: z.string().min(2),
  image: z.string().optional(),
});

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
    const { name, image } = updateSchema.parse(body);
    
    // Update user in the database
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        image: image || null,
      },
    });
    
    // Return success response
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }
    });
    
  } catch (error: any) {
    console.error('Profile update error:', error);
    
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