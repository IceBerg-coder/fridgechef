// This script handles deployment setup for Vercel Postgres
const { execSync } = require('child_process');

// Function to execute shell commands
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

// Check if we're in a Vercel production environment
if (process.env.VERCEL_ENV === 'production') {
  console.log('Running in Vercel production environment');
  
  // Create a temporary PostgreSQL schema file
  const pgSchema = `
  // This is your Prisma schema file for Vercel Postgres
  generator client {
    provider = "prisma-client-js"
  }
  
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  
  // User model for authentication and personalization
  model User {
    id            String    @id @default(cuid())
    name          String?
    email         String    @unique
    password      String
    image         String?
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt
    
    // User preferences
    dietaryPreferences String?
    allergies          String?
    favorites          Recipe[]  @relation("UserFavorites")
    createdRecipes     Recipe[]  @relation("UserRecipes")
    collections        Collection[]
  }
  
  // Recipe model for saving generated/improved recipes
  model Recipe {
    id               String   @id @default(cuid())
    name             String
    description      String?
    ingredients      String   // JSON string of ingredients
    instructions     String   // JSON string of instructions
    cookingTime      String?
    difficulty       String?
    servings         Int?
    imageUrl         String?
    tags             String?  // JSON string of tags
    createdAt        DateTime @default(now())
    updatedAt        DateTime @updatedAt
    
    // Relations
    createdBy        User     @relation("UserRecipes", fields: [userId], references: [id], onDelete: Cascade)
    userId           String
    favoriteByUsers  User[]   @relation("UserFavorites")
    collections      Collection[] @relation("CollectionRecipes")
  }
  
  // Collection model for organizing recipes
  model Collection {
    id          String   @id @default(cuid())
    name        String
    description String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    // Relations
    user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    userId      String
    recipes     Recipe[] @relation("CollectionRecipes")
  }
  `;
  
  // Write the temporary schema file
  const fs = require('fs');
  fs.writeFileSync('./prisma/schema.prisma', pgSchema);
  
  // Run Prisma deploy
  runCommand('npx prisma generate');
  runCommand('npx prisma migrate deploy');
  
  console.log('Vercel Postgres setup completed');
} else {
  console.log('Not in Vercel production environment, skipping PostgreSQL setup');
}