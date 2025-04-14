'use client'

import { combinedRecipeGenerator } from '@/ai/flows/combined-recipe-generator';
import { CheckCircle, Utensils, ChevronRight, Clock, Award, BookOpen, Settings, Filter, Loader2, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SaveRecipeButton } from '@/components/ui/save-recipe-button';
import { v4 as uuidv4 } from 'uuid';  // Add this import for UUID generation

export default function CombinedRecipeGenerator() {
  // Get session data for personalization
  const { data: session, status } = useSession();
  
  // State for the form inputs
  const [ingredients, setIngredients] = useState('');
  const [generatorMode, setGeneratorMode] = useState<'single' | 'multiple'>('single');
  const [count, setCount] = useState(3);
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [allergies, setAllergies] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Advanced options state
  const [cuisineType, setCuisineType] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // State for user preferences
  const [userPreferences, setUserPreferences] = useState<{
    dietaryPreferences?: string;
    allergies?: string;
  }>({});
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [usePersonalPreferences, setUsePersonalPreferences] = useState(true);
  
  // State for the recipes
  const [recipes, setRecipes] = useState<Array<{
    id: string;          // Add ID property to the recipe type
    recipeName: string;
    description?: string;
    cookingTime?: string;
    difficulty?: string;
    ingredients: string[];
    instructions: string[];
  }>>([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user preferences when session is available
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (session?.user?.id) {
        setIsLoadingPreferences(true);
        try {
          const response = await fetch(`/api/user/preferences?userId=${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserPreferences({
              dietaryPreferences: data.dietaryPreferences || '',
              allergies: data.allergies || '',
            });
            
            // If we have user preferences and they want to use them, set the form values
            if (usePersonalPreferences) {
              setDietaryPreferences(data.dietaryPreferences || '');
              // Add allergies to additional notes if they exist
              if (data.allergies) {
                setAdditionalNotes(prev => {
                  const allergyNote = `Please avoid these allergens: ${data.allergies}`;
                  return prev ? `${prev}\n${allergyNote}` : allergyNote;
                });
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user preferences:', error);
          toast({
            title: "Couldn't load preferences",
            description: "We couldn't load your personal preferences. Using default settings.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingPreferences(false);
        }
      }
    };

    fetchUserPreferences();
  }, [session, usePersonalPreferences]);

  const handleGenerateRecipe = async () => {
    if (!ingredients) {
      toast({
        title: "Please enter some ingredients!",
        description: "You need to provide ingredients to generate a recipe.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Properly format ingredients and ensure it's a clean string
      const cleanIngredients = ingredients.trim();
      
      if (cleanIngredients.length === 0) {
        toast({
          title: "Please enter some ingredients!",
          description: "You need to provide ingredients to generate a recipe.",
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Starting recipe generation with ingredients:", cleanIngredients);
      
      // Combine user allergies with additional notes if using personal preferences
      let combinedNotes = additionalNotes;
      if (usePersonalPreferences && userPreferences.allergies && !additionalNotes.includes(userPreferences.allergies)) {
        combinedNotes = combinedNotes 
          ? `${combinedNotes}\nPlease avoid these allergens: ${userPreferences.allergies}`
          : `Please avoid these allergens: ${userPreferences.allergies}`;
      }

      const result = await combinedRecipeGenerator({ 
        ingredients: cleanIngredients,  // Pass as string, the function now handles both formats
        mode: generatorMode,
        count: generatorMode === 'multiple' ? count : undefined,
        dietaryPreferences: dietaryPreferences || undefined,
        // Include advanced options when available
        cuisineType: cuisineType || undefined,
        difficultyLevel: difficultyLevel || undefined,
        additionalNotes: combinedNotes || undefined
      });
      
      // Add unique IDs to each recipe
      const recipesWithIds = result.recipes.map(recipe => ({
        ...recipe,
        id: uuidv4()  // Generate a unique ID for each recipe
      }));
      
      setRecipes(recipesWithIds);
      setActiveRecipeIndex(0); // Reset to first recipe
    } catch (error: any) {
      console.error("Error generating recipe:", error);
      setError(error.message || "An unexpected error occurred while generating your recipe.");
      toast({
        title: "Error generating recipe",
        description: error.message || "Failed to generate a recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setIngredients('');
    setDietaryPreferences('');
    setRecipes([]);
    setAdditionalNotes('');
    
    // Reset preferences to user defaults if logged in and use personal preferences is enabled
    if (session?.user?.id && usePersonalPreferences) {
      setDietaryPreferences(userPreferences.dietaryPreferences || '');
      // Add allergies to additional notes if they exist
      if (userPreferences.allergies) {
        setAdditionalNotes(`Please avoid these allergens: ${userPreferences.allergies}`);
      }
    }
  };

  // Handle the missing handler for improving a recipe
  const handleImproveRecipe = (index: number) => {
    // Get the recipe to improve
    const recipeToImprove = recipes[index];
    
    // Redirect to the improve-recipe page with the recipe data
    const recipeData = encodeURIComponent(JSON.stringify(recipeToImprove));
    window.location.href = `/improve-recipe?recipe=${recipeData}`;
  };

  // Handle the missing handler for selecting a recipe
  const handleSelectRecipe = (index: number) => {
    // Set the active recipe index
    setActiveRecipeIndex(index);
    
    // Optional: Scroll to the selected recipe or highlight it
    toast({
      title: "Recipe selected",
      description: `You've selected "${recipes[index].recipeName}"`,
    });
  };

  // Toggle personal preferences usage
  const handleTogglePersonalPreferences = (value: boolean) => {
    setUsePersonalPreferences(value);
    
    // If turning on personal preferences and we have them, apply them
    if (value && userPreferences) {
      setDietaryPreferences(userPreferences.dietaryPreferences || '');
      // Add allergies to additional notes if they exist
      if (userPreferences.allergies) {
        setAdditionalNotes(prev => {
          const allergyNote = `Please avoid these allergens: ${userPreferences.allergies}`;
          return prev && !prev.includes(allergyNote) ? `${prev}\n${allergyNote}` : allergyNote;
        });
      }
    }
  };

  return (
    <main className="flex flex-col items-center py-12 px-4 md:py-16 lg:py-20 min-h-screen bg-gradient-to-b from-secondary/20 to-background relative">
      {/* Background Food Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80' fill='none'%3E%3Cpath d='M40 10C20 10 10 20 10 40C10 60 20 70 40 70C60 70 70 60 70 40C70 20 60 10 40 10Z' stroke='%23444' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '120px 120px',
      }}></div>

      <div className="container max-w-4xl relative">
        <h1 className="text-4xl md:text-5xl font-playfair font-bold text-center mb-3 text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
          FridgeChef Recipe Generator
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          Turn whatever ingredients you have into delicious recipes crafted just for you
        </p>
        
        {/* Personal preferences badge for logged-in users */}
        {status === 'authenticated' && (
          <div className="mb-6 flex justify-center">
            <Alert variant="outline" className="max-w-md bg-primary/5 border-primary/30">
              <User className="h-4 w-4 text-primary" />
              <AlertTitle>Personal preferences available</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <p>Would you like to use your personal preferences for recipe generation?</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Use my preferences</span>
                  <Switch 
                    checked={usePersonalPreferences}
                    onCheckedChange={handleTogglePersonalPreferences}
                    disabled={isLoadingPreferences}
                  />
                </div>
                {!userPreferences.dietaryPreferences && !userPreferences.allergies && (
                  <p className="text-xs text-muted-foreground italic">
                    You haven't set your preferences yet. 
                    <Link href="/profile" className="ml-1 underline text-primary hover:text-primary/80">
                      Set them in your profile
                    </Link>.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <Card className="shadow-recipe border-2 card-hover backdrop-blur-sm bg-white/80 dark:bg-black/50">
          <CardHeader className="pb-0 border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="text-2xl font-playfair font-bold flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-primary/10 text-primary">
                <Utensils className="h-6 w-6" strokeWidth={2} />
              </span>
              Create Your Recipe
            </CardTitle>
            <CardDescription className="text-base pb-4">
              Enter ingredients you have on hand, and we'll generate the perfect recipe for you.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8">
            {/* Generator Mode Selection */}
            <div className="mb-8">
              <Label className="text-base font-medium mb-3 block">Generator Mode</Label>
              <RadioGroup 
                value={generatorMode} 
                onValueChange={(value) => setGeneratorMode(value as 'single' | 'multiple')}
                className="flex flex-wrap gap-4 mt-3"
              >
                <div className={`flex-1 min-w-[140px] flex items-center space-x-2 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all duration-200 ${generatorMode === 'single' ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-muted hover:border-primary/30'}`}>
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="cursor-pointer font-medium text-base w-full">Single Recipe</Label>
                </div>
                <div className={`flex-1 min-w-[140px] flex items-center space-x-2 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all duration-200 ${generatorMode === 'multiple' ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-muted hover:border-primary/30'}`}>
                  <RadioGroupItem value="multiple" id="multiple" />
                  <Label htmlFor="multiple" className="cursor-pointer font-medium text-base w-full">Multiple Recipes</Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground mt-3 ml-1">
                {generatorMode === 'single' 
                  ? 'Generate one detailed recipe option with step-by-step instructions' 
                  : 'Generate multiple recipe options to choose from based on your ingredients'}
              </p>
            </div>
            
            {/* Ingredients Input */}
            <div className="mb-8">
              <Label htmlFor="ingredients" className="text-base font-medium flex items-center gap-2 mb-3">
                <span>What's in your fridge?</span>
                <Badge variant="outline" className="text-xs font-normal bg-secondary/30 text-secondary-foreground">required</Badge>
              </Label>
              <div className="relative mt-1 group">
                <Textarea
                  id="ingredients"
                  placeholder="e.g., chicken, rice, broccoli, garlic, soy sauce, olive oil..."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="min-h-32 resize-none border-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-200 text-base"
                />
                <Button 
                  size="sm"
                  variant="secondary"
                  className="absolute right-3 top-3 opacity-80 hover:opacity-100"
                  onClick={() => setIngredients('')}
                >
                  Clear
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 ml-1 italic">
                Separate ingredients with commas. The more specific you are, the better your recipe will be.
              </p>
            </div>
            
            {/* Dietary Preferences */}
            <div className="mb-8">
              <Label htmlFor="preferences" className="text-base font-medium mb-3 block">
                Dietary Preferences or Restrictions
              </Label>
              <div className="relative mt-1">
                <Select
                  value={dietaryPreferences}
                  onValueChange={setDietaryPreferences}
                  disabled={isLoadingPreferences}
                >
                  <SelectTrigger className="border-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-200">
                    <SelectValue placeholder="Select dietary preferences" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">No specific diet</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="keto">Ketogenic</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                      <SelectItem value="gluten-free">Gluten Free</SelectItem>
                      <SelectItem value="low-carb">Low Carb</SelectItem>
                      <SelectItem value="dairy-free">Dairy Free</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground mt-2 ml-1 italic">
                {status === 'authenticated' && usePersonalPreferences && userPreferences.dietaryPreferences
                  ? `Using your preferred diet: ${userPreferences.dietaryPreferences}`
                  : 'Optional: Include any dietary restrictions or preferences to customize your recipe.'
                }
              </p>
            </div>

            {/* Advanced Options Accordion */}
            <Accordion type="single" collapsible className="mb-8">
              <AccordionItem value="advanced-options" className="border-muted">
                <AccordionTrigger className="py-3 hover:text-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Advanced Options</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-5 px-1 bg-muted/20 rounded-md mt-2 border border-dashed">
                  {/* Cuisine Type */}
                  <div className="mb-6 px-3">
                    <Label htmlFor="cuisine" className="text-sm font-medium">
                      Cuisine Type
                    </Label>
                    <Select
                      value={cuisineType}
                      onValueChange={setCuisineType}
                    >
                      <SelectTrigger className="mt-2 border-2 focus:ring-1 focus:border-primary">
                        <SelectValue placeholder="Any cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any cuisine</SelectItem>
                        <SelectItem value="italian">Italian</SelectItem>
                        <SelectItem value="mexican">Mexican</SelectItem>
                        <SelectItem value="chinese">Chinese</SelectItem>
                        <SelectItem value="indian">Indian</SelectItem>
                        <SelectItem value="japanese">Japanese</SelectItem>
                        <SelectItem value="mediterranean">Mediterranean</SelectItem>
                        <SelectItem value="thai">Thai</SelectItem>
                        <SelectItem value="american">American</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Difficulty Level */}
                  <div className="mb-6 px-3">
                    <Label className="text-sm font-medium">Difficulty Level</Label>
                    <div className="flex items-center gap-3 mt-3">
                      <Slider
                        defaultValue={[difficultyLevel]}
                        min={1}
                        max={3}
                        step={1}
                        onValueChange={(values) => setDifficultyLevel(values[0])}
                        className="max-w-xs"
                      />
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium min-w-[90px] text-center ${
                        difficultyLevel === 1 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                          : difficultyLevel === 2 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                      }`}>
                        {difficultyLevel === 1 ? 'Easy' : difficultyLevel === 2 ? 'Medium' : 'Hard'}
                      </span>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="px-3">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Any specific instructions or preferences..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="mt-2 resize-none min-h-20 border-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                    />
                    {status === 'authenticated' && usePersonalPreferences && userPreferences.allergies && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Including your allergy information: {userPreferences.allergies}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Error or Loading State */}
            {error && (
              <Alert variant="destructive" className="mb-6 animate-in fade-in-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Generate Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGenerateRecipe}
                disabled={!ingredients.trim() || isLoading}
                className="w-full font-medium text-base py-6 group btn-recipe"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="animate-pulse">Cooking up your recipe...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">Generate Recipe</span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
              
              {/* Reset Button - only show if there are inputs */}
              {(ingredients || dietaryPreferences || additionalNotes || cuisineType !== '') && (
                <Button
                  onClick={handleResetForm}
                  variant="outline"
                  className="w-full sm:max-w-[120px]"
                  disabled={isLoading}
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Display Generated Recipe(s) */}
        {recipes.length > 0 && (
          <div className="mt-16 space-y-10 animate-in fade-in-50 slide-in-from-bottom-10">
            <h2 className="text-3xl font-playfair font-bold text-center mb-8">
              {generatorMode === 'single' ? 'Your Recipe' : 'Your Recipe Options'}
            </h2>

            {recipes.map((recipe, index) => (
              <Card key={index} className="shadow-recipe overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-5 border-b">
                  <h3 className="text-2xl font-playfair font-bold">{recipe.recipeName}</h3>
                  {recipe.description && (
                    <p className="text-muted-foreground mt-1">{recipe.description}</p>
                  )}
                </div>
                
                <CardContent className="pt-8 pb-6">
                  <div className="flex flex-wrap gap-3 mb-8">
                    <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 border-2 bg-secondary/10 text-secondary-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {recipe.cookingTime || '30-45 minutes'}
                    </Badge>
                    <Badge variant="outline" className={`flex items-center gap-1 px-3 py-1 border-2 ${
                      difficultyLevel === 1 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                        : difficultyLevel === 2 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    }`}>
                      <Award className="h-3.5 w-3.5" />
                      {recipe.difficulty || (difficultyLevel === 1 ? 'Easy' : difficultyLevel === 2 ? 'Medium' : 'Hard')}
                    </Badge>
                    {cuisineType && cuisineType !== 'any' && (
                      <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 border-2 bg-primary/10 text-primary">
                        <BookOpen className="h-3.5 w-3.5" />
                        {cuisineType.charAt(0).toUpperCase() + cuisineType.slice(1)}
                      </Badge>
                    )}
                    {dietaryPreferences && dietaryPreferences !== 'none' && (
                      <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 border-2 bg-accent/10 text-accent-foreground">
                        <Filter className="h-3.5 w-3.5" />
                        {dietaryPreferences.charAt(0).toUpperCase() + dietaryPreferences.slice(1)}
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
                        {recipe.ingredients.map((ingredient, i) => (
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
                        {recipe.instructions.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="font-bold text-primary/70 min-w-6 text-center">{i+1}.</span>
                            <span className="text-muted-foreground">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  
                  {recipe.notes && (
                    <div className="mt-8 p-4 bg-secondary/10 rounded-lg border border-dashed border-secondary/30">
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-secondary-foreground">
                        <BookOpen className="h-4 w-4" />
                        Chef's Notes
                      </h4>
                      <p className="text-muted-foreground italic">{recipe.notes}</p>
                    </div>
                  )}
                </CardContent>
                
                <div className="px-6 py-4 bg-muted/20 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground w-full sm:w-auto"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Back to Top
                  </Button>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    {generatorMode === 'multiple' && (
                      <Button 
                        variant="outline"
                        onClick={() => handleSelectRecipe(index)}
                        className="flex items-center gap-2 flex-1 sm:flex-auto"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Select</span>
                      </Button>
                    )}
                    <Button 
                      variant="default"
                      onClick={() => handleImproveRecipe(index)}
                      className="btn-recipe flex items-center gap-2 flex-1 sm:flex-auto"
                    >
                      <span>Improve Recipe</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <SaveRecipeButton recipe={recipe} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}