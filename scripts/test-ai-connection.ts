// Test script to verify Google AI API connection
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local first, then fall back to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment variables from .env.local');
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env');
  dotenv.config({ path: envPath });
} else {
  console.log('No .env or .env.local file found');
}

// Import the actual generate recipe function after environment variables are loaded
import { generateRecipe } from '../src/ai/flows/generate-recipe';
import { improveRecipe } from '../src/ai/flows/improve-recipe';

async function testRecipeGeneration() {
  try {
    console.log('Testing recipe generation...');
    console.log('API Key available:', !!process.env.GOOGLE_GENAI_API_KEY);
    
    const ingredients = ['chicken', 'rice', 'garlic', 'lemon'];
    console.log(`Generating recipe with ingredients: ${ingredients.join(', ')}`);
    
    const result = await generateRecipe({
      ingredients,
      additionalRequirements: 'Quick and easy dinner'
    });
    
    console.log('Recipe generated successfully!');
    console.log('Recipe name:', result.recipeName);
    console.log('Recipe generation test passed!');
    return true;
  } catch (error) {
    console.error('Recipe generation test failed:', error);
    return false;
  }
}

async function testRecipeImprovement() {
  try {
    console.log('\nTesting recipe improvement...');
    
    const sampleRecipe = `
Recipe: Simple Pasta
Ingredients:
1. Pasta
2. Tomato sauce
3. Salt

Instructions:
1. Cook pasta
2. Add sauce
3. Serve
    `;
    
    const result = await improveRecipe({
      recipeText: sampleRecipe,
      improvementRequest: 'Make it more flavorful'
    });
    
    console.log('Recipe improved successfully!');
    console.log('Recipe improvement test passed!');
    return true;
  } catch (error) {
    console.error('Recipe improvement test failed:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('=== TESTING AI FUNCTIONALITY ===\n');
  
  const generationSuccess = await testRecipeGeneration();
  const improvementSuccess = await testRecipeImprovement();
  
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Recipe Generation: ${generationSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Recipe Improvement: ${improvementSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (generationSuccess && improvementSuccess) {
    console.log('\n✅ All tests passed! Your AI configuration is working correctly.');
    console.log('You can proceed with deploying to Vercel.');
  } else {
    console.log('\n❌ Some tests failed. Please check your API key and configuration.');
  }
}

runTests();