import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule, Birthday } from '../../shared';
import { BirthdayFacadeService, NotificationService } from '../../core';

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
    private birthdayFacade: BirthdayFacadeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadScheduledMessages();
    this.birthdayFacade.birthdays$.subscribe(() => {
      this.loadScheduledMessages();
    });
  }

  loadScheduledMessages(): void {
    this.birthdayFacade.birthdays$.subscribe(birthdays => {
      this.birthdaysWithMessages = birthdays.filter(
        b => b.scheduledMessages && b.scheduledMessages.length > 0
      );
    });
  }

  openScheduleDialog(): void {
    this.notificationService.show('Dialog not yet implemented', 'info');
  }

  deleteMessage(birthdayId: string, messageId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.birthdayFacade.deleteMessageFromBirthday(birthdayId, messageId);
      // Success notification is handled by the effect
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
