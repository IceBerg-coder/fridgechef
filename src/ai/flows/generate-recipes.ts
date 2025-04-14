'use server';
/**
 * @fileOverview Generates multiple recipes based on a list of ingredients.
 *
 * - generateRecipes - A function that generates multiple recipe options.
 * - GenerateRecipesInput - The input type for the generateRecipes function.
 * - GenerateRecipesOutput - The return type for the generateRecipes function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateRecipesInputSchema = z.object({
  ingredients: z.string().describe('A comma-separated list of ingredients available.'),
  count: z.number().int().min(1).max(5).default(3).describe('Number of recipes to generate (1-5)'),
  dietaryPreferences: z.string().optional().describe('Any dietary preferences (optional, e.g., vegetarian, vegan, gluten-free)'),
});
export type GenerateRecipesInput = z.infer<typeof GenerateRecipesInputSchema>;

const RecipeSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe.'),
  description: z.string().describe('A brief description of the recipe.'),
  cookingTime: z.string().describe('Estimated cooking time (e.g. "30 minutes").'),
  difficulty: z.string().describe('Difficulty level (Easy, Medium, Hard)'),
  ingredients: z.array(z.string()).describe('The list of ingredients required for the recipe.'),
  instructions: z.string().describe('The step-by-step instructions for preparing the recipe.'),
});

const GenerateRecipesOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('List of generated recipes'),
});
export type GenerateRecipesOutput = z.infer<typeof GenerateRecipesOutputSchema>;

export async function generateRecipes(input: GenerateRecipesInput): Promise<GenerateRecipesOutput> {
  try {
    // Log API key availability and environment
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;
    const envSource = process.env.GOOGLE_GENAI_API_KEY ? 'GOOGLE_GENAI_API_KEY' : 
                      process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY ? 'NEXT_PUBLIC_GOOGLE_GENAI_API_KEY' : 'none';
    
    console.log(`Recipes generation - Environment: ${process.env.VERCEL ? 'Vercel' : 'Local'}, API key from: ${envSource}`);
    
    // In production, introduce a small delay to ensure API initialization
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!apiKey) {
      console.warn('No Google AI API key available for recipe generation');
      return createFallbackRecipes(input);
    }
    
    try {
      return await generateRecipesFlow(input);
    } catch (flowError) {
      console.error('Error in recipes flow execution:', flowError);
      return createFallbackRecipes(input);
    }
  } catch (error) {
    console.error('Error generating recipes:', error);
    return createFallbackRecipes(input);
  }
}

/**
 * Creates fallback recipes when the AI generation fails
 */
function createFallbackRecipes(input: GenerateRecipesInput): GenerateRecipesOutput {
  const ingredientsList = input.ingredients.split(',').map(item => item.trim()).filter(item => item.length > 0);
  const count = Math.min(input.count || 3, 3); // Limit to max 3 fallback recipes
  
  const recipeTypes = [
    { name: "Simple Pasta", cookTime: "15 minutes", diff: "Easy" },
    { name: "Quick Stir Fry", cookTime: "20 minutes", diff: "Easy" },
    { name: "One-Pot Meal", cookTime: "25 minutes", diff: "Medium" }
  ];
  
  const recipes = [];
  
  for (let i = 0; i < count; i++) {
    const recipeType = recipeTypes[i % recipeTypes.length];
    const mainIngredient = ingredientsList[i % ingredientsList.length];
    
    recipes.push({
      recipeName: `${recipeType.name} with ${mainIngredient}`,
      description: `A simple ${recipeType.name.toLowerCase()} recipe using ${mainIngredient} and other available ingredients.`,
      cookingTime: recipeType.cookTime,
      difficulty: recipeType.diff,
      ingredients: [
        mainIngredient,
        ...ingredientsList.slice(0, 5).filter(ing => ing !== mainIngredient),
        "Salt and pepper to taste",
        i === 0 ? "Olive oil" : "Vegetable oil",
      ],
      instructions: `1. Prepare all ingredients.\n2. Cook ${mainIngredient} until done.\n3. Combine with other ingredients.\n4. Season to taste and serve.`
    });
  }
  
  return { recipes };
}

const prompt = ai.definePrompt({
  name: 'generateRecipesPrompt',
  input: {
    schema: z.object({
      ingredients: z.string().describe('A comma-separated list of ingredients available.'),
      count: z.number().describe('Number of recipes to generate'),
      dietaryPreferences: z.string().optional().describe('Any dietary preferences (optional)'),
    }),
  },
  output: {
    schema: z.object({
      recipes: z.array(RecipeSchema).describe('List of generated recipes'),
    }),
  },
  prompt: `You are a professional chef. Given the following ingredients, generate {{{count}}} different recipes that can be made with them.
  
Ingredients: {{{ingredients}}}
{{#if dietaryPreferences}}
Dietary Preferences: {{{dietaryPreferences}}}
{{/if}}

For each recipe, provide:
1. Recipe name
2. Brief description
3. Cooking time estimate
4. Difficulty level (Easy, Medium, Hard)
5. List of ingredients (as bullet points)
6. Step-by-step cooking instructions

Make sure each recipe is unique and creative, maximizing the use of the provided ingredients.`,
});

const generateRecipesFlow = ai.defineFlow<
  typeof GenerateRecipesInputSchema,
  typeof GenerateRecipesOutputSchema
>({
  name: 'generateRecipesFlow',
  inputSchema: GenerateRecipesInputSchema,
  outputSchema: GenerateRecipesOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});