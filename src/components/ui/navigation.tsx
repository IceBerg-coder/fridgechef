'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Utensils, Book, Beaker, Menu, X, ChefHat, CookingPot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Button } from './button'
import { useIsMobile } from '@/hooks/use-mobile'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { AuthStatus } from '@/components/auth/auth-status'

export function Navigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useIsMobile()
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const links = [
    {
      name: 'Recipe Generator',
      href: '/recipe-generator',
      icon: <CookingPot className="mr-2 h-4 w-4" />,
      active: pathname === '/recipe-generator'
    },
    {
      name: 'Improve Recipe',
      href: '/improve-recipe',
      icon: <Beaker className="mr-2 h-4 w-4" />,
      active: pathname === '/improve-recipe'
    }
  ]

  return (
    <nav className={cn(
      "fixed w-full top-0 z-50 transition-all duration-300",
      scrolled ? "bg-background/95 backdrop-blur-md border-b shadow-sm" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="group flex items-center font-bold text-xl transition-colors hover:text-primary">
              <div className="relative">
                <ChefHat className={cn(
                  "h-7 w-7 mr-2 transition-transform duration-300 group-hover:rotate-12",
                  scrolled ? "text-primary" : "text-primary"
                )} />
                <Utensils className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-background" />
              </div>
              <span className={cn(
                "font-heading tracking-tight transition-all duration-300",
                scrolled ? "text-foreground" : "text-foreground"
              )}>
                <span className="text-primary font-bold">Fridge</span>Chef
              </span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-2 mr-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    link.active 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="ml-2">
                <AuthStatus />
              </div>
            </div>
          </div>
          
          {/* Mobile menu button and theme toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <AuthStatus />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b shadow-lg animate-slideDown">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors",
                  link.active 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}