'use client'

import { generateRecipe } from '@/ai/flows/generate-recipe';
import { CheckCircle, Utensils, ChevronRight, Clock, Award, BookOpen, Bookmark, ChefHat, Sparkles, Book, Beaker, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Home() {
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState<{
    recipeName: string;
    ingredients: string[];
    instructions: string;
    difficulty?: string;
    cookingTime?: string;
    servings?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateRecipe = async () => {
    if (!ingredients) {
      toast({
        title: "Please enter some ingredients!",
        description: "You need to provide ingredients to generate a recipe.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateRecipe({ ingredients });
      // Enhance the recipe with additional fields for better UI display
      setRecipe({
        ...result,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        cookingTime: `${15 + Math.floor(Math.random() * 45)} minutes`,
        servings: Math.floor(Math.random() * 4) + 2,
      });
    } catch (error: any) {
      console.error("Error generating recipe:", error);
      toast({
        title: "Error generating recipe",
        description: error.message || "Failed to generate a recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetIngredients = () => {
    setIngredients('');
    setRecipe(null);
  };

  const difficultyColor = (difficulty?: string) => {
    if (difficulty === 'easy') return 'bg-green-100 text-green-800';
    if (difficulty === 'medium') return 'bg-yellow-100 text-yellow-800';
    if (difficulty === 'hard') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background Food Pattern - added for consistency with recipe generator page */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80' fill='none'%3E%3Cpath d='M40 10C20 10 10 20 10 40C10 60 20 70 40 70C60 70 70 60 70 40C70 20 60 10 40 10Z' stroke='%23444' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '120px 120px',
      }}></div>
      
      {/* Hero Section with animated background */}
      <div className="relative pt-24 pb-12 md:pt-32 md:pb-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-secondary/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-accent/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container relative mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/20 text-primary mb-6 animate-in fade-in-50 backdrop-blur-sm border border-primary/10">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Turn any ingredients into delicious meals</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-playfair font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 animate-in fade-in-50 slide-in-from-bottom-5">
            Your AI-Powered Kitchen Assistant
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in-50 slide-in-from-bottom-5" style={{ animationDelay: '150ms' }}>
            Enter the ingredients you have, and let FridgeChef create delicious recipes tailored just for you
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-in fade-in-50 slide-in-from-bottom-5" style={{ animationDelay: '300ms' }}>
            <Link href="/recipe-generator">
              <Button size="lg" className="group btn-recipe">
                <span>Start Creating Recipes</span>
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/improve-recipe">
              <Button size="lg" variant="outline" className="border-2">
                <Wand2 className="mr-2 h-5 w-5" />
                <span>Improve a Recipe</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recipe Generator Section */}
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <Card className="shadow-recipe border-2 border-muted card-hover backdrop-blur-sm bg-white/80 dark:bg-black/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
            <div className="flex items-center mb-2">
              <span className="p-1.5 rounded-full bg-primary/10 text-primary mr-2">
                <ChefHat className="h-5 w-5" strokeWidth={2} />
              </span>
              <CardTitle className="text-xl font-playfair">Recipe Generator</CardTitle>
            </div>
            <CardDescription>
              Enter ingredients you have on hand and we'll create a recipe for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Enter ingredients separated by commas (e.g. chicken, rice, tomatoes, onions)"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="min-h-[100px] resize-none border-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-200"
              disabled={isLoading}
            />
            <div className="flex flex-wrap gap-2 mt-4">
              <Button 
                variant="default" 
                onClick={handleGenerateRecipe} 
                disabled={isLoading}
                className="flex-1 sm:flex-none px-6 group btn-recipe"
              >
                {isLoading ? (
                  <>
                    <span className="animate-pulse">Generating...</span>
                    <span className="absolute inset-0 bg-primary/10 animate-progress" />
                  </>
                ) : (
                  <>
                    <Utensils className="mr-2 h-4 w-4" />
                    Generate Recipe
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleResetIngredients}
                disabled={isLoading || (!ingredients && !recipe)}
                className="flex-1 sm:flex-none"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {recipe && (
          <Card className="mt-8 shadow-recipe border-2 border-muted card-hover overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5 backdrop-blur-sm bg-white/80 dark:bg-black/50">
            <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b">
              <div className="absolute top-0 right-0 m-4">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-background/10">
                  <Bookmark className="h-5 w-5" />
                  <span className="sr-only">Save Recipe</span>
                </Button>
              </div>
              <h2 className="text-2xl font-playfair font-bold mb-2">{recipe.recipeName}</h2>
              <div className="flex flex-wrap gap-2 items-center">
                {recipe.difficulty && (
                  <Badge variant="outline" className={cn("capitalize border-2", 
                    recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                    recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  )}>
                    <Award className="mr-1 h-3.5 w-3.5" />
                    {recipe.difficulty}
                  </Badge>
                )}
                {recipe.cookingTime && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-2 dark:bg-blue-900/30 dark:text-blue-300">
                    <Clock className="mr-1 h-3.5 w-3.5" />
                    {recipe.cookingTime}
                  </Badge>
                )}
                {recipe.servings && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-2 dark:bg-purple-900/30 dark:text-purple-300">
                    <Utensils className="mr-1 h-3.5 w-3.5" />
                    Serves {recipe.servings}
                  </Badge>
                )}
              </div>
            </div>

            <Tabs defaultValue="ingredients" className="p-6">
              <TabsList className="mb-4">
                <TabsTrigger value="ingredients" className="font-medium">Ingredients</TabsTrigger>
                <TabsTrigger value="instructions" className="font-medium">Instructions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ingredients" className="space-y-4 mt-2">
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start py-1 border-b border-dashed border-muted">
                      <CheckCircle className="h-4.5 w-4.5 text-primary mt-0.5 flex-shrink-0 mr-3" />
                      <span className="text-muted-foreground">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="instructions" className="mt-2">
                <div className="prose prose-sm max-w-none">
                  {recipe.instructions.split('\n').map((instruction, index) => (
                    instruction.trim() && (
                      <div key={index} className="flex gap-3 mb-4">
                        <span className="font-bold text-primary/70 min-w-6 text-center">{index+1}.</span>
                        <span className="text-muted-foreground">{instruction}</span>
                      </div>
                    )
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <CardFooter className="bg-muted/20 py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
              <div className="text-sm text-muted-foreground">
                Want to improve this recipe?
              </div>
              <Link href={`/improve-recipe?recipe=${encodeURIComponent(JSON.stringify(recipe))}`}>
                <Button variant="default" size="sm" className="group btn-recipe flex items-center">
                  <span>Customize Recipe</span>
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}
        
        {/* Feature grid section */}
        {!recipe && (
          <div className="mt-16 mb-8">
            <h2 className="text-2xl font-playfair font-bold text-center mb-8">More Ways to Cook With FridgeChef</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-recipe border-2 border-muted card-hover backdrop-blur-sm bg-white/80 dark:bg-black/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                  <CardTitle className="flex items-center text-lg font-playfair">
                    <span className="p-1.5 rounded-full bg-primary/10 text-primary mr-2">
                      <Book className="h-4 w-4" strokeWidth={2} />
                    </span>
                    Multiple Recipes
                  </CardTitle>
                  <CardDescription>
                    Get multiple recipe options from your ingredients
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-4">
                  <Link href="/recipe-generator?mode=multiple" className="w-full">
                    <Button variant="default" className="w-full group">
                      Try Multiple Recipes
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card className="shadow-recipe border-2 border-muted card-hover backdrop-blur-sm bg-white/80 dark:bg-black/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-secondary/5 to-primary/5 border-b">
                  <CardTitle className="flex items-center text-lg font-playfair">
                    <span className="p-1.5 rounded-full bg-secondary/10 text-secondary mr-2">
                      <Beaker className="h-4 w-4" strokeWidth={2} />
                    </span>
                    Improve Recipe
                  </CardTitle>
                  <CardDescription>
                    Customize and enhance your existing recipes
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-4">
                  <Link href="/improve-recipe" className="w-full">
                    <Button variant="default" className="w-full group">
                      Improve Your Recipe
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card className="shadow-recipe border-2 border-muted card-hover backdrop-blur-sm bg-white/80 dark:bg-black/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-accent/5 to-secondary/5 border-b">
                  <CardTitle className="flex items-center text-lg font-playfair">
                    <span className="p-1.5 rounded-full bg-accent/10 text-accent mr-2">
                      <BookOpen className="h-4 w-4" strokeWidth={2} />
                    </span>
                    Recipe Collection
                  </CardTitle>
                  <CardDescription>
                    Browse our collection of AI-generated recipes
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-4">
                  <Button variant="default" className="w-full opacity-80" disabled>
                    Coming Soon
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
