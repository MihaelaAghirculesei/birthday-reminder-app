import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Birthday, ScheduledMessage } from '../../shared/models/birthday.model';
import { AppState } from '../store/app.state';
import * as BirthdayActions from '../store/birthday/birthday.actions';
import * as BirthdaySelectors from '../store/birthday/birthday.selectors';

/**
 * Facade Service per Birthday State Management
 * Fornisce un'API semplice e pulita per interagire con lo store NgRx
 */
@Injectable({
  providedIn: 'root'
})
export class BirthdayFacadeService {

  // Selectors as Observables
  birthdays$ = this.store.select(BirthdaySelectors.selectAllBirthdays);
  filteredBirthdays$ = this.store.select(BirthdaySelectors.selectFilteredBirthdays);
  selectedBirthday$ = this.store.select(BirthdaySelectors.selectSelectedBirthday);
  loading$ = this.store.select(BirthdaySelectors.selectBirthdayLoading);
  error$ = this.store.select(BirthdaySelectors.selectBirthdayError);

  // Filter Observables
  searchTerm$ = this.store.select(BirthdaySelectors.selectSearchTerm);
  selectedMonth$ = this.store.select(BirthdaySelectors.selectSelectedMonth);
  selectedCategory$ = this.store.select(BirthdaySelectors.selectSelectedCategory);
  sortOrder$ = this.store.select(BirthdaySelectors.selectSortOrder);

  // Statistics Observables
  averageAge$ = this.store.select(BirthdaySelectors.selectAverageAge);
  birthdaysByMonth$ = this.store.select(BirthdaySelectors.selectBirthdaysByMonth);
  birthdaysThisMonth$ = this.store.select(BirthdaySelectors.selectBirthdaysThisMonth);
  next5Birthdays$ = this.store.select(BirthdaySelectors.selectNext5Birthdays);

  constructor(private store: Store<AppState>) {
    // Load birthdays on initialization
    this.loadBirthdays();
  }

  // Load Actions
  loadBirthdays(): void {
    this.store.dispatch(BirthdayActions.loadBirthdays());
  }

  loadTestData(): void {
    this.store.dispatch(BirthdayActions.loadTestData());
  }

  // CRUD Actions
  addBirthday(birthday: Omit<Birthday, 'id'>): void {
    this.store.dispatch(BirthdayActions.addBirthday({ birthday }));
  }

  updateBirthday(birthday: Birthday): void {
    this.store.dispatch(BirthdayActions.updateBirthday({ birthday }));
  }

  deleteBirthday(id: string): void {
    this.store.dispatch(BirthdayActions.deleteBirthday({ id }));
  }

  selectBirthday(id: string | null): void {
    this.store.dispatch(BirthdayActions.selectBirthday({ id }));
  }

  clearAllBirthdays(): void {
    this.store.dispatch(BirthdayActions.clearAllBirthdays());
  }

  // Filter Actions
  setSearchTerm(searchTerm: string): void {
    this.store.dispatch(BirthdayActions.setSearchTerm({ searchTerm }));
  }

  setSelectedMonth(month: number | null): void {
    this.store.dispatch(BirthdayActions.setSelectedMonth({ month }));
  }

  setSelectedCategory(category: string | null): void {
    this.store.dispatch(BirthdayActions.setSelectedCategory({ category }));
  }

  setSortOrder(sortOrder: 'name' | 'age' | 'nextBirthday'): void {
    this.store.dispatch(BirthdayActions.setSortOrder({ sortOrder }));
  }

  clearFilters(): void {
    this.store.dispatch(BirthdayActions.clearFilters());
  }

  // Scheduled Messages Actions
  addMessageToBirthday(birthdayId: string, message: ScheduledMessage): void {
    this.store.dispatch(BirthdayActions.addMessageToBirthday({ birthdayId, message }));
  }

  updateMessageInBirthday(birthdayId: string, messageId: string, updates: Partial<ScheduledMessage>): void {
    this.store.dispatch(BirthdayActions.updateMessageInBirthday({ birthdayId, messageId, updates }));
  }

  deleteMessageFromBirthday(birthdayId: string, messageId: string): void {
    this.store.dispatch(BirthdayActions.deleteMessageFromBirthday({ birthdayId, messageId }));
  }

  getMessagesByBirthday(birthdayId: string): Observable<ScheduledMessage[]> {
    return this.store.select(BirthdaySelectors.selectMessagesByBirthday(birthdayId));
  }

  // Dynamic Selectors
  getBirthdayById(id: string): Observable<Birthday | undefined> {
    return this.store.select(BirthdaySelectors.selectBirthdayById(id));
  }

  getUpcomingBirthdays(days: number = 30): Observable<Birthday[]> {
    return this.store.select(BirthdaySelectors.selectUpcomingBirthdays(days));
  }

  // Helper method for backwards compatibility
  getBirthdaysNext30Days(): Observable<Birthday[]> {
    return this.getUpcomingBirthdays(30);
  }
}
