import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('Unauthorized access attempt to recipe API');
      return NextResponse.json({ error: 'Unauthorized - Please log in to view recipes' }, { status: 401 });
    }

    // Properly await the params object
    const { id } = await Promise.resolve(context.params);
    
    if (!id) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    console.log(`Fetching recipe with ID: ${id} for user: ${session.user.email}`);

    // Fetch the recipe by ID
    const recipe = await prisma.recipe.findUnique({
      where: {
        id: id
      }
    });

    if (!recipe) {
      console.log(`Recipe not found with ID: ${id}`);
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, recipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('Unauthorized access attempt to recipe API');
      return NextResponse.json({ error: 'Unauthorized - Please log in to update recipes' }, { status: 401 });
    }

    // Properly await the params object
    const { id } = await Promise.resolve(context.params);
    
    if (!id) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    // Get the updated recipe data from request body
    const { recipe: updatedRecipeData } = await request.json();

    if (!updatedRecipeData) {
      return NextResponse.json({ error: 'Recipe data is required' }, { status: 400 });
    }

    console.log(`Updating recipe with ID: ${id} for user: ${session.user.email}`, updatedRecipeData);

    // Find the recipe first to make sure it exists and belongs to this user
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: { createdBy: true }
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Optional: Check if the user can edit this recipe
    // For simplicity, we're allowing any authenticated user to edit any recipe
    // In a production app, you might want to restrict this to the recipe owner

    // Process arrays before saving
    const ingredients = Array.isArray(updatedRecipeData.ingredients)
      ? JSON.stringify(updatedRecipeData.ingredients)
      : updatedRecipeData.ingredients;
    
    const instructions = Array.isArray(updatedRecipeData.instructions)
      ? JSON.stringify(updatedRecipeData.instructions)
      : updatedRecipeData.instructions;

    // Update the recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: {
        name: updatedRecipeData.name || 'My Recipe',
        description: updatedRecipeData.description || '',
        ingredients,
        instructions,
        // Only update these if provided
        cookingTime: updatedRecipeData.cookingTime !== undefined ? updatedRecipeData.cookingTime : undefined,
        difficulty: updatedRecipeData.difficulty !== undefined ? updatedRecipeData.difficulty : undefined,
        servings: updatedRecipeData.servings !== undefined ? updatedRecipeData.servings : undefined,
      }
    });

    return NextResponse.json({ success: true, recipe: updatedRecipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}