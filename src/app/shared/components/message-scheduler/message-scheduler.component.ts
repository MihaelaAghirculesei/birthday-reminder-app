import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { MaterialModule } from '../../material.module';
import { ScheduledMessageService } from '../../../services/scheduled-message.service';
import { NotificationService } from '../../../services/notification.service';
import { BirthdayService } from '../../../services/birthday.service';
import { ScheduledMessage, Birthday } from '../../../models/birthday.model';

@Component({
  selector: 'app-message-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
  templateUrl: './message-scheduler.component.html',
  styleUrls: ['./message-scheduler.component.scss'],
})
export class MessageSchedulerComponent implements OnInit {
  @Input() birthday: Birthday | null = null;

  messageForm: FormGroup;
  messages: ScheduledMessage[] = [];
  templates: any[] = [];
  timeSlots: string[] = [];
  isCreatingMessage = false;
  editingMessage: ScheduledMessage | null = null;

  constructor(
    private fb: FormBuilder,
    private scheduledMessageService: ScheduledMessageService,
    private notificationService: NotificationService,
    private birthdayService: BirthdayService
  ) {
    this.messageForm = this.fb.group({
      title: ['', Validators.required],
      message: ['', Validators.required],
      deliveryTime: ['09:00', Validators.required],
      priority: ['normal', Validators.required],
      isActive: [true],
    });

    this.templates = this.scheduledMessageService.getMessageTemplates();
    this.timeSlots = this.scheduledMessageService.getTimeSlots();
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    if (this.birthday) {
      const messages = this.birthdayService.getMessagesByBirthday(this.birthday.id);
      this.messages = messages || [];
    }
  }

  startCreatingMessage(): void {
    this.isCreatingMessage = true;
    this.editingMessage = null;
    this.messageForm.reset({
      deliveryTime: '09:00',
      priority: 'normal',
      isActive: true,
    });
  }

  applyTemplate(template: any): void {
    this.messageForm.patchValue({
      title: template.title,
      message: template.message,
    });
  }

  async saveMessage(): Promise<void> {
    if (this.messageForm.valid && this.birthday) {
      if (this.editingMessage) {
        await this.birthdayService.updateMessageInBirthday(
          this.birthday.id,
          this.editingMessage.id,
          this.messageForm.value
        );
        this.notificationService.show('Message updated!', 'success');
      } else {
        const newMessage = this.scheduledMessageService.createMessage(
          this.messageForm.value
        );

        await this.birthdayService.addMessageToBirthday(this.birthday.id, newMessage);
        this.notificationService.show('Scheduled message created!', 'success');
      }

      this.loadMessages();
      this.cancelEdit();
    }
  }

  editMessage(message: ScheduledMessage): void {
    this.editingMessage = message;
    this.isCreatingMessage = true;
    this.messageForm.patchValue(message);
  }

  cancelEdit(): void {
    this.isCreatingMessage = false;
    this.editingMessage = null;
    this.messageForm.reset();
  }

  async toggleMessageStatus(message: ScheduledMessage): Promise<void> {
    if (this.birthday) {
      await this.birthdayService.updateMessageInBirthday(this.birthday.id, message.id, {
        isActive: !message.isActive,
      });
      this.loadMessages();
    }
  }

  testMessage(message: ScheduledMessage): void {
    if (this.birthday) {
      const processedMessage = this.getProcessedMessage(message);
      this.notificationService.show(
        `🧪 TEST - ${message.title}: ${processedMessage}`,
        'info',
        5000
      );
    }
  }

  async deleteMessage(message: ScheduledMessage): Promise<void> {
    if (confirm(`Delete message "${message.title}"?`) && this.birthday) {
      await this.birthdayService.deleteMessageFromBirthday(this.birthday.id, message.id);
      this.loadMessages();
      this.notificationService.show('Message deleted', 'success');
    }
  }

  getMessagePreview(): string {
    const message = this.messageForm.get('message')?.value;
    return this.birthday
      ? this.processMessage(message, this.birthday)
      : message;
  }

  getProcessedMessage(message: ScheduledMessage): string {
    return this.birthday
      ? this.processMessage(message.message, this.birthday)
      : message.message;
  }

  private processMessage(template: string, birthday: Birthday): string {
    return template
      .replace(/\{name\}/g, birthday.name)
      .replace(/\{age\}/g, this.calculateAge(birthday.birthDate).toString())
      .replace(/\{zodiac\}/g, birthday.zodiacSign || '');
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  trackByMessageId(_index: number, message: ScheduledMessage): string {
    return message.id;
  }
}
