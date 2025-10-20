import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { Birthday } from '../../shared';
import { environment } from '../../../environments/environment';

declare const gapi: any;

export interface GoogleCalendarSettings {
  enabled: boolean;
  calendarId: string;
  syncMode: 'one-way' | 'two-way';
  reminderMinutes: number;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { date: string };
  end: { date: string };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private readonly CLIENT_ID = environment.googleCalendar.clientId;
  private readonly API_KEY = environment.googleCalendar.apiKey;
  private readonly DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  private readonly SCOPES = 'https://www.googleapis.com/auth/calendar';

  private isInitialized = false;
  private isSignedInSubject = new BehaviorSubject<boolean>(false);
  private settingsSubject = new BehaviorSubject<GoogleCalendarSettings>({
    enabled: false,
    calendarId: 'primary',
    syncMode: 'one-way',
    reminderMinutes: 1440 // 1 day before
  });

  public isSignedIn$ = this.isSignedInSubject.asObservable();
  public settings$ = this.settingsSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSettings();
    }
  }

  async initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

    if (this.CLIENT_ID.includes('YOUR_GOOGLE') || this.API_KEY.includes('YOUR_GOOGLE')) {
      return;
    }

    try {
      await this.loadGapi();
      await gapi.load('client:auth2', async () => {
        await gapi.client.init({
          apiKey: this.API_KEY,
          clientId: this.CLIENT_ID,
          discoveryDocs: [this.DISCOVERY_DOC],
          scope: this.SCOPES
        });

        const authInstance = gapi.auth2.getAuthInstance();
        this.isSignedInSubject.next(authInstance.isSignedIn.get());
        
        authInstance.isSignedIn.listen((isSignedIn: boolean) => {
          this.isSignedInSubject.next(isSignedIn);
        });

        this.isInitialized = true;
      });
    } catch (error) {
      throw error;
    }
  }

  private loadGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi !== 'undefined') {
        resolve();
        return;
      }

      const maxAttempts = 50;
      let attempts = 0;
      
      const checkGapi = () => {
        attempts++;
        if (typeof gapi !== 'undefined') {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Google API script failed to load'));
        } else {
          setTimeout(checkGapi, 100);
        }
      };
      
      checkGapi();
    });
  }

  async signIn(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
    } catch (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.updateSettings({ ...this.settingsSubject.value, enabled: false });
    } catch (error) {
      throw error;
    }
  }

  async getCalendars(): Promise<any[]> {
    if (!this.isSignedInSubject.value) {
      throw new Error('Not signed in to Google Calendar');
    }

    try {
      const response = await gapi.client.calendar.calendarList.list();
      return response.result.items || [];
    } catch (error) {
      throw error;
    }
  }

  async syncBirthdayToCalendar(birthday: Birthday): Promise<string> {
    if (!this.isSignedInSubject.value || !this.settingsSubject.value.enabled) {
      throw new Error('Google Calendar sync is not enabled');
    }

    try {
      const event = this.createBirthdayEvent(birthday);
      const response = await gapi.client.calendar.events.insert({
        calendarId: this.settingsSubject.value.calendarId,
        resource: event
      });
      
      return response.result.id;
    } catch (error) {
      throw error;
    }
  }

  async updateBirthdayInCalendar(birthday: Birthday, eventId: string): Promise<void> {
    if (!this.isSignedInSubject.value || !this.settingsSubject.value.enabled) {
      throw new Error('Google Calendar sync is not enabled');
    }

    try {
      const event = this.createBirthdayEvent(birthday);
      await gapi.client.calendar.events.update({
        calendarId: this.settingsSubject.value.calendarId,
        eventId: eventId,
        resource: event
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteBirthdayFromCalendar(eventId: string): Promise<void> {
    if (!this.isSignedInSubject.value || !this.settingsSubject.value.enabled) {
      return;
    }

    try {
      await gapi.client.calendar.events.delete({
        calendarId: this.settingsSubject.value.calendarId,
        eventId: eventId
      });
    } catch (error) {
      throw error;
    }
  }

  async syncAllBirthdays(birthdays: Birthday[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const birthday of birthdays) {
      try {
        await this.syncBirthdayToCalendar(birthday);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${birthday.name}: ${(error as Error).message}`);
      }
    }

    return results;
  }

  private createBirthdayEvent(birthday: Birthday): CalendarEvent {
    const birthDate = birthday.birthDate;
    const currentYear = new Date().getFullYear();
    const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    const eventDate = thisYearBirthday < new Date() 
      ? new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate())
      : thisYearBirthday;

    const dateString = eventDate.toISOString().split('T')[0];
    const age = currentYear - birthDate.getFullYear() + (thisYearBirthday < new Date() ? 1 : 0);

    return {
      summary: `🎂 ${birthday.name}'s Birthday (${age} years)`,
      description: birthday.notes ? `Notes: ${birthday.notes}` : `${birthday.name} turns ${age} today! 🎉`,
      start: { date: dateString },
      end: { date: dateString },
      recurrence: ['RRULE:FREQ=YEARLY'],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: this.settingsSubject.value.reminderMinutes },
          { method: 'popup', minutes: this.settingsSubject.value.reminderMinutes }
        ]
      }
    };
  }

  updateSettings(settings: GoogleCalendarSettings): void {
    this.settingsSubject.next(settings);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('googleCalendarSettings', JSON.stringify(settings));
    }
  }

  private loadSettings(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('googleCalendarSettings');
      if (stored) {
        try {
          const settings = JSON.parse(stored);
          this.settingsSubject.next(settings);
        } catch (error) {
          // Silent failure for settings loading
        }
      }
    }
  }

  getCurrentSettings(): GoogleCalendarSettings {
    return this.settingsSubject.value;
  }

  isEnabled(): boolean {
    return this.settingsSubject.value.enabled && this.isSignedInSubject.value;
  }
}