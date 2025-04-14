'use client'

import { useState, useEffect } from 'react';
import { improveRecipe } from '@/ai/flows/improve-recipe';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Send, ChevronRight, Settings, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ImproveRecipePage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  // Main recipe state
  const [recipeText, setRecipeText] = useState('');
  const [improvementRequest, setImprovementRequest] = useState('');
  const [improvedRecipe, setImprovedRecipe] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<{
    dietaryPreferences?: string;
    allergies?: string;
  }>({});
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [usePersonalPreferences, setUsePersonalPreferences] = useState(true);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Parse recipe from URL params when component mounts
  useEffect(() => {
    const recipeParam = searchParams.get('recipe');
    if (recipeParam) {
      try {
        const recipeData = JSON.parse(decodeURIComponent(recipeParam));
        
        // Format the recipe data into a text representation
        let formattedRecipe = `Recipe: ${recipeData.recipeName}\n\n`;
        
        if (recipeData.description) {
          formattedRecipe += `Description: ${recipeData.description}\n\n`;
        }
        
        formattedRecipe += 'Ingredients:\n';
        if (Array.isArray(recipeData.ingredients)) {
          recipeData.ingredients.forEach((ingredient: string, index: number) => {
            formattedRecipe += `${index + 1}. ${ingredient}\n`;
          });
        } else if (typeof recipeData.ingredients === 'string') {
          formattedRecipe += `${recipeData.ingredients}\n`;
        }
        
        formattedRecipe += '\nInstructions:\n';
        if (Array.isArray(recipeData.instructions)) {
          recipeData.instructions.forEach((instruction: string, index: number) => {
            formattedRecipe += `${index + 1}. ${instruction}\n`;
          });
        } else if (typeof recipeData.instructions === 'string') {
          formattedRecipe += `${recipeData.instructions}\n`;
        }
        
        setRecipeText(formattedRecipe);
      } catch (e) {
        console.error('Failed to parse recipe from URL', e);
        toast({
          title: "Couldn't load recipe",
          description: "There was an error loading the recipe. Please enter your recipe manually.",
          variant: "destructive",
        });
      }
    }
  }, [searchParams, toast]);

  // Fetch user preferences when session is available
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (session?.user && 'email' in session.user) {
        setIsLoadingPreferences(true);
        try {
          const response = await fetch(`/api/user/preferences?email=${encodeURIComponent(session.user.email || '')}`);
          if (response.ok) {
            const data = await response.json();
            setUserPreferences({
              dietaryPreferences: data.dietaryPreferences || '',
              allergies: data.allergies || '',
            });
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
  }, [session, toast]);

  // Handle recipe improvement
  const handleImproveRecipe = async () => {
    if (!recipeText) {
      toast({
        title: "Recipe text is required",
        description: "Please enter a recipe to improve.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setImprovedRecipe('');

    try {
      // Add user preferences to the improvement request if enabled
      let fullRequest = improvementRequest;
      
      if (usePersonalPreferences && session?.user?.email) {
        if (userPreferences.dietaryPreferences && !fullRequest.toLowerCase().includes(userPreferences.dietaryPreferences.toLowerCase())) {
          fullRequest += fullRequest 
            ? `\nPlease follow my dietary preference: ${userPreferences.dietaryPreferences}.` 
            : `Follow my dietary preference: ${userPreferences.dietaryPreferences}.`;
        }
        
        if (userPreferences.allergies && !fullRequest.toLowerCase().includes(userPreferences.allergies.toLowerCase())) {
          fullRequest += fullRequest 
            ? `\nPlease make sure to avoid these allergens: ${userPreferences.allergies}.`
            : `Make sure to avoid these allergens: ${userPreferences.allergies}.`;
        }
      }

      const result = await improveRecipe({
        recipeText,
        improvementRequest: fullRequest || 'Make this recipe better.'
      });

      setImprovedRecipe(result.refinedRecipe);
    } catch (error: any) {
      console.error('Error improving recipe:', error);
      setError(error.message || 'Failed to improve the recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle personal preferences usage
  const handleTogglePersonalPreferences = (value: boolean) => {
    setUsePersonalPreferences(value);
  };

  return (
    <main className="flex flex-col items-center py-12 px-4 md:py-16 lg:py-20 min-h-screen bg-gradient-to-b from-secondary/20 to-background relative">
      {/* Background Food Pattern - Same as recipe generator */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80' fill='none'%3E%3Cpath d='M40 10C20 10 10 20 10 40C10 60 20 70 40 70C60 70 70 60 70 40C70 20 60 10 40 10Z' stroke='%23444' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '120px 120px',
      }}></div>

      <div className="container max-w-4xl relative">
        <Link href="/recipe-generator" className="flex items-center text-muted-foreground gap-1 hover:text-primary mb-8 w-fit">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Recipe Generator</span>
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-playfair font-bold text-center mb-3 text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
          Recipe Enhancer
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          Transform your existing recipes into something even more delicious
        </p>
        
        {/* Personal preferences alert for logged-in users */}
        {status === 'authenticated' && (
          <div className="mb-6">
            <Alert className="max-w-md mx-auto bg-primary/5 border-primary/30">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Personal preferences available</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Use my preferences</span>
                  <Switch 
                    checked={usePersonalPreferences}
                    onCheckedChange={handleTogglePersonalPreferences}
                    disabled={isLoadingPreferences}
                  />
                </div>
                {usePersonalPreferences && (
                  <div className="text-xs text-muted-foreground">
                    {userPreferences.dietaryPreferences && (
                      <p>Diet: {userPreferences.dietaryPreferences}</p>
                    )}
                    {userPreferences.allergies && (
                      <p>Allergies: {userPreferences.allergies}</p>
                    )}
                    {!userPreferences.dietaryPreferences && !userPreferences.allergies && (
                      <p className="italic">
                        You haven't set your preferences yet. 
                        <Link href="/profile" className="ml-1 underline text-primary hover:text-primary/80">
                          Set them in your profile
                        </Link>.
                      </p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="shadow-md border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl font-playfair">Original Recipe</CardTitle>
              <CardDescription>Paste your recipe or modify the loaded recipe</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Textarea
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                  placeholder="Paste your recipe here..."
                  className="min-h-[300px] resize-none focus:ring-primary"
                />
                
                <div className="space-y-3">
                  <Label htmlFor="improvement" className="text-base font-medium block">
                    How would you like to improve this recipe?
                  </Label>
                  <Textarea
                    id="improvement"
                    value={improvementRequest}
                    onChange={(e) => setImprovementRequest(e.target.value)}
                    placeholder="e.g., Make it spicier, add a vegetarian option, substitute butter with olive oil..."
                    className="min-h-[100px] resize-none focus:ring-primary"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleImproveRecipe}
                  disabled={!recipeText || isLoading}
                  className="w-full font-medium btn-recipe group"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="animate-pulse">Improving recipe...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="mr-2">Improve Recipe</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="shadow-md border-2">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-accent/10">
              <CardTitle className="text-xl font-playfair">Improved Recipe</CardTitle>
              <CardDescription>Your enhanced culinary masterpiece will appear here</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {improvedRecipe ? (
                <div className="prose dark:prose-invert max-w-none">
                  {improvedRecipe.split('\n').map((line, i) => (
                    <p key={i} className={`${line.startsWith('#') ? 'font-bold text-lg mb-2' : 'mb-4'}`}>
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="min-h-[300px] flex items-center justify-center border-2 border-dashed rounded-md bg-muted/30 text-muted-foreground p-6 text-center">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <div>
                        <p className="font-medium">Our chef is working on your recipe...</p>
                        <p className="text-sm text-muted-foreground mt-1">This may take a minute or two.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Send className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground/70">Your improved recipe will appear here after enhancing.</p>
                    </div>
                  )}
                </div>
              )}
              
              {improvedRecipe && (
                <div className="mt-6 pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => {
                    navigator.clipboard.writeText(improvedRecipe);
                    toast({
                      title: "Copied to clipboard",
                      description: "The improved recipe has been copied to your clipboard.",
                    });
                  }}>
                    Copy to Clipboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}