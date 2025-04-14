'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SaveRecipeButton } from '@/components/ui/save-recipe-button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTimeMinutes: number;
  difficulty: string;
  servings: number;
  tags: string[];
  imageUrl?: string;
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true);
      try {
        console.log(`Fetching recipe with ID: ${id}`);
        const response = await fetch(`/api/recipes/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Response error:', response.status, errorData);
          throw new Error(`Error fetching recipe: ${response.status} ${response.statusText} - ${errorData.error || ''}`);
        }
        
        const data = await response.json();
        setRecipe(data.recipe);
      } catch (err) {
        console.error('Recipe fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load recipe details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchRecipe();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-8 w-1/2 mb-8" />
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Sorry, we couldn't load this recipe</h2>
        <p className="mb-6">{error || 'Recipe not found'}</p>
        <p className="mb-4 text-sm text-gray-500">Recipe ID: {id}</p>
        <Link href="/saved-recipes">
          <Button>Return to Saved Recipes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/saved-recipes">
        <Button variant="ghost" className="mb-4">
          &larr; Back to Saved Recipes
        </Button>
      </Link>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">{recipe.name}</CardTitle>
              <CardDescription className="text-lg">{recipe.description}</CardDescription>
            </div>
            <SaveRecipeButton recipeId={recipe.id} />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">{recipe.difficulty}</Badge>
            <Badge variant="outline">{recipe.cookingTimeMinutes} mins</Badge>
            <Badge variant="outline">{recipe.servings} servings</Badge>
            {recipe.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </CardHeader>
        
        {recipe.imageUrl && (
          <div className="px-6 mb-6">
            <img 
              src={recipe.imageUrl} 
              alt={recipe.name}
              className="w-full h-[300px] object-cover rounded-md"
            />
          </div>
        )}
        
        <CardContent>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Ingredients</h3>
            <ul className="list-disc pl-6 space-y-2">
              {Array.isArray(recipe.ingredients) 
                ? recipe.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))
                : typeof recipe.ingredients === 'string'
                  ? recipe.ingredients.split(',').map((ingredient, index) => (
                      <li key={index}>{ingredient.trim()}</li>
                    ))
                  : <li>No ingredients available</li>
              }
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Instructions</h3>
            <ol className="list-decimal pl-6 space-y-4">
              {Array.isArray(recipe.instructions) 
                ? recipe.instructions.map((step, index) => (
                    <li key={index} className="pl-2">{step}</li>
                  ))
                : typeof recipe.instructions === 'string'
                  ? recipe.instructions.split('\n').map((step, index) => (
                      <li key={index} className="pl-2">{step.trim()}</li>
                    ))
                  : <li>No instructions available</li>
              }
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}