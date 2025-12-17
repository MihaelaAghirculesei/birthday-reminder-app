import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { GoogleCalendarService } from './google-calendar.service';
import type { GapiUser, GapiAuthInstance, Gapi } from './google-api.types';

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;

  beforeEach(() => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');

    TestBed.configureTestingModule({
      providers: [
        GoogleCalendarService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(GoogleCalendarService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should have default settings', () => {
    const settings = service.getCurrentSettings();
    expect(settings.enabled).toBe(false);
    expect(settings.calendarId).toBe('primary');
  });

  it('should update settings and save to localStorage', () => {
    const newSettings = { enabled: true, calendarId: 'custom', syncMode: 'two-way' as const, reminderMinutes: 60 };
    service.updateSettings(newSettings);
    expect(localStorage.setItem).toHaveBeenCalledWith('googleCalendarSettings', JSON.stringify(newSettings));
  });


  it('should check if calendar is enabled', () => {
    expect(service.isEnabled()).toBe(false);
    service.updateSettings({ ...service.getCurrentSettings(), enabled: true });
    expect(service.isEnabled()).toBe(false);
  });

  describe('Token Refresh', () => {
    let mockUser: GapiUser;
    let mockAuthInstance: GapiAuthInstance;

    beforeEach(() => {
      const getAuthResponseSpy = jasmine.createSpy('getAuthResponse').and.returnValue({
        expires_at: Date.now() + 60000
      });
      const reloadAuthResponseSpy = jasmine.createSpy('reloadAuthResponse').and.returnValue(Promise.resolve());

      mockUser = {
        getAuthResponse: getAuthResponseSpy as unknown as (includeAuthorizationData?: boolean) => { expires_at: number },
        reloadAuthResponse: reloadAuthResponseSpy as unknown as () => Promise<void>
      };

      mockAuthInstance = {
        currentUser: {
          get: jasmine.createSpy('get').and.returnValue(mockUser) as unknown as () => GapiUser
        },
        isSignedIn: {
          get: jasmine.createSpy('get').and.returnValue(true) as unknown as () => boolean,
          listen: jasmine.createSpy('listen') as unknown as (listener: (isSignedIn: boolean) => void) => void
        },
        signIn: jasmine.createSpy('signIn').and.returnValue(Promise.resolve()) as unknown as () => Promise<void>,
        signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve()) as unknown as () => Promise<void>
      };

      window.gapi = {
        auth2: {
          getAuthInstance: jasmine.createSpy('getAuthInstance').and.returnValue(mockAuthInstance) as unknown as () => GapiAuthInstance
        },
        client: {
          calendar: {
            calendarList: {
              list: jasmine.createSpy('list').and.returnValue(Promise.resolve({ result: { items: [] } })) as unknown as () => Promise<{ result: { items: { id: string; summary: string }[] } }>
            },
            events: {
              insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ result: { id: 'event123' } })) as unknown as (params: unknown) => Promise<{ result: { id?: string; [key: string]: unknown } }>,
              update: jasmine.createSpy('update').and.returnValue(Promise.resolve({ result: {} })) as unknown as (params: unknown) => Promise<{ result: { id?: string; [key: string]: unknown } }>,
              delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve({ result: {} })) as unknown as (params: unknown) => Promise<{ result: { id?: string; [key: string]: unknown } }>
            }
          },
          init: jasmine.createSpy('init').and.returnValue(Promise.resolve()) as unknown as (config: { apiKey: string; clientId: string; discoveryDocs: string[]; scope: string }) => Promise<void>
        },
        load: jasmine.createSpy('load') as unknown as (libraries: string, callback: () => void) => void
      };
    });

    it('should refresh token when expiring soon', async () => {
      (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; ensureValidToken: () => Promise<void> }).isInitialized = true;
      (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; ensureValidToken: () => Promise<void> }).isSignedInSubject.next(true);
      (mockUser.getAuthResponse as jasmine.Spy).and.returnValue({ expires_at: Date.now() + 200000 });

      await (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; ensureValidToken: () => Promise<void> }).ensureValidToken();

      expect(mockUser.reloadAuthResponse).toHaveBeenCalled();
    });

    it('should not refresh token when valid', async () => {
      (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; ensureValidToken: () => Promise<void> }).isInitialized = true;
      (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; ensureValidToken: () => Promise<void> }).isSignedInSubject.next(true);
      (mockUser.getAuthResponse as jasmine.Spy).and.returnValue({ expires_at: Date.now() + 600000 });

      await (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; ensureValidToken: () => Promise<void> }).ensureValidToken();

      expect(mockUser.reloadAuthResponse).not.toHaveBeenCalled();
    });

    it('should retry on 401 error', async () => {
      (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; executeWithRetry: (op: () => Promise<unknown>) => Promise<unknown> }).isInitialized = true;
      (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; executeWithRetry: (op: () => Promise<unknown>) => Promise<unknown> }).isSignedInSubject.next(true);
      (mockUser.getAuthResponse as jasmine.Spy).and.returnValue({ expires_at: Date.now() + 600000 });

      const error401 = { result: { error: { code: 401 } } };
      let callCount = 0;

      const operation = jasmine.createSpy('operation').and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(error401);
        }
        return Promise.resolve({ result: { items: [] } });
      });

      await (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void }; executeWithRetry: (op: () => Promise<unknown>) => Promise<unknown> }).executeWithRetry(operation);

      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockUser.reloadAuthResponse).toHaveBeenCalled();
    });
  });

  describe('Calendar Operations', () => {
    let mockUser: GapiUser;
    let mockAuthInstance: GapiAuthInstance;

    beforeEach(() => {
      const getAuthResponseSpy = jasmine.createSpy('getAuthResponse').and.returnValue({
        expires_at: Date.now() + 600000
      });
      const reloadAuthResponseSpy = jasmine.createSpy('reloadAuthResponse').and.returnValue(Promise.resolve());

      mockUser = {
        getAuthResponse: getAuthResponseSpy as unknown as (includeAuthorizationData?: boolean) => { expires_at: number },
        reloadAuthResponse: reloadAuthResponseSpy as unknown as () => Promise<void>
      };

      mockAuthInstance = {
        currentUser: {
          get: jasmine.createSpy('get').and.returnValue(mockUser) as unknown as () => GapiUser
        },
        isSignedIn: {
          get: jasmine.createSpy('get').and.returnValue(true) as unknown as () => boolean,
          listen: jasmine.createSpy('listen') as unknown as (listener: (isSignedIn: boolean) => void) => void
        },
        signIn: jasmine.createSpy('signIn').and.returnValue(Promise.resolve()) as unknown as () => Promise<void>,
        signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve()) as unknown as () => Promise<void>
      };

      window.gapi = {
        auth2: {
          getAuthInstance: jasmine.createSpy('getAuthInstance').and.returnValue(mockAuthInstance) as unknown as () => GapiAuthInstance
        },
        client: {
          calendar: {
            calendarList: {
              list: jasmine.createSpy('list').and.returnValue(Promise.resolve({
                result: {
                  items: [
                    { id: 'primary', summary: 'Primary Calendar' },
                    { id: 'custom', summary: 'Custom Calendar' }
                  ]
                }
              })) as unknown as () => Promise<{ result: { items: { id: string; summary: string }[] } }>
            },
            events: {
              insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ result: { id: 'event123' } })) as unknown as (params: unknown) => Promise<{ result: { id?: string; [key: string]: unknown } }>,
              update: jasmine.createSpy('update').and.returnValue(Promise.resolve({ result: {} })) as unknown as (params: unknown) => Promise<{ result: { id?: string; [key: string]: unknown } }>,
              delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve({ result: {} })) as unknown as (params: unknown) => Promise<{ result: { id?: string; [key: string]: unknown } }>
            }
          },
          init: jasmine.createSpy('init').and.returnValue(Promise.resolve()) as unknown as (config: { apiKey: string; clientId: string; discoveryDocs: string[]; scope: string }) => Promise<void>
        },
        load: jasmine.createSpy('load') as unknown as (libraries: string, callback: () => void) => void
      };

      (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void } }).isInitialized = true;
      (service as unknown as { isInitialized: boolean; isSignedInSubject: { next: (value: boolean) => void } }).isSignedInSubject.next(true);
      service.updateSettings({ enabled: true, calendarId: 'primary', syncMode: 'one-way', reminderMinutes: 1440 });
    });

    it('should get calendars list', async () => {
      const calendars = await service.getCalendars();
      expect(calendars.length).toBe(2);
      expect(calendars[0].id).toBe('primary');
      expect(calendars[1].summary).toBe('Custom Calendar');
    });

    it('should throw error when getting calendars while not signed in', async () => {
      (service as unknown as { isSignedInSubject: { next: (value: boolean) => void } }).isSignedInSubject.next(false);
      try {
        await service.getCalendars();
        fail('Should have thrown error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Not signed in');
      }
    });

    it('should sync birthday to calendar', async () => {
      const birthday = {
        id: '1',
        name: 'John Doe',
        birthDate: new Date(1990, 5, 15),
        categoryId: 'cat1',
        reminderDays: 7
      };

      const eventId = await service.syncBirthdayToCalendar(birthday);

      expect(eventId).toBe('event123');
      expect(window.gapi?.client.calendar.events.insert).toHaveBeenCalled();
    });

    it('should throw error when syncing birthday while not enabled', async () => {
      service.updateSettings({ enabled: false, calendarId: 'primary', syncMode: 'one-way', reminderMinutes: 1440 });
      const birthday = {
        id: '1',
        name: 'John Doe',
        birthDate: new Date(1990, 5, 15),
        categoryId: 'cat1',
        reminderDays: 7
      };

      try {
        await service.syncBirthdayToCalendar(birthday);
        fail('Should have thrown error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('not enabled');
      }
    });

    it('should update birthday in calendar', async () => {
      const birthday = {
        id: '1',
        name: 'Jane Smith',
        birthDate: new Date(1985, 11, 25),
        categoryId: 'cat1',
        reminderDays: 3
      };

      await service.updateBirthdayInCalendar(birthday, 'event456');

      expect(window.gapi?.client.calendar.events.update).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event456',
        resource: jasmine.any(Object)
      });
    });

    it('should delete birthday from calendar', async () => {
      await service.deleteBirthdayFromCalendar('event789');

      expect(window.gapi?.client.calendar.events.delete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event789'
      });
    });

    it('should not delete birthday when not enabled', async () => {
      service.updateSettings({ enabled: false, calendarId: 'primary', syncMode: 'one-way', reminderMinutes: 1440 });
      await service.deleteBirthdayFromCalendar('event789');
      expect(window.gapi?.client.calendar.events.delete).not.toHaveBeenCalled();
    });

    it('should sync all birthdays and report results', async () => {
      const birthdays = [
        { id: '1', name: 'John', birthDate: new Date(1990, 5, 15), categoryId: 'cat1', reminderDays: 7 },
        { id: '2', name: 'Jane', birthDate: new Date(1985, 11, 25), categoryId: 'cat1', reminderDays: 3 }
      ];

      const results = await service.syncAllBirthdays(birthdays);

      expect(results.success).toBe(2);
      expect(results.failed).toBe(0);
      expect(results.errors.length).toBe(0);
    });

    it('should handle errors during batch sync', async () => {
      if (window.gapi) {
        window.gapi.client.calendar.events.insert = jasmine.createSpy('insert').and.callFake(() => {
          return Promise.reject(new Error('API error'));
        }) as unknown as (params: unknown) => Promise<{ result: { id?: string; [key: string]: unknown } }>;
      }

      const birthdays = [
        { id: '1', name: 'John', birthDate: new Date(1990, 5, 15), categoryId: 'cat1', reminderDays: 7 },
        { id: '2', name: 'Jane', birthDate: new Date(1985, 11, 25), categoryId: 'cat1', reminderDays: 3 }
      ];

      const results = await service.syncAllBirthdays(birthdays);

      expect(results.success).toBe(0);
      expect(results.failed).toBe(2);
      expect(results.errors.length).toBe(2);
      expect(results.errors[0]).toContain('John');
    });
  });
});
