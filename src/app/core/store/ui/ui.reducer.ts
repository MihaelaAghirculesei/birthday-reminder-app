import { createReducer, on } from '@ngrx/store';
import { initialUIState } from './ui.state';
import * as UIActions from './ui.actions';

export const uiReducer = createReducer(
  initialUIState,

  on(UIActions.toggleDarkMode, (state) => ({
    ...state,
    darkMode: !state.darkMode
  })),

  on(UIActions.setDarkMode, (state, { enabled }) => ({
    ...state,
    darkMode: enabled
  }))
);
