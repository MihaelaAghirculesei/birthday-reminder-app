/**
 * Environment Configuration Template (Production)
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to 'environment.prod.ts' in the same directory
 * 2. Replace placeholder values with your PRODUCTION credentials
 * 3. NEVER commit environment.prod.ts to Git (it's in .gitignore)
 *
 * PRODUCTION DEPLOYMENT:
 * - Use different OAuth credentials for production
 * - Add your production domain to authorized origins
 * - Enable additional security features (HTTPS only, etc.)
 * - Consider using environment variables in CI/CD pipeline
 *
 * GOOGLE CALENDAR SETUP (Production):
 * 1. Go to https://console.cloud.google.com/
 * 2. Use separate project or credentials for production
 * 3. Add authorized JavaScript origins: https://your-production-domain.com
 * 4. Configure OAuth consent screen for production use
 * 5. Copy Production Client ID and API Key to environment.prod.ts
 */

export const environment = {
  production: true,
  googleCalendar: {
    // Replace with your PRODUCTION Google OAuth 2.0 Client ID
    // Example: '987654321-zyxwvutsrqponmlk.apps.googleusercontent.com'
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

    // Replace with your PRODUCTION Google API Key
    // Example: 'AIzaSyAaZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlKk'
    apiKey: 'YOUR_GOOGLE_API_KEY'
  }
};
