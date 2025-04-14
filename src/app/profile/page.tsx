'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChefHat, User, Settings, Save, Loader2, Edit, Utensils, Bell, AlertTriangle, BookmarkCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Define the profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  image: z.string().optional(),
})

// Define dietary preferences form schema
const preferencesFormSchema = z.object({
  dietaryPreferences: z.string().optional(),
  allergies: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type PreferencesFormValues = z.infer<typeof preferencesFormSchema>

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false)
  const [savedRecipesCount, setSavedRecipesCount] = useState(0)

  // Initialize profile form with user data
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      image: session?.user?.image || '',
    },
  })

  // Initialize preferences form
  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      dietaryPreferences: '',
      allergies: '',
    },
  })

  // Fetch user preferences and saved recipes count when the component mounts
  useEffect(() => {
    if (session?.user) {
      fetchUserPreferences();
      fetchSavedRecipesCount();
    }
  }, [session]);

  // Function to fetch user preferences
  const fetchUserPreferences = async () => {
    setIsLoadingPreferences(true);
    try {
      const response = await fetch('/api/user/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      const data = await response.json();
      
      // Update form with fetched preferences
      preferencesForm.setValue('dietaryPreferences', data.dietaryPreferences || '');
      preferencesForm.setValue('allergies', data.allergies || '');
      
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Function to fetch saved recipes count
  const fetchSavedRecipesCount = async () => {
    try {
      const response = await fetch('/api/recipes/saved');
      
      if (!response.ok) {
        console.error('Failed to fetch saved recipes');
        return;
      }
      
      const data = await response.json();
      setSavedRecipesCount(data.recipes?.length || 0);
    } catch (error) {
      console.error('Error fetching saved recipes count:', error);
      // Don't show an error toast for this as it's not critical
    }
  };

  // Redirect if not logged in
  if (!session?.user) {
    router.push('/auth/signin')
    return null
  }

  // Handle profile form submission
  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      // Update the session with new user data
      await update({ 
        ...session,
        user: {
          ...session.user,
          name: data.name,
          image: data.image,
        }
      })
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle preferences form submission
  const onPreferencesSubmit = async (data: PreferencesFormValues) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }
      
      toast({
        title: 'Preferences updated',
        description: 'Your dietary preferences have been updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Generate user initials for avatar
  const userInitials = session.user.name
    ? session.user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <div className="bg-gradient-to-b from-white/5 to-white/0 dark:from-gray-900/5 dark:to-gray-900/0 min-h-[calc(100vh-64px)] pb-10">
      <div className="container max-w-4xl py-12 px-4 md:px-6">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 font-playfair bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">Your Profile</h1>
          <p className="text-muted-foreground">Personalize your FridgeChef experience and manage your preferences</p>
        </div>
        
        <div className="mb-8">
          <Card className="overflow-hidden border-2 shadow-lg backdrop-blur-sm bg-card/80">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-xl">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold">{session.user.name}</h2>
                <p className="text-muted-foreground">{session.user.email}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <ChefHat className="h-3 w-3 mr-1" /> Chef
                  </Badge>
                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                    <BookmarkCheck className="h-3 w-3 mr-1" /> {savedRecipesCount} Saved Recipes
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <Tabs defaultValue="profile" className="space-y-8">
          <div className="sticky top-0 z-10 pt-2 pb-4 bg-background/80 backdrop-blur-sm">
            <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-flex">
              <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2 py-3">
                <Settings className="h-4 w-4" />
                <span>Dietary Preferences</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Profile Tab Content */}
          <TabsContent value="profile" className="space-y-6 focus:outline-none">
            <Card className="border-2 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal profile information below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="border-2 transition-all focus:border-primary/50" 
                              placeholder="Your full name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled 
                              className="border-2 opacity-60 bg-muted/50" 
                            />
                          </FormControl>
                          <FormDescription>
                            Email cannot be changed after registration.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="https://example.com/avatar.jpg" 
                              className="border-2 transition-all focus:border-primary/50" 
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a URL for your profile image.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="gap-2 w-full sm:w-auto transition-all" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Preferences Tab Content */}
          <TabsContent value="preferences" className="space-y-6 focus:outline-none">
            <Card className="border-2 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <ChefHat className="h-5 w-5 mr-2 text-primary" />
                  Cooking Preferences
                </CardTitle>
                <CardDescription>
                  Customize your dietary preferences and allergies to get better recipe recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPreferences ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading your preferences...</p>
                  </div>
                ) : (
                  <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                      <div className="bg-muted/40 p-4 rounded-lg mb-6">
                        <div className="flex items-start mb-3">
                          <div className="bg-primary/10 p-2 rounded-full mr-4">
                            <Utensils className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Personalized Recipes</h3>
                            <p className="text-sm text-muted-foreground">Your preferences help us tailor recipe suggestions to your dietary needs.</p>
                          </div>
                        </div>
                      </div>
                      
                      <FormField
                        control={preferencesForm.control}
                        name="dietaryPreferences"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dietary Preferences</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="e.g. Vegetarian, Low-carb, Keto, Mediterranean, etc."
                                className="resize-none min-h-[100px] border-2 transition-all focus:border-primary/50"
                              />
                            </FormControl>
                            <FormDescription>
                              Enter your dietary preferences to customize recipe suggestions.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="allergies"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center mb-1">
                              <FormLabel className="mb-0">Allergies & Restrictions</FormLabel>
                              <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                            </div>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="e.g. Nuts, Shellfish, Gluten, Dairy, etc."
                                className="resize-none min-h-[100px] border-2 transition-all focus:border-primary/50"
                              />
                            </FormControl>
                            <FormDescription>
                              List any allergies or ingredients you want to avoid.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="gap-2 w-full sm:w-auto transition-all" 
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}