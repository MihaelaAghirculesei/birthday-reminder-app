import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { MaterialModule, Birthday } from '../../shared';
import { BirthdayFacadeService, NotificationService } from '../../core';
import { MessageScheduleDialogComponent } from './message-schedule-dialog/message-schedule-dialog.component';

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
export class ScheduledMessagesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  birthdaysWithMessages: Birthday[] = [];

  constructor(
    private birthdayFacade: BirthdayFacadeService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadScheduledMessages();
    this.birthdayFacade.birthdays$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadScheduledMessages();
      });
  }

  loadScheduledMessages(): void {
    this.birthdayFacade.birthdays$
      .pipe(takeUntil(this.destroy$))
      .subscribe(birthdays => {
        this.birthdaysWithMessages = birthdays.filter(
          b => b.scheduledMessages && b.scheduledMessages.length > 0
        );
      });
  }

  openScheduleDialog(birthday?: Birthday): void {
    const dialogRef = this.dialog.open(MessageScheduleDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { birthday },
      autoFocus: 'dialog',
      restoreFocus: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadScheduledMessages();
      });
  }

  deleteMessage(birthdayId: string, messageId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.birthdayFacade.deleteMessageFromBirthday(birthdayId, messageId);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
