import { Injectable } from '@angular/core';
import { Birthday, ScheduledMessage } from '../../shared/models';
import { NotificationPermissionService } from './notification-permission.service';
import { IndexedDBStorageService } from './offline-storage.service';

export interface BirthdayNotificationData {
  birthdayId: string;
  messageId: string;
  name: string;
  age?: number;
  zodiacSign?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  constructor(
    private permissionService: NotificationPermissionService,
    private storage: IndexedDBStorageService
  ) {}

  async sendBirthdayNotification(
    birthday: Birthday,
    message: ScheduledMessage
  ): Promise<boolean> {
    if (!this.permissionService.hasPermission()) {
      console.warn('No notification permission');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const formattedMessage = this.formatMessage(message.message, birthday);

      await registration.showNotification(message.title || '🎂 Birthday Reminder', {
        body: formattedMessage,
        icon: '/assets/icons/logo-reminder.png',
        tag: `birthday-${birthday.id}-${message.id}`,
        requireInteraction: message.priority === 'high',
        data: {
          birthdayId: birthday.id,
          messageId: message.id,
          name: birthday.name,
          url: '/'
        } as BirthdayNotificationData
      } as NotificationOptions);

      await this.markMessageAsSent(birthday.id, message.id);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  private formatMessage(template: string, birthday: Birthday): string {
    const age = this.calculateAge(birthday.birthDate);

    return template
      .replace(/\{name\}/g, birthday.name)
      .replace(/\{age\}/g, age?.toString() || '')
      .replace(/\{zodiac\}/g, birthday.zodiacSign || '');
  }

  private calculateAge(birthDate: Date): number | null {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  }

  private async markMessageAsSent(birthdayId: string, messageId: string): Promise<void> {
    try {
      const birthdays = await this.storage.getBirthdays();
      const birthday = birthdays.find(b => b.id === birthdayId);

      if (!birthday || !birthday.scheduledMessages) {
        return;
      }

      const updatedMessages = birthday.scheduledMessages.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            lastSentDate: new Date(),
            sentCount: (msg.sentCount || 0) + 1,
            notificationSent: true,
            lastNotificationId: `notif-${Date.now()}`
          };
        }
        return msg;
      });

      await this.storage.updateBirthday({
        ...birthday,
        scheduledMessages: updatedMessages
      });
    } catch (error) {
      console.error('Error marking message as sent:', error);
    }
  }

  async checkAndSendScheduledNotifications(): Promise<void> {
    if (!this.permissionService.hasPermission()) {
      return;
    }

    try {
      const birthdays = await this.storage.getBirthdays();
      const now = new Date();

      for (const birthday of birthdays) {
        if (!birthday.scheduledMessages) continue;

        for (const message of birthday.scheduledMessages) {
          if (!message.active) continue;

          const shouldSend = this.shouldSendNotification(birthday, message, now);

          if (shouldSend) {
            await this.sendBirthdayNotification(birthday, message);
          }
        }
      }
    } catch (error) {
      console.error('Error checking scheduled notifications:', error);
    }
  }

  private shouldSendNotification(
    birthday: Birthday,
    message: ScheduledMessage,
    now: Date
  ): boolean {
    const birthDate = new Date(birthday.birthDate);
    const thisYearBirthday = new Date(
      now.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );

    const [hours, minutes] = message.scheduledTime.split(':').map(Number);
    const scheduledTime = new Date(thisYearBirthday);
    scheduledTime.setHours(hours, minutes, 0, 0);

    const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
    const isWithinOneMinute = timeDiff < 60000;

    const lastSent = message.lastSentDate ? new Date(message.lastSentDate) : null;
    const notSentToday = !lastSent ||
      lastSent.getFullYear() !== now.getFullYear() ||
      lastSent.getMonth() !== now.getMonth() ||
      lastSent.getDate() !== now.getDate();

    return isWithinOneMinute && notSentToday;
  }

  async getScheduledNotificationsCount(): Promise<number> {
    try {
      const birthdays = await this.storage.getBirthdays();
      let count = 0;

      for (const birthday of birthdays) {
        if (birthday.scheduledMessages) {
          count += birthday.scheduledMessages.filter(msg => msg.active).length;
        }
      }

      return count;
    } catch (error) {
      console.error('Error counting scheduled notifications:', error);
      return 0;
    }
  }

  async getUpcomingNotifications(days: number = 7): Promise<Array<{
    birthday: Birthday;
    message: ScheduledMessage;
    scheduledDate: Date;
  }>> {
    try {
      const birthdays = await this.storage.getBirthdays();
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const upcoming: Array<{ birthday: Birthday; message: ScheduledMessage; scheduledDate: Date }> = [];

      for (const birthday of birthdays) {
        if (!birthday.scheduledMessages) continue;

        for (const message of birthday.scheduledMessages) {
          if (!message.active) continue;

          const birthDate = new Date(birthday.birthDate);
          const thisYearBirthday = new Date(
            now.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          );

          const [hours, minutes] = message.scheduledTime.split(':').map(Number);
          const scheduledDate = new Date(thisYearBirthday);
          scheduledDate.setHours(hours, minutes, 0, 0);

          if (scheduledDate >= now && scheduledDate <= futureDate) {
            upcoming.push({ birthday, message, scheduledDate });
          }
        }
      }

      return upcoming.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    } catch (error) {
      console.error('Error getting upcoming notifications:', error);
      return [];
    }
  }
}
