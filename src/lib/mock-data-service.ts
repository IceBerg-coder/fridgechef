import { isGitHubPages } from './is-github-pages';

// Types for our mock data - this should match your actual data types
type User = {
  id: string;
  name: string;
  email: string;
  preferences?: Record<string, any>;
};

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  createdAt: string;
  userId?: string;
};

type Collection = {
  id: string;
  name: string;
  recipes: Recipe[];
  userId: string;
};

// Sample mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    preferences: { dietaryRestrictions: ['vegetarian'], allergens: ['peanuts'] },
  }
];

const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Pasta Primavera',
    ingredients: ['pasta', 'olive oil', 'garlic', 'zucchini', 'bell peppers', 'cherry tomatoes', 'parmesan cheese'],
    instructions: ['Cook pasta according to package instructions.', 'Sauté vegetables in olive oil and garlic.', 'Combine pasta and vegetables. Top with cheese.'],
    imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601',
    createdAt: new Date().toISOString(),
    userId: '1',
  },
  {
    id: '2',
    title: 'Vegetable Stir Fry',
    ingredients: ['rice', 'broccoli', 'carrots', 'snap peas', 'soy sauce', 'ginger', 'garlic'],
    instructions: ['Cook rice according to package instructions.', 'Stir fry vegetables with ginger and garlic.', 'Add soy sauce and serve over rice.'],
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    createdAt: new Date().toISOString(),
    userId: '1',
  },
];

const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Favorites',
    recipes: [mockRecipes[0]],
    userId: '1',
  }
];

// Simple in-memory "database" for GitHub Pages
const db = {
  users: [...mockUsers],
  recipes: [...mockRecipes],
  collections: [...mockCollections],
  savedRecipes: [{ userId: '1', recipeId: '1' }],
};

/**
 * Creates a fetch replacement that returns mock data when running on GitHub Pages
 */
export const createGitHubPagesFetch = () => {
  // Only replace fetch when on GitHub Pages
  if (!isGitHubPages()) {
    return window.fetch.bind(window);
  }

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();
    console.log(`GitHub Pages mock API call: ${url}`);

    // Wait a short time to simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Handle different API endpoints
    if (url.includes('/api/auth') || url.includes('/api/signin') || url.includes('/api/signup')) {
      const mockUser = db.users[0];
      return createMockResponse({
        user: mockUser,
        session: { user: mockUser }
      });
    }

    if (url.includes('/api/recipes/saved')) {
      const savedRecipeIds = db.savedRecipes
        .filter(sr => sr.userId === '1')
        .map(sr => sr.recipeId);
      
      const savedRecipes = db.recipes.filter(recipe => 
        savedRecipeIds.includes(recipe.id)
      );
      
      return createMockResponse(savedRecipes);
    }

    if (url.includes('/api/recipes/save')) {
      if (init?.method === 'POST') {
        try {
          const body = init.body ? JSON.parse(init.body.toString()) : {};
          const { recipeId } = body;
          if (!db.savedRecipes.some(sr => sr.recipeId === recipeId && sr.userId === '1')) {
            db.savedRecipes.push({ userId: '1', recipeId });
          }
          return createMockResponse({ success: true });
        } catch (e) {
          return createMockResponse({ error: 'Invalid request' }, 400);
        }
      }
    }

    if (url.includes('/api/recipes/')) {
      const idMatch = url.match(/\/api\/recipes\/([^\/]+)/);
      if (idMatch && idMatch[1]) {
        const id = idMatch[1];
        const recipe = db.recipes.find(r => r.id === id);
        if (recipe) {
          return createMockResponse(recipe);
        }
        return createMockResponse({ error: 'Recipe not found' }, 404);
      }
    }

    if (url.includes('/api/collections')) {
      if (url.includes('/api/collections/add-recipe')) {
        if (init?.method === 'POST') {
          try {
            const body = init.body ? JSON.parse(init.body.toString()) : {};
            const { collectionId, recipeId } = body;
            const collection = db.collections.find(c => c.id === collectionId);
            const recipe = db.recipes.find(r => r.id === recipeId);
            
            if (collection && recipe) {
              if (!collection.recipes.some(r => r.id === recipeId)) {
                collection.recipes.push(recipe);
              }
              return createMockResponse({ success: true });
            }
            return createMockResponse({ error: 'Collection or recipe not found' }, 404);
          } catch (e) {
            return createMockResponse({ error: 'Invalid request' }, 400);
          }
        }
      } else {
        return createMockResponse(db.collections.filter(c => c.userId === '1'));
      }
    }

    if (url.includes('/api/user/preferences')) {
      if (init?.method === 'GET') {
        const user = db.users.find(u => u.id === '1');
        return createMockResponse(user?.preferences || {});
      } else if (init?.method === 'POST') {
        try {
          const body = init.body ? JSON.parse(init.body.toString()) : {};
          const user = db.users.find(u => u.id === '1');
          if (user) {
            user.preferences = { ...user.preferences, ...body };
            return createMockResponse({ success: true });
          }
          return createMockResponse({ error: 'User not found' }, 404);
        } catch (e) {
          return createMockResponse({ error: 'Invalid request' }, 400);
        }
      }
    }

    // Default response for unhandled routes
    return createMockResponse({ error: 'Not implemented in GitHub Pages mode' }, 501);
  };
};

// Helper to create mock Response objects
function createMockResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Function to apply the mock fetch when on GitHub Pages
export function setupMockFetchForGitHubPages() {
  if (typeof window !== 'undefined' && isGitHubPages()) {
    const originalFetch = window.fetch;
    const mockFetch = createGitHubPagesFetch();
    
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string' && input.includes('/api/')) {
        return mockFetch(input, init);
      }
      return originalFetch(input, init);
    };
    
    console.log('GitHub Pages mock API initialized');
  }
}