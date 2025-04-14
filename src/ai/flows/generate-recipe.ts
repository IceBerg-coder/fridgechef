'use server';
/**
 * @fileOverview Generates a single recipe based on a list of ingredients.
 *
 * - generateRecipe - A function that generates a single recipe.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  ingredients: z.string().describe('A comma-separated list of ingredients available.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe.'),
  ingredients: z.array(z.string()).describe('The list of ingredients required for the recipe.'),
  instructions: z.string().describe('The step-by-step instructions for preparing the recipe.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe({
  ingredients,
  additionalRequirements,
  dietaryPreferences,
  allergies,
}: {
  ingredients: string[];
  additionalRequirements?: string;
  dietaryPreferences?: string;
  allergies?: string;
}) {
  try {
    // Log API key availability (sanitized for security)
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;
    const envSource = apiKey ? (process.env.GOOGLE_GENAI_API_KEY ? 'server env' : 'client env') : 'none';
    
    console.log(`Recipe generation - Environment: ${process.env.VERCEL ? 'Vercel' : 'Local'}, API key from: ${envSource}`);
    
    // In production environments, add a short delay to ensure everything is initialized
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!apiKey) {
      console.warn('No AI API key available for recipe generation');
      return createFallbackRecipe(ingredients.join(', '));
    }

    // Create a comprehensive ingredients string with all requirements
    let ingredientsWithRequirements = ingredients.join(', ');
    
    if (dietaryPreferences) {
      ingredientsWithRequirements += `\nDietary preferences: ${dietaryPreferences}`;
    }
    
    if (allergies) {
      ingredientsWithRequirements += `\nAllergies to avoid: ${allergies}`;
    }
    
    if (additionalRequirements) {
      ingredientsWithRequirements += `\nAdditional requirements: ${additionalRequirements}`;
    }

    try {
      // Use the existing generateRecipeFlow which is properly configured
      const result = await generateRecipeFlow({
        ingredients: ingredientsWithRequirements
      });
      
      // Create a more complete response that includes the additional fields expected by the application
      return {
        ...result,
        description: `A delicious recipe using ${ingredients.join(', ')}`,
        cookingTime: "30 minutes",
        servings: 4,
        difficulty: "medium"
      };
    } catch (flowError) {
      console.error("Recipe flow execution error:", flowError);
      return createFallbackRecipe(ingredients.join(', '));
    }
  } catch (error) {
    console.error("Recipe generation error:", error);
    return createFallbackRecipe(ingredients.join(', '));
  }
}

/**
 * Creates a fallback recipe when AI generation fails
 */
function createFallbackRecipe(ingredientsList: string) {
  const ingredients = ingredientsList.split(',').map(i => i.trim()).filter(i => i.length > 0);
  const mainIngredient = ingredients[0] || 'basic ingredients';
  
  return {
    recipeName: `Simple ${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`,
    description: `A quick and easy recipe featuring ${mainIngredient}`,
    ingredients: [
      mainIngredient,
      ...ingredients.slice(1, 5),
      'Salt and pepper to taste',
      'Olive oil'
    ],
    instructions: `1. Prepare ${mainIngredient}.\n2. Combine with other ingredients.\n3. Cook until done.\n4. Serve and enjoy!`,
    cookingTime: "25 minutes",
    servings: 2,
    difficulty: "easy"
  };
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {
    schema: z.object({
      ingredients: z.string().describe('A comma-separated list of ingredients available.'),
    }),
  },
  output: {
    schema: z.object({
      recipeName: z.string().describe('The name of the generated recipe.'),
      ingredients: z.array(z.string()).describe('The list of ingredients required for the recipe.'),
      instructions: z.string().describe('The step-by-step instructions for preparing the recipe.'),
    }),
  },
  prompt: `You are a professional chef. Given the following ingredients, generate a recipe that can be made with them.\n\nIngredients: {{{ingredients}}}\n\nRecipe Name:\nIngredients (as a bulleted list):\nInstructions:`,
});

const generateRecipeFlow = ai.defineFlow<
  typeof GenerateRecipeInputSchema,
  typeof GenerateRecipeOutputSchema
>({
  name: 'generateRecipeFlow',
  inputSchema: GenerateRecipeInputSchema,
  outputSchema: GenerateRecipeOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
