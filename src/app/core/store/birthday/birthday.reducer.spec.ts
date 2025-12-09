import { birthdayReducer, initialBirthdayState } from './birthday.reducer';
import * as BirthdayActions from './birthday.actions';
import { Birthday } from '../../../shared/models/birthday.model';

describe('Birthday Reducer', () => {
  const mockBirthday: Birthday = {
    id: '1',
    name: 'John Doe',
    birthDate: new Date(1990, 4, 15),
    category: 'friends'
  };

  it('should return initial state', () => {
    const action = { type: 'Unknown' };
    const state = birthdayReducer(undefined, action);

    expect(state).toBe(initialBirthdayState);
  });

  describe('Load Actions', () => {
    it('should set loading on loadBirthdays', () => {
      const action = BirthdayActions.loadBirthdays();
      const state = birthdayReducer(initialBirthdayState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should load birthdays on success', () => {
      const birthdays = [mockBirthday];
      const action = BirthdayActions.loadBirthdaysSuccess({ birthdays });
      const state = birthdayReducer(initialBirthdayState, action);

      expect(state.entities['1']).toEqual(mockBirthday);
      expect(state.ids).toEqual(['1']);
      expect(state.loading).toBe(false);
    });

    it('should set error on loadBirthdaysFailure', () => {
      const error = 'Load error';
      const action = BirthdayActions.loadBirthdaysFailure({ error });
      const state = birthdayReducer(initialBirthdayState, action);

      expect(state.error).toBe(error);
      expect(state.loading).toBe(false);
    });
  });

  describe('Add Actions', () => {
    it('should add birthday on success', () => {
      const action = BirthdayActions.addBirthdaySuccess({ birthday: mockBirthday });
      const state = birthdayReducer(initialBirthdayState, action);

      expect(state.entities['1']).toEqual(mockBirthday);
      expect(state.loading).toBe(false);
    });
  });

  describe('Update Actions', () => {
    it('should update birthday on success', () => {
      const initialState = birthdayReducer(
        initialBirthdayState,
        BirthdayActions.addBirthdaySuccess({ birthday: mockBirthday })
      );

      const updated = { ...mockBirthday, name: 'Jane Doe' };
      const action = BirthdayActions.updateBirthdaySuccess({ birthday: updated });
      const state = birthdayReducer(initialState, action);

      expect(state.entities['1']?.name).toBe('Jane Doe');
    });
  });

  describe('Delete Actions', () => {
    it('should delete birthday on success', () => {
      const initialState = birthdayReducer(
        initialBirthdayState,
        BirthdayActions.addBirthdaySuccess({ birthday: mockBirthday })
      );

      const action = BirthdayActions.deleteBirthdaySuccess({ id: '1' });
      const state = birthdayReducer(initialState, action);

      expect(state.entities['1']).toBeUndefined();
      expect(state.ids.length).toBe(0);
    });

    it('should clear selectedId if deleted birthday was selected', () => {
      let state = birthdayReducer(
        initialBirthdayState,
        BirthdayActions.addBirthdaySuccess({ birthday: mockBirthday })
      );
      state = birthdayReducer(state, BirthdayActions.selectBirthday({ id: '1' }));

      const action = BirthdayActions.deleteBirthdaySuccess({ id: '1' });
      const newState = birthdayReducer(state, action);

      expect(newState.selectedId).toBeNull();
    });
  });

  describe('Filter Actions', () => {
    it('should update filters', () => {
      let state = birthdayReducer(initialBirthdayState, BirthdayActions.setSearchTerm({ searchTerm: 'John' }));
      expect(state.filters.searchTerm).toBe('John');

      state = birthdayReducer(state, BirthdayActions.setSelectedMonth({ month: 4 }));
      expect(state.filters.selectedMonth).toBe(4);

      state = birthdayReducer(state, BirthdayActions.setSelectedCategory({ category: 'family' }));
      expect(state.filters.selectedCategory).toBe('family');

      state = birthdayReducer(state, BirthdayActions.setSortOrder({ sortOrder: 'age' }));
      expect(state.filters.sortOrder).toBe('age');
    });

    it('should clear filters', () => {
      let state = birthdayReducer(initialBirthdayState, BirthdayActions.setSearchTerm({ searchTerm: 'test' }));
      state = birthdayReducer(state, BirthdayActions.clearFilters());
      expect(state.filters.searchTerm).toBe('');
    });
  });

  it('should select birthday', () => {
    const state = birthdayReducer(initialBirthdayState, BirthdayActions.selectBirthday({ id: '1' }));
    expect(state.selectedId).toBe('1');
  });

  it('should clear all birthdays', () => {
    let state = birthdayReducer(initialBirthdayState, BirthdayActions.addBirthdaySuccess({ birthday: mockBirthday }));
    state = birthdayReducer(state, BirthdayActions.clearAllBirthdaysSuccess());
    expect(state.ids.length).toBe(0);
    expect(state.selectedId).toBeNull();
  });
});
