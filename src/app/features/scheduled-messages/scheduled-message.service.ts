import { Injectable } from '@angular/core';
import { ScheduledMessage } from '../../shared';

export interface MessageTemplate {
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduledMessageService {
  constructor() {}

  createMessage(messageData: Partial<ScheduledMessage>): ScheduledMessage {
    return {
      id: this.generateId(),
      title: messageData.title || '',
      message: messageData.message || '',
      deliveryTime: messageData.deliveryTime || '09:00',
      isActive: messageData.isActive ?? true,
      createdDate: new Date(),
      messageType: messageData.messageType || 'text',
      priority: messageData.priority || 'normal'
    };
  }

  getMessageTemplates(): MessageTemplate[] {
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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}