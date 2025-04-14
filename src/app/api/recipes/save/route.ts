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
    
    const requestData = await request.json();
    const { 
      recipeId, 
      recipeName, 
      recipeContent,
      name,
      ingredients: rawIngredients, 
      instructions: rawInstructions, 
      cookingTime, 
      difficulty, 
      description,
      cuisineType,
      dietaryPreferences,
      tags: rawTags,
      image,
      servings
    } = requestData;
    
    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }
    
    // Find the current user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { favorites: true }
    });
    
    // If user doesn't exist, create one for this session
    if (!user) {
      console.log('User not found in database, creating user record for:', session.user.email);
      try {
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || 'User',
            password: 'temporary-password', // In a real app, this would be properly hashed
          },
          include: {
            favorites: true
          }
        });
        console.log('User created successfully:', user.id);
      } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        );
      }
    }
    
    // Check if the recipe exists
    let recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });
    
    // If recipe doesn't exist, create it
    if (!recipe) {
      try {
        // Parse recipeContent if it's a JSON string, otherwise use default values
        let ingredients = JSON.stringify(["Add your ingredients here"]);
        let instructions = JSON.stringify(["Add your recipe instructions here"]);
        let recipeTags = JSON.stringify([]);
        let finalName = recipeName || name || 'Untitled Recipe';
        let finalDescription = description || '';
        let finalCookingTime = cookingTime || null;
        let finalDifficulty = difficulty || null;
        let finalServings = servings || null;
        let finalImageUrl = image || null;
        
        // Try to parse recipeContent if it exists
        if (recipeContent) {
          try {
            const recipeData = typeof recipeContent === 'string' 
              ? JSON.parse(recipeContent) 
              : recipeContent;
              
            // Check if we got an object with the data we need
            if (recipeData) {
              // If content has ingredients and instructions fields, use them
              ingredients = Array.isArray(recipeData.ingredients) 
                ? (recipeData.ingredients.length > 0 
                  ? JSON.stringify(recipeData.ingredients) 
                  : ingredients)
                : recipeData.ingredients || ingredients;
                
              instructions = Array.isArray(recipeData.instructions) 
                ? (recipeData.instructions.length > 0 
                  ? JSON.stringify(recipeData.instructions) 
                  : instructions)
                : recipeData.instructions || instructions;
              
              // Extract tags if available  
              if (recipeData.tags) {
                recipeTags = Array.isArray(recipeData.tags)
                  ? JSON.stringify(recipeData.tags)
                  : typeof recipeData.tags === 'string'
                    ? recipeData.tags
                    : recipeTags;
              }
                
              // Get the recipe name
              finalName = recipeData.recipeName || recipeData.name || finalName;
              
              // Get other fields
              finalDescription = recipeData.description || finalDescription;
              finalCookingTime = recipeData.cookingTime || finalCookingTime;
              finalDifficulty = recipeData.difficulty || finalDifficulty;
              finalServings = recipeData.servings || finalServings;
              finalImageUrl = recipeData.imageUrl || recipeData.image || finalImageUrl;
            }
          } catch (e) {
            // If parsing fails, use recipeContent as-is for description
            console.error('Error parsing recipe content:', e);
            finalDescription = typeof recipeContent === 'string' 
              ? recipeContent.substring(0, 250) 
              : finalDescription;
          }
        }
        
        // Use raw ingredients and instructions if provided
        if (rawIngredients) {
          ingredients = Array.isArray(rawIngredients) 
            ? JSON.stringify(rawIngredients) 
            : typeof rawIngredients === 'string' ? rawIngredients : ingredients;
        }
        
        if (rawInstructions) {
          instructions = Array.isArray(rawInstructions) 
            ? JSON.stringify(rawInstructions) 
            : typeof rawInstructions === 'string' ? rawInstructions : instructions;
        }
        
        if (rawTags) {
          recipeTags = Array.isArray(rawTags)
            ? JSON.stringify(rawTags)
            : typeof rawTags === 'string' ? rawTags : recipeTags;
        }
        
        // Create the recipe with all available data
        // Only use fields that exist in the Prisma schema
        recipe = await prisma.recipe.create({
          data: {
            id: recipeId,
            name: finalName,
            description: finalDescription,
            ingredients: ingredients,
            instructions: instructions,
            cookingTime: finalCookingTime,
            difficulty: finalDifficulty,
            servings: finalServings ? parseInt(finalServings.toString()) : null,
            imageUrl: finalImageUrl,
            tags: recipeTags,
            createdBy: {
              connect: { id: user.id }
            }
          }
        });
      } catch (error) {
        console.error('Error creating recipe:', error);
        return NextResponse.json(
          { error: 'Failed to create recipe: ' + error.message },
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
      { error: 'Failed to process the request: ' + error.message },
      { status: 500 }
    );
  } finally {
    // Make sure to properly disconnect from Prisma
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error('Error disconnecting from Prisma:', e);
    }
  }
}