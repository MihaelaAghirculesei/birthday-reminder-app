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
}