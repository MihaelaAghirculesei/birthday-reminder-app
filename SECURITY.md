# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by creating a private security advisory on GitHub or by emailing the maintainer directly. Please do not create public issues for security vulnerabilities.

---

## Security Best Practices

### 1. Environment Configuration

**Never commit sensitive credentials to version control.**

This project uses environment files that are excluded from Git:

```
src/environments/environment.ts          # ❌ NOT committed (in .gitignore)
src/environments/environment.prod.ts     # ❌ NOT committed (in .gitignore)
src/environments/environment.example.ts  # ✅ Committed (template only)
.env                                     # ❌ NOT committed (in .gitignore)
.env.example                             # ✅ Committed (template only)
```

**Setup Instructions:**
1. Copy `environment.example.ts` to `environment.ts`
2. Replace placeholder values with your actual credentials
3. Verify that `environment.ts` is listed in `.gitignore`
4. Never share your credentials in pull requests or issues

### 2. Google Calendar API Credentials

**Production vs Development Credentials:**
- Use **separate** OAuth 2.0 credentials for development and production
- Restrict API keys to specific APIs (Google Calendar API only)
- Add only authorized domains to JavaScript origins
- Enable OAuth consent screen for production use

**Credential Security:**
- Rotate API keys periodically
- Monitor usage in Google Cloud Console
- Set up billing alerts to detect unauthorized usage
- Revoke credentials immediately if compromised

### 3. Data Storage

**IndexedDB:**
- User data (birthdays) is stored locally in IndexedDB
- No sensitive data is transmitted to external servers (except Google Calendar sync)
- Clear browser data to remove all user information

**LocalStorage:**
- Used for app settings and preferences
- No sensitive authentication tokens stored
- Google Calendar tokens are managed by Google's JavaScript library

### 4. Third-Party Dependencies

**Dependency Management:**
- Regular `npm audit` checks for vulnerabilities
- Update dependencies promptly when security patches are available
- Review dependency licenses before adding new packages

**Current Security Measures:**
- Angular 17+ with built-in XSS protection
- Material Design components with accessibility features
- Service Workers for secure offline functionality

### 5. Content Security Policy (CSP)

Consider adding CSP headers in production:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  connect-src 'self' https://*.googleapis.com;
```

### 6. HTTPS in Production

**Always deploy with HTTPS:**
- Google Calendar OAuth requires HTTPS in production
- Use SSL/TLS certificates (Let's Encrypt, Cloudflare, etc.)
- Enable HSTS (HTTP Strict Transport Security)
- Redirect HTTP to HTTPS

### 7. Input Validation

**Current Protections:**
- Angular's built-in sanitization prevents XSS attacks
- Form validation prevents invalid data entry
- TypeScript type checking at compile time

**Additional Recommendations:**
- Validate file uploads (CSV, JSON, vCard)
- Sanitize user-generated content
- Limit file size for imports

---

## Deployment Checklist

Before deploying to production:

- [ ] Separate OAuth credentials for production environment
- [ ] `environment.prod.ts` configured with production credentials
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Production domain added to Google OAuth authorized origins
- [ ] API keys restricted to production domain
- [ ] CSP headers configured
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] Source maps disabled in production build
- [ ] Error tracking configured (but without exposing sensitive data)

---

## Incident Response

**If credentials are compromised:**

1. **Immediately** revoke compromised credentials in Google Cloud Console
2. Generate new credentials
3. Update environment files locally (do not commit)
4. Notify team members to update their local configurations
5. Review access logs for suspicious activity
6. If credentials were committed to Git:
   - Use `git-filter-repo` or BFG Repo-Cleaner to remove from history
   - Force push to remote (coordinate with team)
   - Invalidate all cloned repositories

**Emergency Contacts:**
- Project Maintainer: [Add contact information]
- Security Team: [Add contact information]

---

## Security Updates

This document is reviewed and updated regularly. Last review: 2025-12-16

For questions about security practices, please open a discussion on GitHub.
