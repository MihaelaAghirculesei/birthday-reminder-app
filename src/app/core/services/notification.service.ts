import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IdGeneratorService } from './id-generator.service';

export interface NotificationMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<NotificationMessage[]>([]);
  public notifications = this.notifications$.asObservable();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private idGenerator: IdGeneratorService) {}

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000): void {
    const notification: NotificationMessage = {
      id: this.idGenerator.generateId(),
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
}