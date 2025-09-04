export interface Birthday {
  id: string;
  name: string;
  birthDate: Date;
  notes?: string;
  reminderDays?: number;
  photo?: string;
  zodiacSign?: string;
  googleCalendarEventId?: string;
  category?: string;
}