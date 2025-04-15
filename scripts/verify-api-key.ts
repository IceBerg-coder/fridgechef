// Simple script to verify that the Google AI API key is properly loaded
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment variables from .env.local');
  dotenv.config({ path: envLocalPath });
} else {
  console.log('No .env.local file found');
}

// Check API key availability
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
console.log('API Key available:', !!apiKey);
if (apiKey) {
  // Show first and last few characters of the API key (for verification without exposing the full key)
  const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  console.log('API key starts and ends with:', maskedKey);
  console.log('✅ Google AI API key is properly loaded from environment variables');
} else {
  console.log('❌ No Google AI API key found in environment variables');
}

// Check if NEXT_PUBLIC version would be set
console.log('\nChecking NEXT_PUBLIC version of API key:');
const publicApiKey = process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;
console.log('NEXT_PUBLIC_GOOGLE_GENAI_API_KEY available:', !!publicApiKey);

console.log('\n📋 Environment check summary:');
console.log('- Local development: API key is', !!apiKey ? '✅ available' : '❌ missing');
console.log('- Vercel deployment: You will need to add NEXT_PUBLIC_GOOGLE_GENAI_API_KEY to your Vercel environment variables');