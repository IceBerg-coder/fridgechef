"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Clock, ChefHat, Trash2, Search, Filter, ArrowUpDown, Utensils, Heart, CheckCircle, Award, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Recipe {
  id: string;
  name: string;
  recipeName?: string; // For compatibility with generated recipes
  description?: string;
  ingredients: string; // This is actually a JSON string in the database
  instructions: string; // This is actually a JSON string in the database
  cookingTime?: string | number;
  difficulty?: string;
  image?: string;
  tags?: string;
  cuisineType?: string;
  dietaryPreferences?: string;
}

interface ProcessedRecipe {
  id: string;
  name: string;
  recipeName?: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  cookingTime?: string | number;
  difficulty?: string;
  image?: string;
  tags?: string[];
  cuisineType?: string;
  dietaryPreferences?: string;
  // Add more fields that may be in the generated recipes
}

export default function SavedRecipesPage() {
  const { data: session, status } = useSession();
  const [recipes, setRecipes] = useState<ProcessedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [selectedRecipe, setSelectedRecipe] = useState<ProcessedRecipe | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
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
        let tagsArray: string[] = [];
        let recipeContent: any = null;
        
        // Try to parse ingredients
        try {
          ingredientsArray = typeof recipe.ingredients === 'string' 
            ? JSON.parse(recipe.ingredients) 
            : (Array.isArray(recipe.ingredients) ? recipe.ingredients : []);
        } catch (error) {
          console.error('Error parsing ingredients', error);
          ingredientsArray = [String(recipe.ingredients)];
        }
        
        // Try to parse instructions
        try {
          instructionsArray = typeof recipe.instructions === 'string'
            ? JSON.parse(recipe.instructions)
            : (Array.isArray(recipe.instructions) ? recipe.instructions : []);
        } catch (error) {
          console.error('Error parsing instructions', error);
          instructionsArray = [String(recipe.instructions)];
        }
        
        // Try to parse tags
        try {
          tagsArray = typeof recipe.tags === 'string'
            ? JSON.parse(recipe.tags)
            : (Array.isArray(recipe.tags) ? recipe.tags : []);
        } catch (error) {
          tagsArray = [];
        }
        
        // Try to parse more data from description if it might contain JSON
        if (recipe.description && recipe.description.startsWith('{')) {
          try {
            recipeContent = JSON.parse(recipe.description);
          } catch (e) {
            // Not JSON, use as-is
          }
        }
        
        return {
          ...recipe,
          // Use recipeName if available (from generator) or fall back to name
          name: recipe.recipeName || recipe.name,
          ingredients: ingredientsArray,
          instructions: instructionsArray,
          tags: tagsArray,
          ...(recipeContent || {}), // Spread any additional properties from recipeContent
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
      
      // If we're viewing the recipe we just unsaved, go back to grid view
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
        setViewMode('grid');
      }
      
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
  
  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      recipe.name?.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query)) ||
      (recipe.tags && recipe.tags.some(tag => tag?.toLowerCase()?.includes(query)))
    );
  });
  
  // Sort recipes based on current sort order
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    if (sortOrder === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortOrder === 'oldest') {
      return 0; // Would use created date if available
    } else {
      return 0; // Default newest first, would use created date if available
    }
  });

  const viewRecipe = (recipe: ProcessedRecipe) => {
    setSelectedRecipe(recipe);
    setViewMode('detail');
    // Scroll to top when viewing a recipe
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToGrid = () => {
    setSelectedRecipe(null);
    setViewMode('grid');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-gradient-to-b from-secondary/20 to-background min-h-[calc(100vh-64px)]">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 font-playfair bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">My Saved Recipes</h1>
          
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading your culinary collection...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-secondary/20 to-background min-h-[calc(100vh-64px)]">
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 font-playfair bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">My Saved Recipes</h1>
            <p className="text-muted-foreground">Your personal collection of culinary inspirations</p>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <BookmarkCheck className="h-5 w-5 mr-2" />
            <span>{recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'} Saved</span>
          </div>
        </div>
        
        {/* Single recipe detail view */}
        {viewMode === 'detail' && selectedRecipe && (
          <div className="mt-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-10">
            <Button
              variant="outline"
              onClick={backToGrid}
              className="mb-6"
            >
              ← Back to All Recipes
            </Button>
            
            <Card className="shadow-recipe overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-5 border-b">
                <h3 className="text-2xl font-playfair font-bold">{selectedRecipe.name || selectedRecipe.recipeName}</h3>
                {selectedRecipe.description && (
                  <p className="text-muted-foreground mt-1">{selectedRecipe.description}</p>
                )}
              </div>
              
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-wrap gap-3 mb-8">
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 border-2 bg-secondary/10 text-secondary-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedRecipe.cookingTime || '30-45 minutes'}
                  </Badge>
                  <Badge variant="outline" className={`flex items-center gap-1 px-3 py-1 border-2 ${
                    !selectedRecipe.difficulty || selectedRecipe.difficulty === 'Easy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                      : selectedRecipe.difficulty === 'Medium' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}>
                    <Award className="h-3.5 w-3.5" />
                    {selectedRecipe.difficulty || 'Easy'}
                  </Badge>
                  {selectedRecipe.cuisineType && (
                    <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 border-2 bg-primary/10 text-primary">
                      <BookOpen className="h-3.5 w-3.5" />
                      {selectedRecipe.cuisineType.charAt(0).toUpperCase() + selectedRecipe.cuisineType.slice(1)}
                    </Badge>
                  )}
                  {selectedRecipe.dietaryPreferences && (
                    <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 border-2 bg-accent/10 text-accent-foreground">
                      <Filter className="h-3.5 w-3.5" />
                      {selectedRecipe.dietaryPreferences.charAt(0).toUpperCase() + selectedRecipe.dietaryPreferences.slice(1)}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-playfair font-bold text-lg mb-3 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mr-2 text-secondary-foreground">
                        <span className="text-sm">1</span>
                      </span>
                      Ingredients
                    </h4>
                    <ul className="space-y-2 pl-2">
                      {selectedRecipe.ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start gap-2 py-1 border-b border-dashed border-muted">
                          <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-6 md:mt-0">
                    <h4 className="font-playfair font-bold text-lg mb-3 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 text-primary-foreground">
                        <span className="text-sm">2</span>
                      </span>
                      Instructions
                    </h4>
                    <ol className="space-y-4 pl-2">
                      {selectedRecipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="font-bold text-primary/70 min-w-6 text-center">{i+1}.</span>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </CardContent>
              
              <div className="px-6 py-4 bg-muted/20 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground w-full sm:w-auto"
                  onClick={backToGrid}
                >
                  Back to All Recipes
                </Button>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button 
                    variant="destructive"
                    onClick={() => unsaveRecipe(selectedRecipe.id)}
                    className="flex items-center gap-2 flex-1 sm:flex-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove Recipe</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Grid view of all recipes */}
        {viewMode === 'grid' && (
          <>
            {/* Search and filter section */}
            {recipes.length > 0 && (
              <div className="mb-8">
                <Card className="border-2 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, ingredient, or tag..."
                          className="pl-10 border-2"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setSortOrder(sortOrder === 'alphabetical' ? 'newest' : 'alphabetical')}
                          className="border-2"
                          title="Sort recipes"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={() => setSearchQuery('')} 
                          className="border-2"
                          disabled={!searchQuery}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    {searchQuery && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        Found {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} matching "{searchQuery}"
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Recipe grid or empty state */}
            {recipes.length === 0 ? (
              <Card className="border-2 shadow-lg bg-card/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <BookmarkCheck className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">No saved recipes yet</h2>
                  <p className="text-muted-foreground text-center max-w-md mb-8">
                    Start saving your favorite recipes to build your personal cookbook collection
                  </p>
                  <Button 
                    onClick={() => router.push('/recipe-generator')}
                    size="lg"
                    className="gap-2"
                  >
                    <ChefHat className="h-4 w-4" />
                    Generate Recipes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sortedRecipes.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No matching recipes found</h2>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search query
                  </p>
                  <Button onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedRecipes.map((recipe) => (
                    <Card 
                      key={recipe.id} 
                      className="flex flex-col h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group relative bg-card/60 backdrop-blur-sm"
                    >
                      <div className="absolute top-3 right-3 z-10">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            unsaveRecipe(recipe.id);
                          }}
                          title="Remove from saved recipes"
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>

                      <div 
                        className="h-36 bg-muted relative overflow-hidden rounded-t-md cursor-pointer"
                        onClick={() => viewRecipe(recipe)}
                      >
                        {recipe.image ? (
                          <img 
                            src={recipe.image} 
                            alt={recipe.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <ChefHat className="h-10 w-10 text-primary/40" />
                          </div>
                        )}
                      </div>
                      
                      <CardHeader className="pb-2">
                        <CardTitle 
                          className="line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => viewRecipe(recipe)}
                        >
                          {recipe.name || 'My Saved Recipe'}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {recipe.description || 'A delicious recipe saved from FridgeChef'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="flex-grow">
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-2 flex items-center">
                            <Utensils className="h-3.5 w-3.5 text-primary mr-1.5" /> 
                            Ingredients:
                          </div>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                              <li key={index} className="line-clamp-1">{ingredient}</li>
                            ))}
                            {recipe.ingredients.length > 3 && (
                              <li className="text-xs text-muted-foreground italic">
                                +{recipe.ingredients.length - 3} more ingredients
                              </li>
                            )}
                          </ul>
                        </div>
                        
                        {/* Recipe badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {recipe.difficulty && (
                            <Badge variant="outline" className={`text-xs ${
                              recipe.difficulty === 'Easy'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                : recipe.difficulty === 'Medium' 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            }`}>
                              {recipe.difficulty}
                            </Badge>
                          )}
                          
                          {recipe.cuisineType && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                              {recipe.cuisineType}
                            </Badge>
                          )}
                          
                          {recipe.dietaryPreferences && (
                            <Badge variant="secondary" className="text-xs bg-secondary/10">
                              {recipe.dietaryPreferences}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3.5 w-3.5" />
                          <span>{recipe.cookingTime ? `${recipe.cookingTime}` : 'Time not specified'}</span>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-0">
                        <Button 
                          variant="default"
                          className="w-full btn-recipe"
                          onClick={() => viewRecipe(recipe)}
                        >
                          View Full Recipe
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}