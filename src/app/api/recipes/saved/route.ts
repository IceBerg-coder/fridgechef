import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isUsingNeonDatabase } from '@/lib/db-config';
import { getUserByEmail, queryNeon } from '@/lib/neon-db';

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

    // Check which database to use
    const useNeonDb = isUsingNeonDatabase();
    
    if (useNeonDb) {
      try {
        // Find user in Neon Database
        const user = await getUserByEmail(session.user.email);
        
        if (!user) {
          console.log('User not found in Neon Database');
          return NextResponse.json({
            recipes: []
          });
        }
        
        // Get user's saved recipes from Neon DB using the join table
        const recipes = await queryNeon`
          SELECT r.* 
          FROM "Recipe" r
          JOIN "_UserFavorites" uf ON uf."B" = r.id
          WHERE uf."A" = ${user.id}
          ORDER BY r."updatedAt" DESC
        `;
        
        return NextResponse.json({
          recipes: recipes || []
        });
      } catch (error) {
        console.error('Error fetching saved recipes from Neon DB:', error);
        return NextResponse.json({
          recipes: [],
          error: 'Failed to fetch saved recipes from Neon Database'
        }, { status: 200 }); // Return 200 with empty array instead of 500 error
      }
    } else {
      // Original Prisma code
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
    }
  } catch (error) {
    console.error('Error fetching saved recipes:', error);
    return NextResponse.json({
      recipes: [],
      error: 'Failed to fetch saved recipes'
    }, { status: 200 }); // Return 200 with empty array instead of 500 error
  } finally {
    // Only disconnect Prisma if we're using it
    if (!isUsingNeonDatabase()) {
      try {
        await prisma.$disconnect();
      } catch (e) {
        console.error('Error disconnecting from Prisma:', e);
      }
    }
  }
}