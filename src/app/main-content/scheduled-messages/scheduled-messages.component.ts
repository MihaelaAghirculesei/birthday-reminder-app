import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ScheduledMessageService } from '../../services/scheduled-message.service';
import { NotificationService } from '../../services/notification.service';
import { ScheduledMessage } from '../../models/birthday.model';

@Component({
  selector: 'app-scheduled-messages',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './scheduled-messages.component.html',
  styleUrls: ['./scheduled-messages.component.scss'],
})
export class ScheduledMessagesComponent implements OnInit {
  scheduledMessages: ScheduledMessage[] = [];

  constructor(
    private dialog: MatDialog,
    private scheduledMessageService: ScheduledMessageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadScheduledMessages();
  }

  loadScheduledMessages(): void {
    this.scheduledMessages = this.scheduledMessageService.getAllMessages();
  }

  openScheduleDialog(): void {
    this.notificationService.show('Dialog not yet implemented', 'info');
  }

  editMessage(message: ScheduledMessage): void {
    this.notificationService.show('Edit not yet implemented', 'info');
  }

  deleteMessage(messageId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.scheduledMessageService.deleteMessage('', messageId);
      this.loadScheduledMessages();
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
