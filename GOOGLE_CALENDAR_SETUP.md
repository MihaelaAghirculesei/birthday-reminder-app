# 📅 Google Calendar Integration Setup

## 🚀 Overview

Your Birthday Memories app now supports automatic synchronization with Google Calendar! Every birthday is added as an annual recurring event in your Google Calendar.

## ⚙️ Google Credentials Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Calendar API"
   - Click "Enable"

### 2. Configure OAuth 2.0

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Add authorized URLs:
   ```
   Authorized JavaScript origins:
   - http://localhost:4200
   - https://yourdomain.com

   Authorized redirect URIs:
   - http://localhost:4200
   - https://yourdomain.com
   ```

### 3. Get API Key

1. On the same "Credentials" page
2. Click "Create Credentials" → "API key"
3. (Optional) Restrict the key to Calendar API

### 4. Configure the App

Update the configuration files with your credentials:

**src/environments/environment.ts**
```typescript
export const environment = {
  production: false,
  googleCalendar: {
    clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    apiKey: 'YOUR_API_KEY'
  }
};
```

**src/environments/environment.prod.ts**
```typescript
export const environment = {
  production: true,
  googleCalendar: {
    clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    apiKey: 'YOUR_API_KEY'
  }
};
```

## 🎯 Implemented Features

### ✨ Automatic Synchronization
- **Add birthday** → Creates event in Google Calendar
- **Edit birthday** → Updates existing event
- **Delete birthday** → Removes event from calendar

### 🔄 Sync Modes
- **One-way**: From app to calendar only
- **Two-way**: Bidirectional (future development)

### 📅 Event Features
- **Annual recurrence** automatically
- **Customizable reminders** (1h, 6h, 1d, 2d, 1 week)
- **Detailed descriptions** with notes and age
- **Informative titles**: "🎂 Name's Birthday (X years)"

### 🎛️ Advanced Settings
- Target calendar selection
- Reminder configuration
- Bulk manual sync
- Synchronization statistics

## 🧪 How to Test

### 1. Start Application
```bash
ng serve
```

### 2. Google Connection
1. Go to "Google Calendar Sync" section
2. Click "Connect Google Calendar"
3. Authorize the app in Google popups
4. Enable "Enable automatic sync"

### 3. Test Synchronization
1. Add a new birthday
2. Check your Google Calendar
3. You should see the recurring event created

### 4. Test Features
- Edit a birthday → The event updates
- Delete a birthday → The event is removed
- Bulk sync → Syncs all existing birthdays

## 🔧 Troubleshooting

### "Invalid Client ID" Error
- Verify that CLIENT_ID is correct
- Check that origin is authorized in OAuth settings

### "API Key Invalid" Error
- Verify that API_KEY is correct
- Make sure Calendar API is enabled

### Popup Blocked
- Enable popups for your domain
- Try with incognito mode

### Events Not Created
- Check calendar permissions
- Check browser console for errors
- Make sure you have internet connection

## 🚀 Production Deployment

### 1. Production Environment
Update `environment.prod.ts` with:
- CLIENT_ID for production domain
- API_KEY without IP restrictions (or with server IP)

### 2. Production Build
```bash
ng build --configuration=production
```

### 3. Domain Configuration
Add production domain to "Authorized origins" in Google Cloud.

## 🎨 Future Customizations

### Possible Improvements
- [ ] Complete bidirectional sync
- [ ] Automatic conflict resolution
- [ ] Periodic Google Drive backup
- [ ] Google Contacts integration
- [ ] Push notifications via Calendar
- [ ] Family calendar sharing

### Advanced Features
- [ ] Bulk import from existing Calendar
- [ ] ICS export for other calendars
- [ ] Sync with Outlook/Apple Calendar
- [ ] Advanced timezone management

## 📊 Monitoring

The app tracks:
- Number of successful/failed syncs
- Last synchronization timestamp
- Errors and automatic retries
- API usage statistics

## 🔐 Security

- Credentials are client-side only
- No data stored on Google servers
- Minimum necessary permissions (Calendar only)
- Secure logout with token revocation

---

**🎉 Your Birthday Reminder is now fully integrated with Google Calendar!**