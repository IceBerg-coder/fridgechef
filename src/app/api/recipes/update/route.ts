import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/recipes/update
// Updates a recipe with new details (tags, notes, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to update recipes' },
        { status: 401 }
      );
    }
    
    const { recipeId, tags, notes } = await request.json();
    
    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }
    
    // Find the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { favorites: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });
    
    if (!existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Update tags if provided (store as JSON string)
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
    }
    
    // Update notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // Update the recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      recipe: updatedRecipe
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}