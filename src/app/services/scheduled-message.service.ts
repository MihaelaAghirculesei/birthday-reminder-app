import { Injectable } from '@angular/core';
import { ScheduledMessage } from '../models/birthday.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduledMessageService {
  private storageKey = 'scheduledMessages';

  constructor() {}

  getAllMessages(): ScheduledMessage[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  getMessagesByBirthday(birthdayId: string): ScheduledMessage[] {
    // For now, return all messages - you can filter by birthdayId later
    return this.getAllMessages();
  }

  createMessage(birthdayId: string, messageData: Partial<ScheduledMessage>): ScheduledMessage {
    const newMessage: ScheduledMessage = {
      id: this.generateId(),
      title: messageData.title || '',
      message: messageData.message || '',
      deliveryTime: messageData.deliveryTime || '09:00',
      isActive: messageData.isActive ?? true,
      createdDate: new Date(),
      messageType: messageData.messageType || 'text',
      priority: messageData.priority || 'normal'
    };

    const messages = this.getAllMessages();
    messages.push(newMessage);
    this.saveMessages(messages);

    return newMessage;
  }

  updateMessage(birthdayId: string, messageId: string, updates: Partial<ScheduledMessage>): void {
    const messages = this.getAllMessages();
    const index = messages.findIndex(m => m.id === messageId);

    if (index !== -1) {
      messages[index] = { ...messages[index], ...updates };
      this.saveMessages(messages);
    }
  }

  deleteMessage(birthdayId: string, messageId: string): void {
    const messages = this.getAllMessages();
    const filtered = messages.filter(m => m.id !== messageId);
    this.saveMessages(filtered);
  }

  getMessageTemplates() {
    return [
      {
        title: 'Simple Happy Birthday',
        message: 'Happy birthday {name}! Best wishes for your {age} years! 🎉'
      },
      {
        title: 'Formal Message',
        message: 'Dear {name}, I wish you a very happy birthday and a year full of satisfaction!'
      },
      {
        title: 'Fun Message',
        message: 'Hey {name}! Today you turn {age}... you\'re getting older! 😄 But you\'re still amazing! 🎂'
      },
      {
        title: 'Zodiac Message',
        message: 'Happy birthday {name}! As a typical {zodiac}, this will be a special year for you! 🌟'
      }
    ];
  }

  getTimeSlots(): string[] {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }

  private saveMessages(messages: ScheduledMessage[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(messages));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}