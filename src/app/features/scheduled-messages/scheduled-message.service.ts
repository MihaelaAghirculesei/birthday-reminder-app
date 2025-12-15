import { Injectable } from '@angular/core';
import { ScheduledMessage } from '../../shared';
import { IdGeneratorService } from '../../core/services/id-generator.service';

export interface MessageTemplate {
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduledMessageService {
  constructor(private idGenerator: IdGeneratorService) {}

  createMessage(messageData: Partial<ScheduledMessage>): ScheduledMessage {
    return {
      id: this.idGenerator.generateId(),
      title: messageData.title || '',
      message: messageData.message || '',
      scheduledTime: messageData.scheduledTime || '09:00',
      active: messageData.active ?? true,
      createdDate: new Date(),
      messageType: messageData.messageType || 'text',
      priority: messageData.priority || 'normal',
      birthdayId: messageData.birthdayId
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
}