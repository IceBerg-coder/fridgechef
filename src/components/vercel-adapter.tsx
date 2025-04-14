'use client';

import { useEffect } from 'react';
import { isVercel } from '@/lib/is-github-pages';

/**
 * This component initializes Vercel-specific services.
 * It should be included in the app layout near the root.
 */
export function VercelAdapter() {
  useEffect(() => {
    if (isVercel()) {
      console.log('Vercel environment detected');
      // Add any Vercel-specific initialization here
    }
  }, []);

  // This is a utility component that doesn't render anything
  return null;
}