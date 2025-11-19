import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';

@Injectable({
  providedIn: 'root'
})
export class NotificationPermissionService {
  private permissionStatus$ = new BehaviorSubject<NotificationPermissionStatus>(this.getCurrentPermission());

  constructor() {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName }).then(permissionStatus => {
        permissionStatus.onchange = () => {
          this.permissionStatus$.next(this.getCurrentPermission());
        };
      });
    }
  }

  get permissionStatus(): Observable<NotificationPermissionStatus> {
    return this.permissionStatus$.asObservable();
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }


  getCurrentPermission(): NotificationPermissionStatus {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission as NotificationPermissionStatus;
  }


  hasPermission(): boolean {
    return this.getCurrentPermission() === 'granted';
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Le notifiche non sono supportate in questo browser');
      return false;
    }

    if (this.getCurrentPermission() === 'granted') {
      return true;
    }

    if (this.getCurrentPermission() === 'denied') {
      console.warn('I permessi per le notifiche sono stati negati');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus$.next(permission as NotificationPermissionStatus);

      localStorage.setItem('notificationPermissionRequested', 'true');
      localStorage.setItem('notificationPermissionGranted', (permission === 'granted').toString());

      return permission === 'granted';
    } catch (error) {
      console.error('Errore nella richiesta dei permessi:', error);
      return false;
    }
  }

  hasBeenAsked(): boolean {
    return localStorage.getItem('notificationPermissionRequested') === 'true';
  }

  async showTestNotification(): Promise<void> {
    if (!this.hasPermission()) {
      console.warn('Permessi non concessi');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('🎂 Birthday Reminder Test', {
        body: 'Notifications are working correctly!',
        icon: '/assets/icons/logo-reminder.png',
        tag: 'test-notification',
        requireInteraction: true,
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 'test'
        }
      } as NotificationOptions);
    } catch (error) {
      console.error('Errore nell\'invio della notifica di test:', error);
    }
  }

  getStats(): {
    supported: boolean;
    permission: NotificationPermissionStatus;
    hasBeenAsked: boolean;
    canAskAgain: boolean;
  } {
    const permission = this.getCurrentPermission();
    return {
      supported: this.isSupported(),
      permission,
      hasBeenAsked: this.hasBeenAsked(),
      canAskAgain: permission === 'default'
    };
  }
}
