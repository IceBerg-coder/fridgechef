import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isUsingNeonDatabase } from '@/lib/db-config';
import { getUserByEmail, queryNeon } from '@/lib/neon-db';

const prisma = new PrismaClient();

// GET /api/user/preferences
// Retrieves the user's dietary preferences and allergies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to access preferences' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const useNeonDb = isUsingNeonDatabase();
    
    // If using Neon Database
    if (useNeonDb) {
      try {
        // Get user from Neon DB
        const user = await getUserByEmail(userEmail);
        
        if (!user) {
          return NextResponse.json(
            { 
              dietaryPreferences: '',
              allergies: ''
            }
          );
        }
        
        // Get user preferences from Neon DB
        const preferences = await queryNeon`
          SELECT "dietaryPreferences", "allergies" 
          FROM "User" 
          WHERE id = ${user.id}
        `;
        
        // Return preferences (could be null/undefined if not set)
        const userPrefs = preferences && preferences.length > 0 ? preferences[0] : {};
        
        return NextResponse.json({
          dietaryPreferences: userPrefs.dietaryPreferences || '',
          allergies: userPrefs.allergies || ''
        });
      } catch (error) {
        console.error('Error fetching preferences from Neon DB:', error);
        return NextResponse.json(
          { error: 'Failed to fetch preferences' },
          { status: 500 }
        );
      }
    } else {
      // Use Prisma
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          dietaryPreferences: true,
          allergies: true,
        },
      });
      
      // If user doesn't exist or has no preferences, return empty values
      if (!user) {
        return NextResponse.json({
          dietaryPreferences: '',
          allergies: ''
        });
      }
      
      return NextResponse.json({
        dietaryPreferences: user.dietaryPreferences || '',
        allergies: user.allergies || ''
      });
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  } finally {
    if (!isUsingNeonDatabase()) {
      await prisma.$disconnect();
    }
  }
}

// PUT /api/user/preferences
// Updates the user's dietary preferences and allergies
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to update preferences' },
        { status: 401 }
      );
    }
    
    const userEmail = session.user.email;
    const requestData = await request.json();
    const { dietaryPreferences, allergies } = requestData;
    
    const useNeonDb = isUsingNeonDatabase();
    
    // If using Neon Database
    if (useNeonDb) {
      try {
        // Get user from Neon DB
        const user = await getUserByEmail(userEmail);
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Update user preferences in Neon DB
        await queryNeon`
          UPDATE "User"
          SET "dietaryPreferences" = ${dietaryPreferences || null},
              "allergies" = ${allergies || null},
              "updatedAt" = NOW()
          WHERE id = ${user.id}
        `;
        
        return NextResponse.json({
          message: 'Preferences updated successfully',
          dietaryPreferences,
          allergies
        });
      } catch (error) {
        console.error('Error updating preferences in Neon DB:', error);
        return NextResponse.json(
          { error: 'Failed to update preferences' },
          { status: 500 }
        );
      }
    } else {
      // Use Prisma
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      // If user doesn't exist, create one
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            name: session.user.name || 'User',
            password: 'temporary-password-hash' // This would normally be properly hashed
          }
        });
      }
      
      // Update user preferences
      await prisma.user.update({
        where: { id: user.id },
        data: {
          dietaryPreferences: dietaryPreferences || null,
          allergies: allergies || null
        }
      });
      
      return NextResponse.json({
        message: 'Preferences updated successfully',
        dietaryPreferences,
        allergies
      });
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  } finally {
    if (!isUsingNeonDatabase()) {
      await prisma.$disconnect();
    }
  }
}