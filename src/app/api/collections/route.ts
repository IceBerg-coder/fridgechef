import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/collections
// Retrieves all collections for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to view collections' },
        { status: 401 }
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
    
    // Get all collections for this user
    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      include: {
        recipes: true // Include the recipes in each collection
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return NextResponse.json({
      collections: collections.map(collection => ({
        ...collection,
        recipeCount: collection.recipes.length
      }))
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
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

// POST /api/collections
// Creates a new collection for the current user
export async function POST(request: NextRequest) {
  let client;
  try {
    // Create a new Prisma client for this request to avoid connection issues
    client = new PrismaClient();
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to create collections' },
        { status: 401 }
      );
    }
    
    const { name, description } = await request.json();
    console.log('Collection creation request received:', { name, description });
    
    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }
    
    // Find the current user
    const user = await client.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('User found, creating collection for user:', user.id);
    
    // Create the new collection with minimal data
    const newCollection = await client.collection.create({
      data: {
        name: name,
        userId: user.id,
        description: description || '',
      }
    });
    
    console.log('Collection created successfully:', newCollection);
    
    return NextResponse.json({
      success: true,
      collection: newCollection
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    // Make sure to properly disconnect from Prisma
    if (client) {
      try {
        await client.$disconnect();
      } catch (e) {
        console.error('Error disconnecting from Prisma:', e);
      }
    }
  }
}