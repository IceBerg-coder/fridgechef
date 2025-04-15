import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { getDatabaseUrl, isUsingNeonDatabase } from "./db-config";

// Global connection cache to avoid reconnecting on every request
let neonConnection: NeonQueryFunction | null = null;

/**
 * Gets a connection to the Neon database, creating one if needed
 */
function getNeonConnection(): NeonQueryFunction {
  // Return cached connection if available
  if (neonConnection) return neonConnection;
  
  // Get the database URL from config
  const url = process.env.NEON_DATABASE_URL || getDatabaseUrl();
  
  // Create and cache the connection
  neonConnection = neon(url);
  return neonConnection;
}

/**
 * Utility for connecting to and querying a Neon Database using tagged template literals
 * 
 * @example
 * // Fetch all recipes
 * const recipes = await queryNeon`SELECT * FROM "Recipe";`;
 */
export async function queryNeon<T>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
  try {
    // Get the Neon connection
    const sql = getNeonConnection();
    
    // Execute the query using tagged template literals
    const data = await sql(strings, ...values);
    
    return data as T[];
  } catch (error) {
    console.error("Error querying Neon database:", error);
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Utility for connecting to and querying a Neon Database with parameterized queries
 * 
 * @example
 * // Fetch recipe by id
 * const recipes = await fetchNeonData('SELECT * FROM "Recipe" WHERE id = $1;', ['recipe-id']);
 */
export async function fetchNeonData<T>(query: string, params?: any[]): Promise<T[]> {
  try {
    // Get the Neon connection
    const sql = getNeonConnection();
    
    // Execute the query with proper syntax based on whether params are provided
    let data;
    
    if (params && params.length > 0) {
      // Convert to template literal dynamically
      // This creates a tagged template literal dynamically with proper parameter substitution
      const templateParts = query.split(/\$\d+/g);
      const templateArray = Object.assign([templateParts[0]], templateParts.slice(1)) as any;
      templateArray.raw = Object.assign([templateParts[0]], templateParts.slice(1));
      
      data = await sql(templateArray, ...params);
    } else {
      // Simple query with no parameters
      data = await sql`${query}`;
    }
    
    return data as T[];
  } catch (error) {
    console.error("Error querying Neon database:", error);
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Type definitions for your database models
 */
export type Recipe = {
  id: string;
  name: string;
  description?: string;
  ingredients: string; // JSON string
  instructions: string; // JSON string
  cookingTime?: string;
  difficulty?: string;
  servings?: number;
  imageUrl?: string;
  tags?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export type User = {
  id: string;
  name?: string;
  email: string;
  password: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  dietaryPreferences?: string;
  allergies?: string;
};

export type Collection = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

/**
 * Recipe-related database operations
 */

/**
 * Fetch all recipes from the database
 */
export async function getRecipes(): Promise<Recipe[]> {
  return queryNeon<Recipe>`SELECT * FROM "Recipe" ORDER BY "createdAt" DESC`;
}

/**
 * Fetch a specific recipe by ID
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  const recipes = await queryNeon<Recipe>`SELECT * FROM "Recipe" WHERE id = ${id}`;
  return recipes.length > 0 ? recipes[0] : null;
}

/**
 * Fetch recipes by user ID
 */
export async function getRecipesByUserId(userId: string): Promise<Recipe[]> {
  return queryNeon<Recipe>`SELECT * FROM "Recipe" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`;
}

/**
 * Save a new recipe
 */
export async function saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
  const result = await queryNeon<Recipe>`
    INSERT INTO "Recipe" (
      id, name, description, ingredients, instructions, 
      "cookingTime", difficulty, servings, "imageUrl", tags, 
      "userId", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), ${recipe.name}, ${recipe.description || null}, 
      ${recipe.ingredients}, ${recipe.instructions}, 
      ${recipe.cookingTime || null}, ${recipe.difficulty || null}, 
      ${recipe.servings || null}, ${recipe.imageUrl || null}, 
      ${recipe.tags || null}, ${recipe.userId}, 
      NOW(), NOW()
    ) RETURNING *
  `;
  
  return result[0];
}

/**
 * User-related database operations
 */

/**
 * Fetch a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await queryNeon<User>`SELECT * FROM "User" WHERE email = ${email}`;
  return users.length > 0 ? users[0] : null;
}

/**
 * Fetch a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const users = await queryNeon<User>`SELECT * FROM "User" WHERE id = ${id}`;
  return users.length > 0 ? users[0] : null;
}

/**
 * Check if Neon Database is available and properly configured
 */
export async function testNeonConnection(): Promise<boolean> {
  try {
    if (!isUsingNeonDatabase()) {
      console.log('Neon Database not configured');
      return false;
    }
    
    const result = await queryNeon`SELECT 1 as test`;
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('Failed to connect to Neon Database:', error);
    return false;
  }
}

/**
 * Fetch all posts from the database
 * Example function as requested in the prompt
 */
export async function getPosts() {
  return queryNeon`SELECT * FROM posts`;
}