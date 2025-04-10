'use client'

import { generateRecipe } from '@/ai/flows/generate-recipe';
import { CheckCircle, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function Home() {
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState<{
    recipeName: string;
    ingredients: string[];
    instructions: string;
  } | null>(null);

  const handleGenerateRecipe = async () => {
    if (!ingredients) {
      toast({
        title: "Please enter some ingredients!",
        description: "You need to provide ingredients to generate a recipe.",
      });
      return;
    }

    try {
      const result = await generateRecipe({ ingredients });
      setRecipe(result);
    } catch (error: any) {
      console.error("Error generating recipe:", error);
      toast({
        title: "Error generating recipe",
        description: error.message || "Failed to generate a recipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetIngredients = () => {
    setIngredients('');
    setRecipe(null);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8 px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
        <Utensils className="inline-block mr-2" size={40} />
        Fridge Chef
      </h1>
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* Ingredient Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="ingredients" className="text-lg font-semibold">
            Enter Ingredients:
          </label>
          <Input
            type="text"
            id="ingredients"
            placeholder="e.g., chicken, rice, broccoli"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleResetIngredients}>
              Reset
            </Button>
            <Button onClick={handleGenerateRecipe}>
              Generate Recipe
            </Button>
          </div>
        </div>

        {/* Recipe Display */}
        {recipe && (
          <Card>
            <CardHeader>
              <CardTitle>{recipe.recipeName}</CardTitle>
              <CardDescription>A delicious recipe generated just for you!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">Ingredients:</h3>
              </div>
              <ul className="list-disc pl-5">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={16} />
                    {ingredient}
                  </li>
                ))}
              </ul>
              <div>
                <h3 className="text-xl font-semibold">Instructions:</h3>
                <Textarea
                  readOnly
                  value={recipe.instructions}
                  className="mt-2 min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

