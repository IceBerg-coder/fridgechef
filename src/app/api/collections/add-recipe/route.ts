import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/collections/add-recipe
// Adds a recipe to a collection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to update collections' },
        { status: 401 }
      );
    }
    
    const { collectionId, recipeId } = await request.json();
    
    if (!collectionId || !recipeId) {
      return NextResponse.json(
        { error: 'Collection ID and Recipe ID are required' },
        { status: 400 }
      );
    }
    
    // Find the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the collection exists and belongs to the user
    const collection = await prisma.collection.findFirst({
      where: { 
        id: collectionId,
        userId: user.id
      }
    });
    
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found or does not belong to you' },
        { status: 404 }
      );
    }
    
    // Check if the recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });
    
    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Check if the recipe is already in this collection
    const recipeInCollection = await prisma.collection.findFirst({
      where: { 
        id: collectionId,
        recipes: {
          some: {
            id: recipeId
          }
        }
      }
    });
    
    if (recipeInCollection) {
      return NextResponse.json({
        success: true,
        message: 'Recipe is already in this collection',
        alreadyExists: true
      });
    }
    
    // Add the recipe to the collection
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        recipes: {
          connect: { id: recipeId }
        },
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Recipe added to collection'
    });
  } catch (error) {
    console.error('Error adding recipe to collection:', error);
    return NextResponse.json(
      { error: 'Failed to add recipe to collection' },
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

// DELETE /api/collections/add-recipe
// Removes a recipe from a collection
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to update collections' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get('collectionId');
    const recipeId = searchParams.get('recipeId');
    
    if (!collectionId || !recipeId) {
      return NextResponse.json(
        { error: 'Collection ID and Recipe ID are required' },
        { status: 400 }
      );
    }
    
    // Find the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the collection exists and belongs to the user
    const collection = await prisma.collection.findFirst({
      where: { 
        id: collectionId,
        userId: user.id
      }
    });
    
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found or does not belong to you' },
        { status: 404 }
      );
    }
    
    // Remove the recipe from the collection
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        recipes: {
          disconnect: { id: recipeId }
        },
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Recipe removed from collection'
    });
  } catch (error) {
    console.error('Error removing recipe from collection:', error);
    return NextResponse.json(
      { error: 'Failed to remove recipe from collection' },
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