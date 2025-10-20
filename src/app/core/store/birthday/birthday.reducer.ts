import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { Birthday } from '../../../shared/models/birthday.model';
import { BirthdayState, initialBirthdayFilters } from './birthday.state';
import * as BirthdayActions from './birthday.actions';

export const birthdayAdapter: EntityAdapter<Birthday> = createEntityAdapter<Birthday>({
  selectId: (birthday: Birthday) => birthday.id,
  sortComparer: false // We'll handle sorting via selectors
});

export const initialBirthdayState: BirthdayState = birthdayAdapter.getInitialState({
  selectedId: null,
  filters: initialBirthdayFilters,
  loading: false,
  error: null
});

export const birthdayReducer = createReducer(
  initialBirthdayState,

  // Load Birthdays
  on(BirthdayActions.loadBirthdays, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(BirthdayActions.loadBirthdaysSuccess, (state, { birthdays }) =>
    birthdayAdapter.setAll(birthdays, {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(BirthdayActions.loadBirthdaysFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Add Birthday
  on(BirthdayActions.addBirthday, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(BirthdayActions.addBirthdaySuccess, (state, { birthday }) =>
    birthdayAdapter.addOne(birthday, {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(BirthdayActions.addBirthdayFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Birthday
  on(BirthdayActions.updateBirthday, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(BirthdayActions.updateBirthdaySuccess, (state, { birthday }) =>
    birthdayAdapter.updateOne(
      { id: birthday.id, changes: birthday },
      {
        ...state,
        loading: false,
        error: null
      }
    )
  ),

  on(BirthdayActions.updateBirthdayFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Birthday
  on(BirthdayActions.deleteBirthday, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(BirthdayActions.deleteBirthdaySuccess, (state, { id }) =>
    birthdayAdapter.removeOne(id, {
      ...state,
      loading: false,
      error: null,
      selectedId: state.selectedId === id ? null : state.selectedId
    })
  ),

  on(BirthdayActions.deleteBirthdayFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Select Birthday
  on(BirthdayActions.selectBirthday, (state, { id }) => ({
    ...state,
    selectedId: id
  })),

  // Filter Actions
  on(BirthdayActions.setSearchTerm, (state, { searchTerm }) => ({
    ...state,
    filters: {
      ...state.filters,
      searchTerm
    }
  })),

  on(BirthdayActions.setSelectedMonth, (state, { month }) => ({
    ...state,
    filters: {
      ...state.filters,
      selectedMonth: month
    }
  })),

  on(BirthdayActions.setSelectedCategory, (state, { category }) => ({
    ...state,
    filters: {
      ...state.filters,
      selectedCategory: category
    }
  })),

  on(BirthdayActions.setSortOrder, (state, { sortOrder }) => ({
    ...state,
    filters: {
      ...state.filters,
      sortOrder
    }
  })),

  on(BirthdayActions.clearFilters, (state) => ({
    ...state,
    filters: initialBirthdayFilters
  })),

  on(BirthdayActions.updateFilters, (state, { filters }) => ({
    ...state,
    filters: {
      ...state.filters,
      ...filters
    }
  })),

  // Clear All
  on(BirthdayActions.clearAllBirthdays, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(BirthdayActions.clearAllBirthdaysSuccess, (state) =>
    birthdayAdapter.removeAll({
      ...state,
      loading: false,
      error: null,
      selectedId: null
    })
  ),

  on(BirthdayActions.clearAllBirthdaysFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Scheduled Messages
  on(BirthdayActions.addMessageToBirthdaySuccess, (state, { birthdayId, message }) => {
    const birthday = state.entities[birthdayId];
    if (!birthday) return state;

    const updatedBirthday = {
      ...birthday,
      scheduledMessages: [...(birthday.scheduledMessages || []), message]
    };

    return birthdayAdapter.updateOne(
      { id: birthdayId, changes: updatedBirthday },
      state
    );
  }),

  on(BirthdayActions.updateMessageInBirthdaySuccess, (state, { birthdayId, messageId, updates }) => {
    const birthday = state.entities[birthdayId];
    if (!birthday?.scheduledMessages) return state;

    const updatedMessages = birthday.scheduledMessages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    );

    const updatedBirthday = {
      ...birthday,
      scheduledMessages: updatedMessages
    };

    return birthdayAdapter.updateOne(
      { id: birthdayId, changes: updatedBirthday },
      state
    );
  }),

  on(BirthdayActions.deleteMessageFromBirthdaySuccess, (state, { birthdayId, messageId }) => {
    const birthday = state.entities[birthdayId];
    if (!birthday?.scheduledMessages) return state;

    const updatedMessages = birthday.scheduledMessages.filter(msg => msg.id !== messageId);

    const updatedBirthday = {
      ...birthday,
      scheduledMessages: updatedMessages
    };

    return birthdayAdapter.updateOne(
      { id: birthdayId, changes: updatedBirthday },
      state
    );
  }),

  // Test Data Loading - no reducer needed for success since addBirthday handles it
  on(BirthdayActions.loadTestData, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(BirthdayActions.loadTestDataSuccess, (state) => ({
    ...state,
    loading: false,
    error: null
  })),

  on(BirthdayActions.loadTestDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
