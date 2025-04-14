import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import React from 'react'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockImplementation(param => {
      if (param === 'recipe') {
        return 'Test Recipe'
      }
      return null
    }),
  }),
}))

// Create a more comprehensive mock function creator
const createChainableFunction = (name) => {
  const mock = jest.fn().mockImplementation(() => chainableObj);
  return mock;
};

// Create a more comprehensive mock for z
const chainableObj = {};
const methods = ['describe', 'optional', 'array', 'string', 'number', 'object', 'infer', 'int', 'min', 'max', 'default'];
methods.forEach(method => {
  chainableObj[method] = createChainableFunction(method);
});

// Mock genkit to avoid ES module issues with a more complete chainable API
jest.mock('genkit', () => ({
  z: {
    object: jest.fn(() => ({
      parse: jest.fn().mockReturnValue({}),
      ...chainableObj
    })),
    string: jest.fn(() => chainableObj),
    number: jest.fn(() => chainableObj),
    array: jest.fn(() => chainableObj),
    infer: jest.fn(() => ({})),
  }
}))

// Mock the AI flows directly with the correct return format
jest.mock('./src/ai/flows/generate-recipe', () => ({
  generateRecipe: jest.fn(() => Promise.resolve({
    recipeName: 'Test Recipe',
    ingredients: ['Ingredient 1', 'Ingredient 2'],
    instructions: 'Test instructions'
  })),
  default: {
    run: jest.fn(() => Promise.resolve({
      recipeName: 'Test Recipe',
      ingredients: ['Ingredient 1', 'Ingredient 2'],
      instructions: 'Test instructions'
    })),
  }
}))

jest.mock('./src/ai/flows/generate-recipes', () => ({
  generateRecipes: jest.fn(() => Promise.resolve([
    {
      recipeName: 'Test Recipe 1',
      ingredients: ['Ingredient 1', 'Ingredient 2'],
      instructions: 'Test instructions 1'
    },
    {
      recipeName: 'Test Recipe 2',
      ingredients: ['Ingredient 3', 'Ingredient 4'],
      instructions: 'Test instructions 2'
    }
  ])),
  default: {
    run: jest.fn(() => Promise.resolve([
      {
        recipeName: 'Test Recipe 1',
        ingredients: ['Ingredient 1', 'Ingredient 2'],
        instructions: 'Test instructions 1'
      },
      {
        recipeName: 'Test Recipe 2',
        ingredients: ['Ingredient 3', 'Ingredient 4'],
        instructions: 'Test instructions 2'
      }
    ])),
  }
}))

jest.mock('./src/ai/flows/improve-recipe', () => ({
  improveRecipe: jest.fn(() => Promise.resolve({
    refinedRecipe: 'Improved Recipe: Test Recipe with improvements',
  })),
  default: {
    run: jest.fn(() => Promise.resolve({
      refinedRecipe: 'Improved Recipe: Test Recipe with improvements',
    })),
  }
}))

// Mock AI functions to avoid actual API calls during tests
jest.mock('./src/ai/ai-instance', () => ({
  ai: {
    run: jest.fn(() => Promise.resolve('Mocked AI Response')),
    createFlow: jest.fn((config) => ({
      run: jest.fn((input) => {
        if (config.id === 'generate-recipe') {
          return Promise.resolve({
            recipeName: 'Test Recipe',
            ingredients: ['Ingredient 1', 'Ingredient 2'],
            instructions: 'Test instructions'
          });
        } else if (config.id === 'generate-recipes') {
          return Promise.resolve([
            {
              recipeName: 'Test Recipe 1',
              ingredients: ['Ingredient 1', 'Ingredient 2'],
              instructions: 'Test instructions 1'
            },
            {
              recipeName: 'Test Recipe 2',
              ingredients: ['Ingredient 3', 'Ingredient 4'],
              instructions: 'Test instructions 2'
            }
          ]);
        } else if (config.id === 'improve-recipe') {
          return Promise.resolve({
            refinedRecipe: 'Improved Recipe: Test Recipe with improvements',
          });
        }
        return Promise.resolve('Mocked Flow Response');
      }),
    })),
    definePrompt: jest.fn(() => ({
      run: jest.fn(() => Promise.resolve('Mocked Prompt Response')),
    })),
    defineFlow: jest.fn((config) => {
      const flow = {
        run: jest.fn((input) => {
          if (config.id === 'generate-recipe') {
            return Promise.resolve({
              recipeName: 'Test Recipe',
              ingredients: ['Ingredient 1', 'Ingredient 2'],
              instructions: 'Test instructions'
            });
          } else if (config.id === 'generate-recipes') {
            return Promise.resolve([
              {
                recipeName: 'Test Recipe 1',
                ingredients: ['Ingredient 1', 'Ingredient 2'],
                instructions: 'Test instructions 1'
              },
              {
                recipeName: 'Test Recipe 2',
                ingredients: ['Ingredient 3', 'Ingredient 4'],
                instructions: 'Test instructions 2'
              }
            ]);
          } else if (config.id === 'improve-recipe') {
            return Promise.resolve({
              refinedRecipe: 'Improved Recipe: Test Recipe with improvements',
            });
          }
          return Promise.resolve('Mocked Flow Response');
        }),
      };
      
      // For exports like generateRecipeFlow
      if (config.id === 'generate-recipe') {
        global.generateRecipeFlow = flow;
      } else if (config.id === 'generate-recipes') {
        global.generateRecipesFlow = flow;
      } else if (config.id === 'improve-recipe') {
        global.refineRecipeFlow = flow;
      }
      
      return flow;
    }),
  }
}))

// Create a proper React component mock for Lucide icons that handles refs correctly
const createIconMock = () => {
  return React.forwardRef((props, ref) => {
    return <span ref={ref} data-testid="icon-mock" {...props} />
  })
}

// Mock all lucide-react icons
jest.mock('lucide-react', () => {
  return new Proxy(
    {},
    {
      get: function(_, icon) {
        return createIconMock()
      }
    }
  )
})

// Required for Next.js
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
}