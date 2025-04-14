import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/recipes/saved
// Retrieves all recipes saved by the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('No authenticated session found when fetching saved recipes');
      return NextResponse.json({
        recipes: [],
        message: 'You must be signed in to view saved recipes'
      }, { status: 200 }); // Return 200 with empty array instead of 401 error
    }
    
    console.log('Fetching saved recipes for user:', session.user.email);
    
    // Find the current user and include their favorite recipes
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        favorites: {
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    });
    
    // If user doesn't exist, create a temporary one for this session 
    if (!user) {
      console.log('User not found in database when fetching saved recipes, creating temporary user for:', session.user.email);
      try {
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || 'User',
            password: 'temporary-password-hash', // This would normally be hashed
          },
          include: {
            favorites: {
              orderBy: {
                updatedAt: 'desc'
              }
            }
          }
        });
        console.log('Temporary user created:', user.id);
      } catch (error) {
        console.error('Error creating temporary user:', error);
        // Just return empty recipes instead of error
        return NextResponse.json({
          recipes: []
        });
      }
    }
    
    return NextResponse.json({
      recipes: user.favorites
    });
  } catch (error) {
    console.error('Error fetching saved recipes:', error);
    return NextResponse.json({
      recipes: [],
      error: 'Failed to fetch saved recipes'
    }, { status: 200 }); // Return 200 with empty array instead of 500 error
  } finally {
    await prisma.$disconnect();
  }
}