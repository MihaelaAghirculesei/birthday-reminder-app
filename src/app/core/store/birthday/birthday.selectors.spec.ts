import * as fromSelectors from './birthday.selectors';
import { BirthdayState, initialBirthdayFilters } from './birthday.state';
import { Birthday } from '../../../shared/models/birthday.model';

describe('Birthday Selectors', () => {
  const mockBirthdays: Birthday[] = [
    {
      id: '1',
      name: 'Alice',
      birthDate: new Date(1990, 4, 15),
      category: 'friends'
    },
    {
      id: '2',
      name: 'Bob',
      birthDate: new Date(1985, 11, 20),
      category: 'family'
    },
    {
      id: '3',
      name: 'Charlie',
      birthDate: new Date(1995, 4, 10),
      category: 'friends'
    }
  ];

  const mockState: BirthdayState = {
    ids: ['1', '2', '3'],
    entities: {
      '1': mockBirthdays[0],
      '2': mockBirthdays[1],
      '3': mockBirthdays[2]
    },
    selectedId: '1',
    filters: { ...initialBirthdayFilters },
    loading: false,
    error: null
  };

  const state = {
    birthdays: mockState
  };

  it('should select basic state', () => {
    expect(fromSelectors.selectAllBirthdays(state).length).toBe(3);
    expect(fromSelectors.selectBirthdayTotal(state)).toBe(3);
    expect(fromSelectors.selectBirthdayLoading(state)).toBe(false);
    expect(fromSelectors.selectBirthdayError(state)).toBeNull();
    expect(fromSelectors.selectBirthdayFilters(state)).toEqual(initialBirthdayFilters);
  });

  it('should select specific birthday', () => {
    expect(fromSelectors.selectSelectedBirthdayId(state)).toBe('1');
    expect(fromSelectors.selectSelectedBirthday(state)).toEqual(mockBirthdays[0]);
  });

  describe('Filtered Birthdays', () => {
    it('should filter by search term', () => {
      const stateWithSearch = {
        birthdays: {
          ...mockState,
          filters: { ...initialBirthdayFilters, searchTerm: 'ali' }
        }
      };

      const result = fromSelectors.selectFilteredBirthdays(stateWithSearch);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Alice');
    });

    it('should filter by month', () => {
      const stateWithMonth = {
        birthdays: {
          ...mockState,
          filters: { ...initialBirthdayFilters, selectedMonth: 4 }
        }
      };

      const result = fromSelectors.selectFilteredBirthdays(stateWithMonth);
      expect(result.length).toBe(2);
    });

    it('should filter by category', () => {
      const stateWithCategory = {
        birthdays: {
          ...mockState,
          filters: { ...initialBirthdayFilters, selectedCategory: 'family' }
        }
      };

      const result = fromSelectors.selectFilteredBirthdays(stateWithCategory);
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('family');
    });

    it('should sort by name', () => {
      const result = fromSelectors.selectFilteredBirthdays(state);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });
  });

  it('should calculate statistics', () => {
    expect(fromSelectors.selectAverageAge(state)).toBeGreaterThan(0);
    const byMonth = fromSelectors.selectBirthdaysByMonth(state);
    expect(byMonth.length).toBe(12);
    expect(byMonth[4].count).toBe(2);
  });

  it('should select birthday by id', () => {
    const selector = fromSelectors.selectBirthdayById('2');
    expect(selector(state)).toEqual(mockBirthdays[1]);
  });
});
