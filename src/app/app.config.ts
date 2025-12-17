import { ApplicationConfig, isDevMode, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { NotificationService, GlobalErrorHandler, ThemeService } from './core';
import { provideServiceWorker } from '@angular/service-worker';
import { birthdayReducer } from './core/store/birthday/birthday.reducer';
import { BirthdayEffects } from './core/store/birthday/birthday.effects';
import { categoryReducer } from './core/store/category/category.reducer';
import { CategoryEffects } from './core/store/category/category.effects';
import { uiReducer } from './core/store/ui/ui.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideStore({
      birthdays: birthdayReducer,
      categories: categoryReducer,
      ui: uiReducer
    }),
    provideEffects([BirthdayEffects, CategoryEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75
    }),
    NotificationService,
    ThemeService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
]
};