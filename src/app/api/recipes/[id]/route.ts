import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('Unauthorized access attempt to recipe API');
      return NextResponse.json({ error: 'Unauthorized - Please log in to view recipes' }, { status: 401 });
    }

    const { id } = params;
    
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