import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { NotificationPermissionService } from './notification-permission.service';

describe('NotificationPermissionService', () => {
  let service: NotificationPermissionService;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return localStorageMock[key] || null;
    });

    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    (window as any).Notification = {
      permission: 'default',
      requestPermission: jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('granted'))
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      writable: true,
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [
        NotificationPermissionService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(NotificationPermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupported', () => {
    it('should return true when notifications are supported', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when Notification is not available', () => {
      delete (window as any).Notification;
      expect(service.isSupported()).toBe(false);
      (window as any).Notification = { permission: 'default' };
    });

  });

  describe('getCurrentPermission', () => {
    it('should return default permission', () => {
      (window as any).Notification.permission = 'default';
      expect(service.getCurrentPermission()).toBe('default');
    });

    it('should return granted permission', () => {
      (window as any).Notification.permission = 'granted';
      expect(service.getCurrentPermission()).toBe('granted');
    });

    it('should return denied permission', () => {
      (window as any).Notification.permission = 'denied';
      expect(service.getCurrentPermission()).toBe('denied');
    });

    it('should return denied when notifications not supported', () => {
      delete (window as any).Notification;
      expect(service.getCurrentPermission()).toBe('denied');
      (window as any).Notification = { permission: 'default' };
    });
  });

  describe('hasPermission', () => {
    it('should return true when permission is granted', () => {
      (window as any).Notification.permission = 'granted';
      expect(service.hasPermission()).toBe(true);
    });

    it('should return false when permission is default', () => {
      (window as any).Notification.permission = 'default';
      expect(service.hasPermission()).toBe(false);
    });

    it('should return false when permission is denied', () => {
      (window as any).Notification.permission = 'denied';
      expect(service.hasPermission()).toBe(false);
    });
  });

  describe('requestPermission', () => {
    it('should return false when notifications not supported', async () => {
      delete (window as any).Notification;
      const result = await service.requestPermission();
      expect(result).toBe(false);
      (window as any).Notification = { permission: 'default' };
    });

    it('should return true when already granted', async () => {
      (window as any).Notification.permission = 'granted';
      const result = await service.requestPermission();
      expect(result).toBe(true);
    });

    it('should return false when already denied', async () => {
      (window as any).Notification.permission = 'denied';
      const result = await service.requestPermission();
      expect(result).toBe(false);
    });

    it('should request permission and return true on granted', async () => {
      (window as any).Notification.permission = 'default';
      (window as any).Notification.requestPermission = jasmine.createSpy().and.returnValue(Promise.resolve('granted'));

      const result = await service.requestPermission();

      expect(result).toBe(true);
      expect((window as any).Notification.requestPermission).toHaveBeenCalled();
    });

    it('should request permission and return false on denied', async () => {
      (window as any).Notification.permission = 'default';
      (window as any).Notification.requestPermission = jasmine.createSpy().and.returnValue(Promise.resolve('denied'));

      const result = await service.requestPermission();

      expect(result).toBe(false);
    });

    it('should save permission state to localStorage', async () => {
      (window as any).Notification.permission = 'default';
      (window as any).Notification.requestPermission = jasmine.createSpy().and.returnValue(Promise.resolve('granted'));

      await service.requestPermission();

      expect(localStorage.setItem).toHaveBeenCalledWith('notificationPermissionRequested', 'true');
      expect(localStorage.setItem).toHaveBeenCalledWith('notificationPermissionGranted', 'true');
    });

    it('should handle request permission error', async () => {
      (window as any).Notification.permission = 'default';
      (window as any).Notification.requestPermission = jasmine.createSpy().and.returnValue(Promise.reject('Error'));

      const result = await service.requestPermission();

      expect(result).toBe(false);
    });
  });

  describe('hasBeenAsked', () => {
    it('should return false when not asked', () => {
      expect(service.hasBeenAsked()).toBe(false);
    });

    it('should return true when asked before', () => {
      localStorageMock['notificationPermissionRequested'] = 'true';
      expect(service.hasBeenAsked()).toBe(true);
    });

    it('should return false on server', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          NotificationPermissionService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(NotificationPermissionService);
      expect(serverService.hasBeenAsked()).toBe(false);
    });
  });

  describe('showTestNotification', () => {
    it('should not show notification when no permission', async () => {
      (window as any).Notification.permission = 'denied';
      await expectAsync(service.showTestNotification()).toBeResolved();
    });

    it('should show test notification when permission granted', async () => {
      (window as any).Notification.permission = 'granted';
      const mockRegistration = {
        showNotification: jasmine.createSpy('showNotification').and.returnValue(Promise.resolve())
      };
      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve(mockRegistration),
        configurable: true
      });

      await service.showTestNotification();

      expect(mockRegistration.showNotification).toHaveBeenCalledWith(
        '🎂 Birthday Reminder Test',
        jasmine.objectContaining({
          body: 'Notifications are working correctly!',
          tag: 'test-notification'
        })
      );
    });

    it('should handle showNotification error', async () => {
      (window as any).Notification.permission = 'granted';
      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.reject('Error'),
        configurable: true
      });

      await expectAsync(service.showTestNotification()).toBeResolved();
    });
  });

  describe('getStats', () => {
    it('should return stats when supported', () => {
      (window as any).Notification.permission = 'granted';
      localStorageMock['notificationPermissionRequested'] = 'true';

      const stats = service.getStats();

      expect(stats).toEqual({
        supported: true,
        permission: 'granted',
        hasBeenAsked: true,
        canAskAgain: false
      });
    });

    it('should return canAskAgain true when permission is default', () => {
      (window as any).Notification.permission = 'default';

      const stats = service.getStats();

      expect(stats.canAskAgain).toBe(true);
    });

    it('should return canAskAgain false when permission is denied', () => {
      (window as any).Notification.permission = 'denied';

      const stats = service.getStats();

      expect(stats.canAskAgain).toBe(false);
    });

    it('should return supported false when not available', () => {
      delete (window as any).Notification;

      const stats = service.getStats();

      expect(stats.supported).toBe(false);
      (window as any).Notification = { permission: 'default' };
    });
  });

  describe('permissionStatus observable', () => {
    it('should expose permissionStatus observable', (done) => {
      service.permissionStatus.subscribe(status => {
        expect(['default', 'granted', 'denied']).toContain(status);
        done();
      });
    });
  });
});
