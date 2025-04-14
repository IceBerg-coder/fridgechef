'use server';
/**
 * @fileOverview Refines a recipe based on user instructions.
 *
 * - refineRecipe - A function that refines a recipe based on user instructions.
 * - RefineRecipeInput - The input type for the refineRecipe function.
 * - RefineRecipeOutput - The return type for the refineRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const RefineRecipeInputSchema = z.object({
  recipeText: z.string().describe('The recipe to refine.'),
  improvementRequest: z.string().describe('Instructions on how to refine the recipe, including cooking time, spice level, or other details.'),
});
export type RefineRecipeInput = z.infer<typeof RefineRecipeInputSchema>;

const RefineRecipeOutputSchema = z.object({
  refinedRecipe: z.string().describe('The refined recipe.'),
});
export type RefineRecipeOutput = z.infer<typeof RefineRecipeOutputSchema>;

export async function improveRecipe(input: RefineRecipeInput): Promise<RefineRecipeOutput> {
  return refineRecipeFlow(input);
}

// Keeping the original function for backward compatibility
export async function refineRecipe(input: RefineRecipeInput): Promise<RefineRecipeOutput> {
  return refineRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineRecipePrompt',
  input: {
    schema: z.object({
      recipe: z.string().describe('The recipe to refine.'),
      instructions: z.string().describe('Instructions on how to refine the recipe, including cooking time, spice level, or other details.'),
    }),
  },
  output: {
    schema: z.object({
      refinedRecipe: z.string().describe('The refined recipe.'),
    }),
  },
  prompt: `You are a helpful recipe assistant. Please refine the provided recipe based on the user's instructions, including cooking time, spice level, or other details.

Recipe:
{{{recipe}}}

Instructions:
{{{instructions}}}

Refined Recipe:`,
});

const refineRecipeFlow = ai.defineFlow<
  typeof RefineRecipeInputSchema,
  typeof RefineRecipeOutputSchema
>({
  name: 'refineRecipeFlow',
  inputSchema: RefineRecipeInputSchema,
  outputSchema: RefineRecipeOutputSchema,
},async input => {
  // Map the input from recipeText/improvementRequest to recipe/instructions
  const promptInput = {
    recipe: input.recipeText,
    instructions: input.improvementRequest
  };
  const {output} = await prompt(promptInput);
  return {
    refinedRecipe: output!.refinedRecipe
  };
});
