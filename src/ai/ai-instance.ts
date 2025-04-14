import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Get API key from environment variables, checking both NEXT_PUBLIC and regular env vars
const getApiKey = () => {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.warn('Google Generative AI API key is not set. Recipe generation will not work.');
  }
  return apiKey;
};

// Create the genkit instance with Google AI provider
export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: getApiKey(),
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
