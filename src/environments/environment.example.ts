/**
 * Environment Configuration Template (Development)
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to 'environment.ts' in the same directory
 * 2. Replace placeholder values with your actual credentials
 * 3. NEVER commit environment.ts to Git (it's in .gitignore)
 *
 * GOOGLE CALENDAR SETUP:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable Google Calendar API
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add authorized JavaScript origins: http://localhost:4200
 * 6. Copy Client ID and API Key to environment.ts
 */

export const environment = {
  production: false,
  googleCalendar: {
    // Replace with your Google OAuth 2.0 Client ID
    // Example: '123456789-abcdefghijklmnop.apps.googleusercontent.com'
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

    // Replace with your Google API Key
    // Example: 'AIzaSyAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQq'
    apiKey: 'YOUR_GOOGLE_API_KEY'
  }
};
