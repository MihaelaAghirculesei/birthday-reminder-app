import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { ThemeService } from './theme.service';
import * as UIActions from '../store/ui/ui.actions';

describe('ThemeService', () => {
  let service: ThemeService;
  let storeSpy: jasmine.SpyObj<Store>;
  let darkModeSubject: BehaviorSubject<boolean>;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    darkModeSubject = new BehaviorSubject<boolean>(false);

    const storeSpyObj = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    storeSpyObj.select.and.returnValue(darkModeSubject.asObservable());

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return localStorageMock[key] || null;
    });

    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: Store, useValue: storeSpyObj },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    storeSpy = TestBed.inject(Store) as jasmine.SpyObj<Store>;
  });

  it('should be created', () => {
    service = TestBed.inject(ThemeService);
    expect(service).toBeTruthy();
  });

  describe('Browser initialization', () => {
    it('should initialize with light theme when no saved preference', () => {
      service = TestBed.inject(ThemeService);

      expect(storeSpy.dispatch).toHaveBeenCalledWith(
        UIActions.setDarkMode({ enabled: false })
      );
    });

    it('should initialize with dark theme when saved preference is true', () => {
      localStorageMock['birthday-app-dark-mode'] = 'true';
      service = TestBed.inject(ThemeService);

      expect(storeSpy.dispatch).toHaveBeenCalledWith(
        UIActions.setDarkMode({ enabled: true })
      );
    });

    it('should apply dark theme class to body when enabled', () => {
      service = TestBed.inject(ThemeService);
      darkModeSubject.next(true);

      expect(document.body.classList.contains('dark-theme')).toBe(true);
    });

    it('should remove dark theme class from body when disabled', () => {
      document.body.classList.add('dark-theme');
      service = TestBed.inject(ThemeService);
      darkModeSubject.next(false);

      expect(document.body.classList.contains('dark-theme')).toBe(false);
    });

    it('should save theme preference to localStorage', () => {
      service = TestBed.inject(ThemeService);
      darkModeSubject.next(true);

      expect(localStorage.setItem).toHaveBeenCalledWith('birthday-app-dark-mode', 'true');
    });

    it('should update localStorage when theme changes', () => {
      service = TestBed.inject(ThemeService);
      darkModeSubject.next(true);
      darkModeSubject.next(false);

      expect(localStorage.setItem).toHaveBeenCalledWith('birthday-app-dark-mode', 'false');
    });
  });

  describe('Server-side rendering', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: Store, useValue: storeSpy },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
    });

    it('should not initialize theme on server', () => {
      storeSpy.dispatch.calls.reset();
      service = TestBed.inject(ThemeService);

      expect(storeSpy.dispatch).not.toHaveBeenCalled();
    });

    it('should not access localStorage on server', () => {
      (localStorage.getItem as jasmine.Spy).calls.reset();
      service = TestBed.inject(ThemeService);

      expect(localStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe('toggleDarkMode', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
      storeSpy.dispatch.calls.reset();
    });

    it('should dispatch toggleDarkMode action', () => {
      service.toggleDarkMode();

      expect(storeSpy.dispatch).toHaveBeenCalledWith(UIActions.toggleDarkMode());
    });
  });

  describe('darkMode$ observable', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should expose darkMode$ observable', (done) => {
      service.darkMode$.subscribe(enabled => {
        expect(typeof enabled).toBe('boolean');
        done();
      });
    });

    it('should emit dark mode changes', (done) => {
      let emissionCount = 0;
      service.darkMode$.subscribe(enabled => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(enabled).toBe(true);
          done();
        }
      });

      darkModeSubject.next(true);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should unsubscribe from darkMode$ on destroy', () => {
      spyOn(darkModeSubject, 'unsubscribe');
      service.ngOnDestroy();

      expect(service['subscription']).toBeDefined();
    });

    it('should not throw if subscription is undefined', () => {
      service['subscription'] = undefined;
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
