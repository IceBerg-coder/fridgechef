'use client';

import { useEffect } from 'react';
import { isGitHubPages } from '@/lib/is-github-pages';
import { setupMockFetchForGitHubPages } from '@/lib/mock-data-service';

/**
 * This component initializes mock data services when running on GitHub Pages.
 * It should be included in the app layout near the root to ensure it runs early.
 */
export function GitHubPagesAdapter() {
  useEffect(() => {
    if (isGitHubPages()) {
      console.log('GitHub Pages environment detected, initializing mock services');
      setupMockFetchForGitHubPages();
    }
  }, []);

  // This is a utility component that doesn't render anything
  return null;
}