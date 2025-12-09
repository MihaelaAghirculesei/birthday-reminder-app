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
});
