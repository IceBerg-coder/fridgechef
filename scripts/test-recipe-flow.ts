// Test script to verify recipe generation flow functionality
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading environment variables from', envLocalPath);
dotenv.config({ path: envLocalPath });

// Set the NEXT_PUBLIC version of the API key to ensure it's available
process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

// Import after environment variables are set
import { ai } from '../src/ai/ai-instance';

async function testGeneration() {
  try {
    console.log('Testing simple prompt with genkit...');
    console.log('API key available:', !!process.env.GOOGLE_GENAI_API_KEY);
    
    // Use a simple prompt flow
    const prompt = ai.definePrompt({
      name: 'testPrompt',
      input: {
        schema: {
          ingredients: 'string'
        }
      },
      output: {
        schema: {
          greeting: 'string'
        }
      },
      prompt: 'Say hello and mention these ingredients: {{{ingredients}}}'
    });

    const result = await prompt({ ingredients: 'chicken, rice, and garlic' });
    
    console.log('Result:', result);
    console.log('Test successful!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGeneration();