import { createAction, props } from '@ngrx/store';

export const toggleDarkMode = createAction('[UI] Toggle Dark Mode');

export const setDarkMode = createAction(
  '[UI] Set Dark Mode',
  props<{ enabled: boolean }>()
);
