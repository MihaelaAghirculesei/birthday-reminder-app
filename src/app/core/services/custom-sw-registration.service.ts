import { Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomSwRegistrationService {
  private platformId = inject(PLATFORM_ID);

  async registerCustomServiceWorker(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/custom-sw.js', {
        scope: '/'
      });

      console.log('[Custom SW] Registered successfully:', registration);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[Custom SW] New version activated');
            }
          });
        }
      });
    } catch (error) {
      console.error('[Custom SW] Registration failed:', error);
    }
  }

  async unregisterCustomServiceWorker(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        if (registration.active?.scriptURL.includes('custom-sw.js')) {
          await registration.unregister();
          console.log('[Custom SW] Unregistered successfully');
        }
      }
    } catch (error) {
      console.error('[Custom SW] Unregister failed:', error);
    }
  }
}
