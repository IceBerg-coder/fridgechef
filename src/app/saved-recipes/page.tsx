'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Clock, ChefHat, TrashIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string; // This is actually a JSON string in the database
  instructions: string; // This is actually a JSON string in the database
  cookingTime: number | string;
  image?: string;
}

interface ProcessedRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number | string;
  image?: string;
}

export default function SavedRecipesPage() {
  const { data: session, status } = useSession();
  const [recipes, setRecipes] = useState<ProcessedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchSavedRecipes();
    }
  }, [status, router]);

  const fetchSavedRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/saved');
      if (!response.ok) {
        throw new Error('Failed to fetch saved recipes');
      }
      
      const data = await response.json();
      
      // Process recipes to parse JSON strings into arrays
      const processedRecipes = (data.recipes || []).map((recipe: Recipe) => {
        let ingredientsArray: string[] = [];
        let instructionsArray: string[] = [];
        
        try {
          ingredientsArray = typeof recipe.ingredients === 'string' 
            ? JSON.parse(recipe.ingredients) 
            : (Array.isArray(recipe.ingredients) ? recipe.ingredients : []);
        } catch (error) {
          console.error('Error parsing ingredients', error);
          ingredientsArray = [String(recipe.ingredients)];
        }
        
        try {
          instructionsArray = typeof recipe.instructions === 'string'
            ? JSON.parse(recipe.instructions)
            : (Array.isArray(recipe.instructions) ? recipe.instructions : []);
        } catch (error) {
          console.error('Error parsing instructions', error);
          instructionsArray = [String(recipe.instructions)];
        }
        
        return {
          ...recipe,
          ingredients: ingredientsArray,
          instructions: instructionsArray
        };
      });
      
      setRecipes(processedRecipes);
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your saved recipes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const unsaveRecipe = async (recipeId: string) => {
    try {
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipeId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove recipe');
      }

      // Remove recipe from state after unsaving
      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
      
      toast({
        title: 'Recipe removed',
        description: 'Recipe has been removed from your saved recipes',
      });
    } catch (error) {
      console.error('Error removing recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove recipe',
        variant: 'destructive'
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Saved Recipes</h1>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Saved Recipes</h1>
      
      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <BookmarkCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No saved recipes yet</h2>
          <p className="text-muted-foreground mb-4">
            Save your favorite recipes to access them quickly later
          </p>
          <Button onClick={() => router.push('/')}>
            Discover Recipes
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>{recipe.name}</CardTitle>
                <CardDescription>{recipe.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Ingredients:</h3>
                  <ul className="list-disc pl-5">
                    {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                    {recipe.ingredients.length > 3 && <li>...and {recipe.ingredients.length - 3} more</li>}
                  </ul>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>{recipe.cookingTime} mins</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push(`/recipe/${recipe.id}`)}>
                  View Details
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => unsaveRecipe(recipe.id)}
                  title="Remove from saved recipes"
                >
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}