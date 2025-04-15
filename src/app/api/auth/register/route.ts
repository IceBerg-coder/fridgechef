import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { isUsingNeonDatabase } from '@/lib/db-config';
import { getUserByEmail, queryNeon } from '@/lib/neon-db';
import { randomUUID } from 'crypto';

// Define the validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);
    
    // Determine whether to use Neon Database or Prisma
    const useNeonDb = isUsingNeonDatabase();
    
    if (useNeonDb) {
      // Neon Database path
      
      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      
      if (existingUser) {
        return NextResponse.json(
          { message: 'User with this email already exists' },
          { status: 409 }
        );
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Create new user with Neon Database
      const userId = randomUUID();
      const now = new Date().toISOString();
      
      const newUser = await queryNeon`
        INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
        VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${now}, ${now})
        RETURNING id, name, email, "createdAt"
      `;
      
      // Return success response
      return NextResponse.json({
        message: 'User registered successfully',
        user: newUser[0],
      }, { status: 201 });
      
    } else {
      // Prisma path (original code)
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      
      if (existingUser) {
        return NextResponse.json(
          { message: 'User with this email already exists' },
          { status: 409 }
        );
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
      
      // Return success response
      return NextResponse.json({
        message: 'User registered successfully',
        user: newUser,
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}