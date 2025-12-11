import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UIState } from './ui.state';

export const selectUIState = createFeatureSelector<UIState>('ui');

export const selectDarkMode = createSelector(
  selectUIState,
  (state: UIState) => state.darkMode
);
