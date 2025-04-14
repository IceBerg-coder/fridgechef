import { Heart, Github, Twitter, ExternalLink, ChefHat } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  const links = [
    { name: 'About', href: '#' },
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' },
    { name: 'Contact', href: '#' }
  ]
  
  return (
    <footer className="w-full bg-muted/50 border-t py-8 mt-auto">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <ChefHat className="h-6 w-6 text-primary" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 bg-background rounded-full border-2 border-primary"></span>
              </div>
              <span className="font-bold text-lg">
                <span className="text-primary">Fridge</span>Chef
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Turn your ingredients into delicious meals with AI-powered recipe generation.
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <h3 className="font-medium">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex flex-col space-y-3">
            <h3 className="font-medium">Connect</h3>
            <div className="flex items-center space-x-3">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between border-t border-border mt-8 pt-6 text-sm text-muted-foreground">
          <p className="flex items-center">
            © {currentYear} Made with <Heart className="h-4 w-4 mx-1 text-red-500 animate-pulse" /> by FridgeChef Team
          </p>
          <p className="mt-2 md:mt-0">All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}