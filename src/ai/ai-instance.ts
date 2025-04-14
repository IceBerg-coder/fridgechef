import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Create the genkit instance with Google AI provider
export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
