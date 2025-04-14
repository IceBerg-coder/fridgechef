import { getApiBaseUrl, isGitHubPages } from './is-github-pages';

/**
 * Generic API fetch function that adapts to GitHub Pages environment
 * @param endpoint - API endpoint path (without leading slash)
 * @param options - Fetch options
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/${endpoint}`.replace(/\/+/g, '/');
  
  if (isGitHubPages()) {
    // On GitHub Pages, we need to use alternative data sources
    // This could be a mock data service or an external API
    console.log(`GitHub Pages detected, redirecting API call to external service: ${url}`);
    
    // You could implement fallbacks here:
    // 1. Use localStorage for saved recipes
    // 2. Call an external API for recipe generation
    // 3. Use static data for some features
    
    // Example of using mock data from localStorage or a static JSON file
    return getMockData(endpoint) as unknown as T;
  }
  
  // Standard API call for development and normal deployments
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get mock data for GitHub Pages deployment
 * This is a simple implementation that could be expanded
 */
function getMockData(endpoint: string): any {
  // This is where you would implement the logic to return mock data
  // based on the endpoint
  
  // For example:
  if (endpoint.startsWith('recipes')) {
    return {
      recipes: [
        { 
          id: '1', 
          title: 'Mock Pasta Recipe', 
          ingredients: ['pasta', 'tomato sauce', 'cheese'],
          instructions: 'Mix ingredients and enjoy!'
        },
        // Add more mock recipes
      ]
    };
  }
  
  // Default empty response
  return {};
}