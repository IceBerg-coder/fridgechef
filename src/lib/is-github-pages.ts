/**
 * Utility to detect if the app is running on GitHub Pages
 */
export const isGitHubPages = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('github.io');
};

/**
 * Utility to detect if the app is running on Vercel
 */
export const isVercel = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Vercel domains typically include vercel.app or custom domains set up with Vercel
  return window.location.hostname.includes('vercel.app') || 
         process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
};

/**
 * Returns the base URL with the correct base path for GitHub Pages
 */
export const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  if (isGitHubPages()) {
    // Extract the repository name from the pathname
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 1) {
      const repoName = pathParts[1]; // This should be your repository name
      return `/${repoName}`;
    }
    return '';
  }
  // No base path needed for Vercel
  return '';
};

/**
 * Get the base URL for API calls, considering deployment platform
 */
export const getApiBaseUrl = (): string => {
  if (isGitHubPages()) {
    // In production on GitHub Pages, you'll need to point to an actual API server
    // This could be a serverless function URL or a dedicated API server
    return 'https://your-api-server.com';  // Replace with your actual API endpoint
  }
  // For Vercel deployment, API routes are handled automatically
  return '';  // Empty string means same-origin in development or normal deployment
};