/**
 * Utility to detect if the app is running on GitHub Pages
 */
export const isGitHubPages = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('github.io');
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
  return '';
};

/**
 * Get the base URL for API calls, considering GitHub Pages deployment
 */
export const getApiBaseUrl = (): string => {
  if (isGitHubPages()) {
    // In production on GitHub Pages, you'll need to point to an actual API server
    // This could be a serverless function URL or a dedicated API server
    return 'https://your-api-server.com';  // Replace with your actual API endpoint
  }
  return '';  // Empty string means same-origin in development or normal deployment
};