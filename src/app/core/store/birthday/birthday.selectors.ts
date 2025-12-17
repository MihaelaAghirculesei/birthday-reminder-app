import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BirthdayState } from './birthday.state';
import { birthdayAdapter } from './birthday.reducer';
import { Birthday } from '../../../shared/models/birthday.model';
import { calculateAge, DEFAULT_CATEGORY } from '../../../shared';
import { getNextBirthdayDate, getDaysUntilBirthday } from '../../../shared/utils/date.utils';

export const selectBirthdayState = createFeatureSelector<BirthdayState>('birthdays');

const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = birthdayAdapter.getSelectors(selectBirthdayState);

export const selectAllBirthdays = selectAll;
export const selectBirthdayEntities = selectEntities;
export const selectBirthdayIds = selectIds;
export const selectBirthdayTotal = selectTotal;

export const selectBirthdayLoading = createSelector(
  selectBirthdayState,
  (state) => state.loading
);

export const selectBirthdayError = createSelector(
  selectBirthdayState,
  (state) => state.error
);

export const selectSelectedBirthdayId = createSelector(
  selectBirthdayState,
  (state) => state.selectedId
);

export const selectSelectedBirthday = createSelector(
  selectBirthdayEntities,
  selectSelectedBirthdayId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

export const selectBirthdayFilters = createSelector(
  selectBirthdayState,
  (state) => state.filters
);

export const selectSearchTerm = createSelector(
  selectBirthdayFilters,
  (filters) => filters.searchTerm
);

export const selectSelectedMonth = createSelector(
  selectBirthdayFilters,
  (filters) => filters.selectedMonth
);

export const selectSelectedCategory = createSelector(
  selectBirthdayFilters,
  (filters) => filters.selectedCategory
);

export const selectSortOrder = createSelector(
  selectBirthdayFilters,
  (filters) => filters.sortOrder
);

export const selectFilteredBirthdays = createSelector(
  selectAllBirthdays,
  selectBirthdayFilters,
  (birthdays, filters) => {
    let filtered = [...birthdays];

    if (filters.searchTerm.trim()) {
      filtered = filtered.filter(birthday =>
        birthday.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.selectedMonth !== null) {
      filtered = filtered.filter(birthday =>
        birthday.birthDate.getMonth() === filters.selectedMonth
      );
    }

    if (filters.selectedCategory !== null) {
      filtered = filtered.filter(birthday =>
        (birthday.category || DEFAULT_CATEGORY) === filters.selectedCategory
      );
    }

    filtered.sort((a, b) => {
      switch (filters.sortOrder) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'age':
          return calculateAge(b.birthDate) - calculateAge(a.birthDate);
        case 'nextBirthday':
          const nextA = getNextBirthdayDate(a.birthDate);
          const nextB = getNextBirthdayDate(b.birthDate);
          return nextA.getTime() - nextB.getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }
);

export const selectUpcomingBirthdays = (days = 30) => createSelector(
  selectAllBirthdays,
  (birthdays) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return birthdays
      .filter(birthday => {
        const nextBirthday = getNextBirthdayDate(birthday.birthDate);
        return nextBirthday >= today && nextBirthday <= futureDate;
      })
      .sort((a, b) => {
        const nextA = getNextBirthdayDate(a.birthDate);
        const nextB = getNextBirthdayDate(b.birthDate);
        return nextA.getTime() - nextB.getTime();
      });
  }
);

export const selectBirthdaysThisMonth = createSelector(
  selectAllBirthdays,
  (birthdays) => {
    const currentMonth = new Date().getMonth();
    return birthdays.filter(birthday =>
      birthday.birthDate.getMonth() === currentMonth
    );
  }
);

export const selectNext5Birthdays = createSelector(
  selectAllBirthdays,
  (birthdays) => {
    return birthdays
      .map(birthday => ({
        ...birthday,
        nextBirthday: getNextBirthdayDate(birthday.birthDate),
        daysUntil: getDaysUntilBirthday(birthday.birthDate)
      }))
      .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
      .slice(0, 5);
  }
);

export const selectAverageAge = createSelector(
  selectAllBirthdays,
  (birthdays) => {
    if (birthdays.length === 0) return 0;
    const totalAge = birthdays.reduce((sum, birthday) =>
      sum + calculateAge(birthday.birthDate), 0
    );
    return Math.round(totalAge / birthdays.length);
  }
);

export const selectBirthdaysByMonth = createSelector(
  selectAllBirthdays,
  (birthdays) => {
    const monthCounts = new Array(12).fill(0);

    birthdays.forEach(birthday => {
      monthCounts[birthday.birthDate.getMonth()]++;
    });

    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return MONTHS_SHORT.map((month, index) => ({
      month,
      count: monthCounts[index],
      monthIndex: index
    }));
  }
);

export const selectMessagesByBirthday = (birthdayId: string) => createSelector(
  selectBirthdayEntities,
  (entities) => {
    const birthday = entities[birthdayId];
    return birthday?.scheduledMessages || [];
  }
);

export const selectBirthdayById = (id: string) => createSelector(
  selectBirthdayEntities,
  (entities) => entities[id]
);
