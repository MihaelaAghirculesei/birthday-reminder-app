import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { selectDarkMode } from '../store/ui/ui.selectors';
import * as UIActions from '../store/ui/ui.actions';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private readonly STORAGE_KEY = 'birthday-app-dark-mode';
  private subscription?: Subscription;
  darkMode$ = this.store.select(selectDarkMode);

  constructor(
    private store: Store<AppState>,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const savedPreference = localStorage.getItem(this.STORAGE_KEY);
    const isDark = savedPreference === 'true';

    this.store.dispatch(UIActions.setDarkMode({ enabled: isDark }));

    this.subscription = this.darkMode$.subscribe(enabled => {
      this.applyTheme(enabled);
      localStorage.setItem(this.STORAGE_KEY, String(enabled));
    });
  }

  private applyTheme(isDark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  toggleDarkMode(): void {
    this.store.dispatch(UIActions.toggleDarkMode());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
