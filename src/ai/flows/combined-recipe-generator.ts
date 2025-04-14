'use server';
/**
 * @fileOverview Combined recipe generator that can produce either a single recipe or multiple recipes.
 *
 * - combinedRecipeGenerator - A function that generates one or multiple recipes based on user preference.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Define a common recipe schema that covers both use cases
const RecipeSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe.'),
  description: z.string().optional().describe('A brief description of the recipe.'),
  cookingTime: z.string().optional().describe('Estimated cooking time (e.g. "30 minutes").'),
  difficulty: z.string().optional().describe('Difficulty level (Easy, Medium, Hard)'),
  ingredients: z.array(z.string()).describe('The list of ingredients required for the recipe.'),
  instructions: z.array(z.string()).describe('The step-by-step instructions for preparing the recipe.'),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// Combined input schema that handles both single and multiple recipe requests
const CombinedRecipeInputSchema = z.object({
  ingredients: z.string().describe('A comma-separated list of ingredients available.'),
  mode: z.enum(['single', 'multiple']).describe('Whether to generate a single recipe or multiple recipes'),
  count: z.number().int().min(1).max(5).default(3).optional().describe('Number of recipes to generate (1-5)'),
  dietaryPreferences: z.string().optional().describe('Any dietary preferences (optional, e.g., vegetarian, vegan, gluten-free)'),
  cuisineType: z.string().optional().describe('The type of cuisine (e.g., Italian, Mexican, Indian)'),
  difficultyLevel: z.number().optional().describe('The difficulty level of the recipe (1-3)'),
  additionalNotes: z.string().optional().describe('Any additional notes or requirements for the recipe'),
});

export type CombinedRecipeInput = z.infer<typeof CombinedRecipeInputSchema>;

// Combined output schema
const CombinedRecipeOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('List of generated recipes (single or multiple)'),
});

export type CombinedRecipeOutput = z.infer<typeof CombinedRecipeOutputSchema>;

// Temporary type for raw AI response
type RawRecipeResponse = {
  title: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  difficultyLevel?: number;
  cuisineType?: string;
};

// Prompt for generating single recipe
const singleRecipePrompt = ai.definePrompt({
  name: 'singleRecipePrompt',
  input: {
    schema: z.object({
      ingredients: z.string().describe('A comma-separated list of ingredients available.'),
      dietaryPreferences: z.string().optional().describe('Any dietary preferences (optional)'),
      cuisineType: z.string().optional().describe('The type of cuisine'),
      difficultyLevel: z.number().optional().describe('The difficulty level of the recipe (1-5)'),
      additionalNotes: z.string().optional().describe('Any additional notes or requirements'),
    }),
  },
  output: {
    schema: z.object({
      title: z.string().describe('Recipe title'),
      ingredients: z.array(z.string()).describe('List of ingredients with quantities'),
      instructions: z.array(z.string()).describe('Step by step instructions'),
      prepTime: z.string().optional().describe('Preparation time'),
      cookTime: z.string().optional().describe('Cooking time'),
      servings: z.number().optional().describe('Number of servings'),
      difficultyLevel: z.number().optional().describe('Difficulty level (1-5)'),
      cuisineType: z.string().optional().describe('Type of cuisine'),
    }),
  },
  prompt: `You are a helpful chef assistant that suggests a single recipe based on the ingredients the user has.

Ingredients: {{{ingredients}}}
{{#dietaryPreferences}}Dietary Preferences: {{{dietaryPreferences}}}{{/dietaryPreferences}}
{{#cuisineType}}Cuisine Type: {{{cuisineType}}}{{/cuisineType}}
{{#difficultyLevel}}Difficulty Level (1-5): {{{difficultyLevel}}}{{/difficultyLevel}}
{{#additionalNotes}}Additional Notes: {{{additionalNotes}}}{{/additionalNotes}}

Create ONE recipe that uses these ingredients. Format your response as valid JSON with these fields:
{
  "title": "Recipe Title",
  "ingredients": [
    "First ingredient with quantity",
    "Second ingredient with quantity",
    ...
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction",
    ...
  ],
  "prepTime": "XX minutes",
  "cookTime": "XX minutes",
  "servings": X,
  "difficultyLevel": X (1-5),
  "cuisineType": "Type of cuisine"
}`,
});

// Prompt for generating multiple recipes
const multipleRecipesPrompt = ai.definePrompt({
  name: 'multipleRecipesPrompt',
  input: {
    schema: z.object({
      ingredients: z.string().describe('A comma-separated list of ingredients available.'),
      count: z.number().describe('Number of recipes to generate'),
      dietaryPreferences: z.string().optional().describe('Any dietary preferences (optional)'),
      cuisineType: z.string().optional().describe('The type of cuisine'),
      difficultyLevel: z.number().optional().describe('The difficulty level of the recipe (1-5)'),
      additionalNotes: z.string().optional().describe('Any additional notes or requirements'),
    }),
  },
  output: {
    schema: z.object({
      recipes: z.array(z.object({
        title: z.string().describe('Recipe title'),
        ingredients: z.array(z.string()).describe('List of ingredients with quantities'),
        instructions: z.array(z.string()).describe('Step by step instructions'),
        prepTime: z.string().optional().describe('Preparation time'),
        cookTime: z.string().optional().describe('Cooking time'),
        servings: z.number().optional().describe('Number of servings'),
        difficultyLevel: z.number().optional().describe('Difficulty level (1-5)'),
        cuisineType: z.string().optional().describe('Type of cuisine'),
      })).describe('List of recipes'),
    }),
  },
  prompt: `You are a helpful chef assistant that suggests multiple recipes based on the ingredients the user has.

Ingredients: {{{ingredients}}}
Number of Recipes: {{{count}}}
{{#dietaryPreferences}}Dietary Preferences: {{{dietaryPreferences}}}{{/dietaryPreferences}}
{{#cuisineType}}Cuisine Type: {{{cuisineType}}}{{/cuisineType}}
{{#difficultyLevel}}Difficulty Level (1-5): {{{difficultyLevel}}}{{/difficultyLevel}}
{{#additionalNotes}}Additional Notes: {{{additionalNotes}}}{{/additionalNotes}}

Create {{{count}}} different recipes that use these ingredients. Format your response as valid JSON with these fields:
{
  "recipes": [
    {
      "title": "Recipe Title",
      "ingredients": [
        "First ingredient with quantity",
        "Second ingredient with quantity",
        ...
      ],
      "instructions": [
        "Step 1 instruction",
        "Step 2 instruction",
        ...
      ],
      "prepTime": "XX minutes",
      "cookTime": "XX minutes",
      "servings": X,
      "difficultyLevel": X (1-5),
      "cuisineType": "Type of cuisine"
    },
    ...
  ]
}`,
});

// Helper function to convert raw AI response to our schema format
const convertRawRecipeToSchema = (rawRecipe: RawRecipeResponse): Recipe => {
  // Add numbering to each instruction but keep as array
  const numberedInstructions = rawRecipe.instructions.map((step, index) => step);
  
  // Combine prepTime and cookTime for cookingTime if available
  let cookingTime = undefined;
  if (rawRecipe.prepTime || rawRecipe.cookTime) {
    cookingTime = [
      rawRecipe.prepTime && `Prep: ${rawRecipe.prepTime}`,
      rawRecipe.cookTime && `Cook: ${rawRecipe.cookTime}`
    ].filter(Boolean).join(', ');
  }

  // Create a description that includes cuisine type and servings if available
  let description = '';
  if (rawRecipe.cuisineType) {
    description += `${rawRecipe.cuisineType} cuisine. `;
  }
  if (rawRecipe.servings) {
    description += `Serves ${rawRecipe.servings}. `;
  }
  description = description || undefined;

  // Map difficulty level to text
  let difficulty = undefined;
  if (rawRecipe.difficultyLevel) {
    const difficultyMap: Record<number, string> = {
      1: 'Easy',
      2: 'Medium',
      3: 'Hard',
      4: 'Advanced',
      5: 'Expert'
    };
    difficulty = difficultyMap[rawRecipe.difficultyLevel] || 'Medium';
  }

  return {
    recipeName: rawRecipe.title,
    description,
    cookingTime,
    difficulty,
    ingredients: rawRecipe.ingredients,
    instructions: numberedInstructions,
  };
};

// Combined flow that handles both single and multiple recipe requests
const combinedRecipeGeneratorFlow = ai.defineFlow<
  typeof CombinedRecipeInputSchema,
  typeof CombinedRecipeOutputSchema
>({
  name: 'combinedRecipeGeneratorFlow',
  inputSchema: CombinedRecipeInputSchema,
  outputSchema: CombinedRecipeOutputSchema,
},
async input => {
  if (input.mode === 'single') {
    // Single recipe mode
    const { output } = await singleRecipePrompt({
      ingredients: input.ingredients,
      dietaryPreferences: input.dietaryPreferences,
      cuisineType: input.cuisineType,
      difficultyLevel: input.difficultyLevel,
      additionalNotes: input.additionalNotes
    });
    
    // Convert the single recipe to our schema format
    const formattedRecipe = convertRawRecipeToSchema(output!);
    
    // Return in the expected format with an array containing the single recipe
    return {
      recipes: [formattedRecipe]
    };
  } else {
    // Multiple recipes mode
    const { output } = await multipleRecipesPrompt({
      ingredients: input.ingredients,
      count: input.count || 3,
      dietaryPreferences: input.dietaryPreferences,
      cuisineType: input.cuisineType,
      difficultyLevel: input.difficultyLevel,
      additionalNotes: input.additionalNotes
    });
    
    // Convert each raw recipe to our schema format
    const formattedRecipes = output!.recipes.map(convertRawRecipeToSchema);
    
    return {
      recipes: formattedRecipes
    };
  }
});

/**
 * Combined function for generating recipes, can be used to generate single or multiple recipes
 * @param options Object containing generation options
 * @param options.ingredients List of ingredients
 * @param options.mode Either 'single' or 'multiple' to determine the generation mode
 * @param options.count Optional number of recipes to generate (used in multiple mode)
 * @param options.dietaryPreferences Optional dietary preferences
 * @param options.cuisineType Optional cuisine type (e.g. Italian, Mexican)
 * @param options.difficultyLevel Optional difficulty level (1-3)
 * @param options.additionalNotes Optional additional notes or requirements
 * @returns Object with recipes array
 */
