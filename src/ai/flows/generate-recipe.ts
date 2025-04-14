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
    const apiKeyAvailable = Boolean(
      process.env.GOOGLE_GENAI_API_KEY || 
      process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY
    );
    console.log(`API key available: ${apiKeyAvailable}`);

    // Create a comprehensive prompt combining all inputs
    let fullPrompt = `Create a delicious recipe using these ingredients: ${ingredients.join(', ')}`;
    
    if (dietaryPreferences) {
      fullPrompt += `\nFollow these dietary preferences: ${dietaryPreferences}`;
    }
    
    if (allergies) {
      fullPrompt += `\nAvoid these allergens: ${allergies}`;
    }
    
    if (additionalRequirements) {
      fullPrompt += `\nAdditional requirements: ${additionalRequirements}`;
    }

    // Call the AI to generate the recipe
    const response = await ai.chat({
      prompt: fullPrompt,
      format: {
        recipeName: "string",
        description: "string",
        ingredients: ["string"],
        instructions: ["string"],
        cookingTime: "string",
        servings: "number",
        difficulty: "string",
      },
      options: {
        temperature: 0.8,
      }
    });

    return response;
  } catch (error) {
    console.error("Recipe generation error:", error);
    throw new Error(`Failed to generate recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
