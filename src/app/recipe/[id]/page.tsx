'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SaveRecipeButton } from '@/components/ui/save-recipe-button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Check, X } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[] | string;
  instructions: string[] | string;
  cookingTimeMinutes?: number;
  difficulty?: string;
  servings?: number;
  tags?: string[];
  imageUrl?: string;
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editableRecipe, setEditableRecipe] = useState<Recipe | null>(null);
  const [editableIngredients, setEditableIngredients] = useState<string>('');
  const [editableInstructions, setEditableInstructions] = useState<string>('');

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
        console.log('Raw recipe data from API:', data.recipe);
        
        // Parse ingredients and instructions if they're JSON strings
        const processedRecipe = {
          ...data.recipe,
          ingredients: parseJsonField(data.recipe.ingredients),
          instructions: parseJsonField(data.recipe.instructions)
        };
        
        console.log('Processed recipe:', processedRecipe);
        setRecipe(processedRecipe);
        
        // Initialize editable recipe with processed data
        setEditableRecipe(processedRecipe);
        
        // Initialize editable ingredients and instructions as strings for the textarea
        setEditableIngredients(
          Array.isArray(processedRecipe.ingredients) 
            ? processedRecipe.ingredients.join('\n') 
            : processedRecipe.ingredients as string
        );
        
        setEditableInstructions(
          Array.isArray(processedRecipe.instructions)
            ? processedRecipe.instructions.join('\n')
            : processedRecipe.instructions as string
        );
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

    // Helper function to parse JSON strings or return the original value
    function parseJsonField(field: any): string[] | string {
      console.log('Parsing field:', field, 'Type:', typeof field);
      
      if (!field) return [];
      
      if (typeof field === 'string') {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(field);
          console.log('Parsed JSON:', parsed);
          
          // Handle the case where parsed is an empty array
          if (Array.isArray(parsed) && parsed.length === 0) {
            return ['No data available'];
          }
          
          return Array.isArray(parsed) ? parsed : [field];
        } catch (e) {
          console.log('JSON parse error:', e);
          // If it's not valid JSON, treat as a single string or comma-separated list
          if (field.includes(',')) {
            return field.split(',').map(item => item.trim());
          } else if (field.trim() === '[]') {
            return ['No data available'];
          } else {
            return [field];
          }
        }
      }
      
      // If it's already an array, return it
      if (Array.isArray(field)) {
        return field.length > 0 ? field : ['No data available'];
      }
      
      // Default case
      return [String(field)];
    }

    if (id) {
      fetchRecipe();
    }
  }, [id, toast]);

  // Function to save edited recipe
  const saveRecipeChanges = async () => {
    if (!editableRecipe) return;
    
    try {
      // Convert ingredients and instructions back to arrays
      const ingredientsArray = editableIngredients
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const instructionsArray = editableInstructions
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const updatedRecipe = {
        ...editableRecipe,
        ingredients: ingredientsArray,
        instructions: instructionsArray
      };
      
      // Make API call to update the recipe
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipe: updatedRecipe }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update recipe');
      }
      
      // Update the state with the edited recipe
      setRecipe(updatedRecipe);
      setIsEditing(false);
      
      toast({
        title: 'Recipe updated',
        description: 'Your changes have been saved.',
      });
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update recipe',
        variant: 'destructive',
      });
    }
  };

  // Function to cancel editing
  const cancelEditing = () => {
    // Reset editable states to original recipe
    if (recipe) {
      setEditableRecipe(recipe);
      setEditableIngredients(
        Array.isArray(recipe.ingredients)
          ? recipe.ingredients.join('\n')
          : recipe.ingredients as string
      );
      setEditableInstructions(
        Array.isArray(recipe.instructions)
          ? recipe.instructions.join('\n')
          : recipe.instructions as string
      );
    }
    setIsEditing(false);
  };

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
            <div className="flex-grow">
              {isEditing ? (
                <Input
                  className="text-2xl font-bold mb-2"
                  value={editableRecipe?.name}
                  onChange={(e) => 
                    setEditableRecipe(prev => prev ? {...prev, name: e.target.value} : null)
                  }
                  placeholder="Recipe Name"
                />
              ) : (
                <CardTitle className="text-3xl mb-2">
                  {recipe?.name && recipe.name !== 'Untitled Recipe' ? recipe.name : 'My Saved Recipe'}
                </CardTitle>
              )}
              
              {isEditing ? (
                <Textarea
                  className="mb-2"
                  value={editableRecipe?.description}
                  onChange={(e) => 
                    setEditableRecipe(prev => prev ? {...prev, description: e.target.value} : null)
                  }
                  placeholder="Recipe Description"
                />
              ) : (
                <CardDescription className="text-lg">
                  {recipe?.description || 'A recipe saved from FridgeChef'}
                </CardDescription>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="icon" onClick={cancelEditing} title="Cancel">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button variant="default" size="icon" onClick={saveRecipeChanges} title="Save Changes">
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} title="Edit Recipe">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <SaveRecipeButton 
                    recipeId={recipe?.id || ''} 
                    recipeName={recipe?.name} 
                    recipeContent={recipe?.description}
                  />
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {recipe?.difficulty && <Badge variant="outline">{recipe.difficulty}</Badge>}
            {recipe?.cookingTimeMinutes && <Badge variant="outline">{recipe.cookingTimeMinutes} mins</Badge>}
            {recipe?.servings && <Badge variant="outline">{recipe.servings} servings</Badge>}
            {recipe?.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </CardHeader>
        
        {recipe?.imageUrl && (
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
            {isEditing ? (
              <Textarea
                className="min-h-[150px]"
                value={editableIngredients}
                onChange={(e) => setEditableIngredients(e.target.value)}
                placeholder="Enter ingredients (one per line)"
              />
            ) : (
              <ul className="list-disc pl-6 space-y-2">
                {Array.isArray(recipe?.ingredients) && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))
                ) : (
                  <li>No ingredients available</li>
                )}
              </ul>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Instructions</h3>
            {isEditing ? (
              <Textarea
                className="min-h-[200px]"
                value={editableInstructions}
                onChange={(e) => setEditableInstructions(e.target.value)}
                placeholder="Enter instructions (one step per line)"
              />
            ) : (
              <ol className="list-decimal pl-6 space-y-4">
                {Array.isArray(recipe?.instructions) && recipe.instructions.length > 0 ? (
                  recipe.instructions.map((step, index) => (
                    <li key={index} className="pl-2">{step}</li>
                  ))
                ) : (
                  <li>No instructions available</li>
                )}
              </ol>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}