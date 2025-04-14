'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button, ButtonProps } from './button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Recipe {
  id: string;
  name?: string;
  content?: string;
  [key: string]: any;
}

interface SaveRecipeButtonProps extends Omit<ButtonProps, 'onClick'> {
  recipeId?: string;
  recipeName?: string;
  recipeContent?: string;
  recipe?: Recipe;
  onSaveChange?: (isSaved: boolean) => void;
  savedIcon?: React.ReactNode;
  unsavedIcon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function SaveRecipeButton({
  recipeId,
  recipeName,
  recipeContent,
  recipe,
  onSaveChange,
  savedIcon = <BookmarkCheck className="h-5 w-5" />,
  unsavedIcon = <Bookmark className="h-5 w-5" />,
  variant = 'ghost',
  size = 'icon',
  showText = false,
  className,
  ...props
}: SaveRecipeButtonProps) {
  const { data: session, status } = useSession();
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Get the actual recipe ID, either from recipeId prop or recipe.id
  const actualRecipeId = recipeId || (recipe?.id);
  const actualRecipeName = recipeName || (recipe?.name);
  const actualRecipeContent = recipeContent || (recipe?.content);
  
  // Check if recipe is already saved when component mounts
  useEffect(() => {
    if (status === 'authenticated' && actualRecipeId) {
      checkSaveStatus();
    }
  }, [status, actualRecipeId]);
  
  // Check if the recipe is saved by the current user
  const checkSaveStatus = async () => {
    if (!actualRecipeId) return;
    
    try {
      const response = await fetch('/api/recipes/saved');
      if (!response.ok) throw new Error('Failed to fetch saved recipes');
      
      const data = await response.json();
      const recipes = data.recipes || [];
      const saved = recipes.some((recipe: any) => recipe.id === actualRecipeId);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking save status:', error);
    }
  };
  
  // Toggle save/unsave recipe
  const toggleSave = async () => {
    if (status !== 'authenticated') {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save recipes',
        variant: 'destructive'
      });
      return;
    }
    
    if (!actualRecipeId) {
      toast({
        title: 'Error',
        description: 'Recipe ID is required',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          recipeId: actualRecipeId,
          recipeName: actualRecipeName,
          recipeContent: actualRecipeContent 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update saved status');
      }
      
      const result = await response.json();
      const newSavedStatus = !isSaved;
      setIsSaved(newSavedStatus);
      
      // Call the callback if provided
      if (onSaveChange) {
        onSaveChange(newSavedStatus);
      }
      
      toast({
        title: newSavedStatus ? 'Recipe saved' : 'Recipe removed',
        description: newSavedStatus 
          ? 'Recipe has been added to your saved recipes' 
          : 'Recipe has been removed from your saved recipes',
      });
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update saved status',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleSave}
      disabled={isLoading || status === 'loading' || !actualRecipeId}
      className={cn(
        'group',
        isSaved && 'text-primary',
        className
      )}
      aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'}
      title={isSaved ? 'Unsave recipe' : 'Save recipe'}
      {...props}
    >
      {isSaved ? savedIcon : unsavedIcon}
      {showText && (
        <span className="ml-2">{isSaved ? 'Saved' : 'Save'}</span>
      )}
    </Button>
  );
}