import { getApiBaseUrl, isGitHubPages, isVercel } from './is-github-pages';

/**
 * Generic API fetch function that adapts to different deployment environments
 * @param endpoint - API endpoint path (without leading slash)
 * @param options - Fetch options
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/${endpoint}`.replace(/\/+/g, '/');
  
  if (isGitHubPages()) {
    // On GitHub Pages, we need to use alternative data sources
    console.log(`GitHub Pages detected, redirecting API call to external service: ${url}`);
    
    // Example of using mock data from localStorage or a static JSON file
    return getMockData(endpoint) as unknown as T;
  }
  
  // Standard API call for Vercel and development deployments
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