export const combinedRecipeGenerator = async (options: {
  ingredients: string;
  mode: 'single' | 'multiple';
  count?: number;
  dietaryPreferences?: string;
  cuisineType?: string;
  difficultyLevel?: number;
  additionalNotes?: string;
}): Promise<CombinedRecipeOutput> => {
  try {
    // Verify API key is available
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;
    
    if (!apiKey) {
      console.error("API key is missing for recipe generation");
      throw new Error("Configuration error: API key is not available");
    }
    
    console.log("Recipe generation starting with API key available:", !!apiKey);
    
    // Process ingredients to ensure they're in a usable format
    const ingredientsList = typeof options.ingredients === 'string' 
      ? options.ingredients 
      : Array.isArray(options.ingredients) 
        ? options.ingredients.join(', ')
        : '';
        
    if (!ingredientsList) {
      throw new Error("No ingredients provided for recipe generation");
    }
    
    // Call the flow with more robust error handling
    try {
      return await combinedRecipeGeneratorFlow({
        ingredients: ingredientsList,
        mode: options.mode,
        count: options.count || 3,
        dietaryPreferences: options.dietaryPreferences,
        cuisineType: options.cuisineType,
        difficultyLevel: options.difficultyLevel,
        additionalNotes: options.additionalNotes,
      });
    } catch (flowError: any) {
      console.error('Flow execution error:', flowError);
      
      // Provide a fallback response for production environments
      if (process.env.NODE_ENV === 'production') {
        console.log('Using fallback recipe in production');
        return {
          recipes: [{
            recipeName: "Simple Pasta with " + ingredientsList.split(',')[0],
            description: "A quick recipe using available ingredients.",
            cookingTime: "20 minutes",
            difficulty: "Easy",
            ingredients: [
              "Pasta", 
              ...ingredientsList.split(',').map(i => i.trim())
            ],
            instructions: [
              "Cook pasta according to package directions.",
              "Combine with other ingredients and season to taste.",
              "Serve hot."
            ]
          }]
        };
      }
      
      // Re-throw error if not in production or if fallback fails
      throw new Error(`Recipe generation failed: ${flowError.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('Error generating recipes:', error);
    throw new Error(`Failed to generate recipe: ${error.message || 'Unexpected error occurred'}`);
  }
};