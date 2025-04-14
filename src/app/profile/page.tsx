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
import { ChefHat, User, Settings, Save, Loader2 } from 'lucide-react'

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

  // Fetch user preferences when the component mounts
  useEffect(() => {
    if (session?.user) {
      fetchUserPreferences();
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
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-6 font-playfair">Your Profile</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Dietary Preferences
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab Content */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{session.user.name}</CardTitle>
                  <CardDescription>{session.user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-2" />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="border-2 opacity-60" />
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
                          <Input {...field} placeholder="https://example.com/avatar.jpg" className="border-2" />
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
                    className="gap-2" 
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
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Cooking Preferences
              </CardTitle>
              <CardDescription>
                Customize your dietary preferences and allergies to get better recipe recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPreferences ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...preferencesForm}>
                  <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
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
                              className="resize-none min-h-[100px] border-2"
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
                          <FormLabel>Allergies & Restrictions</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="e.g. Nuts, Shellfish, Gluten, Dairy, etc."
                              className="resize-none min-h-[100px] border-2"
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
                      className="gap-2" 
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
  )
}