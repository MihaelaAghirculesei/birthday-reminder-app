import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Birthday, ScheduledMessage } from '../../shared/models/birthday.model';
import { AppState } from '../store/app.state';
import * as BirthdayActions from '../store/birthday/birthday.actions';
import * as BirthdaySelectors from '../store/birthday/birthday.selectors';

export interface BirthdayWithDays extends Birthday {
  nextBirthday: Date;
  daysUntil: number;
}

@Injectable({
  providedIn: 'root'
})
export class BirthdayFacadeService {

  birthdays: Signal<Birthday[]> = toSignal(this.store.select(BirthdaySelectors.selectAllBirthdays), { initialValue: [] });
  filteredBirthdays: Signal<Birthday[]> = toSignal(this.store.select(BirthdaySelectors.selectFilteredBirthdays), { initialValue: [] });
  selectedBirthday = toSignal(this.store.select(BirthdaySelectors.selectSelectedBirthday));
  loading: Signal<boolean> = toSignal(this.store.select(BirthdaySelectors.selectBirthdayLoading), { initialValue: false });
  error = toSignal(this.store.select(BirthdaySelectors.selectBirthdayError));

  searchTerm: Signal<string> = toSignal(this.store.select(BirthdaySelectors.selectSearchTerm), { initialValue: '' });
  selectedMonth = toSignal(this.store.select(BirthdaySelectors.selectSelectedMonth));
  selectedCategory = toSignal(this.store.select(BirthdaySelectors.selectSelectedCategory));
  sortOrder: Signal<'name' | 'age' | 'nextBirthday'> = toSignal(this.store.select(BirthdaySelectors.selectSortOrder), { initialValue: 'nextBirthday' });

  averageAge: Signal<number> = toSignal(this.store.select(BirthdaySelectors.selectAverageAge), { initialValue: 0 });
  birthdaysByMonth = toSignal(this.store.select(BirthdaySelectors.selectBirthdaysByMonth), { initialValue: [] });
  birthdaysThisMonth = toSignal(this.store.select(BirthdaySelectors.selectBirthdaysThisMonth));
  next5Birthdays: Signal<BirthdayWithDays[]> = toSignal(this.store.select(BirthdaySelectors.selectNext5Birthdays), { initialValue: [] });

  constructor(private store: Store<AppState>) {
    this.loadBirthdays();
  }

  loadBirthdays(): void {
    this.store.dispatch(BirthdayActions.loadBirthdays());
  }

  loadTestData(): void {
    this.store.dispatch(BirthdayActions.loadTestData());
  }

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

  getBirthdayById(id: string): Observable<Birthday | undefined> {
    return this.store.select(BirthdaySelectors.selectBirthdayById(id));
  }

  getUpcomingBirthdays(days = 30): Observable<Birthday[]> {
    return this.store.select(BirthdaySelectors.selectUpcomingBirthdays(days));
  }

  getBirthdaysNext30Days(): Observable<Birthday[]> {
    return this.getUpcomingBirthdays(30);
  }
}
