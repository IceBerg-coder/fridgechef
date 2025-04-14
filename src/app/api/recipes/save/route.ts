import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/recipes/save
// Toggles a recipe as favorite for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to save recipes' },
        { status: 401 }
      );
    }
    
    const { recipeId, recipeName, recipeContent } = await request.json();
    
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
    let recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });
    
    // If recipe doesn't exist, create it
    if (!recipe) {
      try {
        // Parse recipeContent if it's a JSON string, otherwise use default values
        let ingredients = "[]";
        let instructions = "[]";
        let name = recipeName || 'Untitled Recipe';
        
        // Try to parse recipeContent if it exists
        if (recipeContent) {
          try {
            const recipeData = JSON.parse(recipeContent);
            // Check if we got an object with the data we need
            if (recipeData) {
              // If content has ingredients and instructions fields, use them
              ingredients = Array.isArray(recipeData.ingredients) 
                ? JSON.stringify(recipeData.ingredients) 
                : recipeData.ingredients || ingredients;
                
              instructions = Array.isArray(recipeData.instructions) 
                ? JSON.stringify(recipeData.instructions) 
                : recipeData.instructions || instructions;
                
              // If we have a name field, use it, otherwise use recipeName
              name = recipeData.name || recipeData.recipeName || name;
            }
          } catch (e) {
            // If parsing fails, use recipeContent as-is for description
            console.error('Error parsing recipe content:', e);
          }
        }
        
        recipe = await prisma.recipe.create({
          data: {
            id: recipeId,
            name: name,
            description: recipeContent ? (typeof recipeContent === 'string' ? recipeContent.substring(0, 250) : '') : '',
            ingredients: ingredients,
            instructions: instructions,
            userId: user.id
          }
        });
      } catch (error) {
        console.error('Error creating recipe:', error);
        return NextResponse.json(
          { error: 'Failed to create recipe' },
          { status: 500 }
        );
      }
    }
    
    // Check if the recipe is already a favorite
    const isFavorite = user.favorites.some(fav => fav.id === recipeId);
    
    if (isFavorite) {
      // Remove from favorites
      await prisma.user.update({
        where: { id: user.id },
        data: {
          favorites: {
            disconnect: { id: recipeId }
          }
        }
      });
      
      return NextResponse.json({
        message: 'Recipe removed from favorites',
        isFavorite: false
      });
    } else {
      // Add to favorites
      await prisma.user.update({
        where: { id: user.id },
        data: {
          favorites: {
            connect: { id: recipeId }
          }
        }
      });
      
      return NextResponse.json({
        message: 'Recipe added to favorites',
        isFavorite: true
      });
    }
  } catch (error) {
    console.error('Error saving recipe:', error);
    return NextResponse.json(
      { error: 'Failed to process the request' },
      { status: 500 }
    );
  }
}