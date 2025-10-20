import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule, Birthday } from '../../shared';
import { BirthdayService, NotificationService } from '../../core';

@Component({
  selector: 'app-scheduled-messages',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
  ],
  templateUrl: './scheduled-messages.component.html',
  styleUrls: ['./scheduled-messages.component.scss'],
})
export class ScheduledMessagesComponent implements OnInit {
  birthdaysWithMessages: Birthday[] = [];

  constructor(
    private birthdayService: BirthdayService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadScheduledMessages();
    this.birthdayService.birthdays$.subscribe(() => {
      this.loadScheduledMessages();
    });
  }

  loadScheduledMessages(): void {
    this.birthdayService.birthdays$.subscribe(birthdays => {
      this.birthdaysWithMessages = birthdays.filter(
        b => b.scheduledMessages && b.scheduledMessages.length > 0
      );
    });
  }

  openScheduleDialog(): void {
    this.notificationService.show('Dialog not yet implemented', 'info');
  }

  async deleteMessage(birthdayId: string, messageId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this message?')) {
      await this.birthdayService.deleteMessageFromBirthday(birthdayId, messageId);
      this.notificationService.show('Message deleted', 'success');
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'High';
      default:
        return priority;
    }
  }
}
