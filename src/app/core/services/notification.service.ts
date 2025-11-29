import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private notifications$ = new BehaviorSubject<NotificationMessage[]>([]);
  public notifications = this.notifications$.asObservable();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {}

  ngOnDestroy(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000): void {
    const notification: NotificationMessage = {
      id: this.generateId(),
      message,
      type,
      duration
    };

    const currentNotifications = this.notifications$.value;
    this.notifications$.next([...currentNotifications, notification]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.remove(notification.id);
      }, duration);
      this.timers.set(notification.id, timer);
    }
  }

  remove(id: string): void {
    const currentNotifications = this.notifications$.value;
    this.notifications$.next(currentNotifications.filter(n => n.id !== id));

    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}