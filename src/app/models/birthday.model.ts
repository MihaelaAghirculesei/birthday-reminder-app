export interface Birthday {
  id: string;
  name: string;
  birthDate: Date;
  notes?: string;
  reminderDays?: number;
  photo?: string;
  rememberPhoto?: string;
  zodiacSign?: string;
  googleCalendarEventId?: string;
  category?: string;
  scheduledMessages?: ScheduledMessage[];
}

export interface ScheduledMessage {
  id: string;
  title: string;
  message: string;
  deliveryTime: string; // Format HH:mm (e.g., "09:30")
  isActive: boolean;
  createdDate: Date;
  lastSentDate?: Date;
  messageType: 'text' | 'html';
  priority: 'low' | 'normal' | 'high';
}