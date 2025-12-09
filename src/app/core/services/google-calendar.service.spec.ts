import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { GoogleCalendarService } from './google-calendar.service';

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

  it('should load settings from localStorage', () => {
    const stored = { enabled: true, calendarId: 'test', syncMode: 'two-way' as const, reminderMinutes: 720 };
    (localStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(stored));
    const newService = new GoogleCalendarService('browser');
    expect(newService.getCurrentSettings()).toEqual(stored);
  });

  it('should check if calendar is enabled', () => {
    expect(service.isEnabled()).toBe(false);
    service.updateSettings({ ...service.getCurrentSettings(), enabled: true });
    expect(service.isEnabled()).toBe(false); // still false because not signed in
  });

  describe('Token Refresh', () => {
    let mockUser: any;
    let mockAuthInstance: any;

    beforeEach(() => {
      mockUser = {
        getAuthResponse: jasmine.createSpy('getAuthResponse').and.returnValue({
          expires_at: Date.now() + 60000
        }),
        reloadAuthResponse: jasmine.createSpy('reloadAuthResponse').and.returnValue(Promise.resolve())
      };

      mockAuthInstance = {
        currentUser: {
          get: jasmine.createSpy('get').and.returnValue(mockUser)
        }
      };

      (window as any).gapi = {
        auth2: {
          getAuthInstance: jasmine.createSpy('getAuthInstance').and.returnValue(mockAuthInstance)
        },
        client: {
          calendar: {
            calendarList: {
              list: jasmine.createSpy('list').and.returnValue(Promise.resolve({ result: { items: [] } }))
            },
            events: {
              insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ result: { id: 'event123' } })),
              update: jasmine.createSpy('update').and.returnValue(Promise.resolve({ result: {} })),
              delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve({ result: {} }))
            }
          }
        }
      };
    });

    it('should refresh token when expiring soon', async () => {
      (service as any).isInitialized = true;
      (service as any).isSignedInSubject.next(true);
      mockUser.getAuthResponse.and.returnValue({ expires_at: Date.now() + 200000 });

      await (service as any).ensureValidToken();

      expect(mockUser.reloadAuthResponse).toHaveBeenCalled();
    });

    it('should not refresh token when valid', async () => {
      (service as any).isInitialized = true;
      (service as any).isSignedInSubject.next(true);
      mockUser.getAuthResponse.and.returnValue({ expires_at: Date.now() + 600000 });

      await (service as any).ensureValidToken();

      expect(mockUser.reloadAuthResponse).not.toHaveBeenCalled();
    });

    it('should retry on 401 error', async () => {
      (service as any).isInitialized = true;
      (service as any).isSignedInSubject.next(true);
      mockUser.getAuthResponse.and.returnValue({ expires_at: Date.now() + 600000 });

      const error401 = { result: { error: { code: 401 } } };
      let callCount = 0;

      const operation = jasmine.createSpy('operation').and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(error401);
        }
        return Promise.resolve({ result: { items: [] } });
      });

      const result = await (service as any).executeWithRetry(operation);

      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockUser.reloadAuthResponse).toHaveBeenCalled();
    });
  });

  describe('Calendar Operations', () => {
    let mockUser: any;
    let mockAuthInstance: any;

    beforeEach(() => {
      mockUser = {
        getAuthResponse: jasmine.createSpy('getAuthResponse').and.returnValue({
          expires_at: Date.now() + 600000
        }),
        reloadAuthResponse: jasmine.createSpy('reloadAuthResponse').and.returnValue(Promise.resolve())
      };

      mockAuthInstance = {
        currentUser: {
          get: jasmine.createSpy('get').and.returnValue(mockUser)
        }
      };

      (window as any).gapi = {
        auth2: {
          getAuthInstance: jasmine.createSpy('getAuthInstance').and.returnValue(mockAuthInstance)
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
              }))
            },
            events: {
              insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ result: { id: 'event123' } })),
              update: jasmine.createSpy('update').and.returnValue(Promise.resolve({ result: {} })),
              delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve({ result: {} }))
            }
          }
        }
      };

      (service as any).isInitialized = true;
      (service as any).isSignedInSubject.next(true);
      service.updateSettings({ enabled: true, calendarId: 'primary', syncMode: 'one-way', reminderMinutes: 1440 });
    });

    it('should get calendars list', async () => {
      const calendars = await service.getCalendars();
      expect(calendars.length).toBe(2);
      expect(calendars[0].id).toBe('primary');
      expect(calendars[1].summary).toBe('Custom Calendar');
    });

    it('should throw error when getting calendars while not signed in', async () => {
      (service as any).isSignedInSubject.next(false);
      try {
        await service.getCalendars();
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Not signed in');
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
      expect((window as any).gapi.client.calendar.events.insert).toHaveBeenCalled();
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
      } catch (error: any) {
        expect(error.message).toContain('not enabled');
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

      expect((window as any).gapi.client.calendar.events.update).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event456',
        resource: jasmine.any(Object)
      });
    });

    it('should delete birthday from calendar', async () => {
      await service.deleteBirthdayFromCalendar('event789');

      expect((window as any).gapi.client.calendar.events.delete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event789'
      });
    });

    it('should not delete birthday when not enabled', async () => {
      service.updateSettings({ enabled: false, calendarId: 'primary', syncMode: 'one-way', reminderMinutes: 1440 });
      await service.deleteBirthdayFromCalendar('event789');
      expect((window as any).gapi.client.calendar.events.delete).not.toHaveBeenCalled();
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
      (window as any).gapi.client.calendar.events.insert = jasmine.createSpy('insert').and.callFake(() => {
        return Promise.reject(new Error('API error'));
      });

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
