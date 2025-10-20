import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Birthday, ScheduledMessage, MONTHS } from '../../shared';
import { BirthdayFacadeService } from './birthday-facade.service';

/**
 * @deprecated This service is deprecated and will be removed in a future version.
 *
 * Please use BirthdayFacadeService instead, which provides better state management
 * with NgRx Store, improved performance, and easier testing.
 *
 * Migration Guide:
 * - Replace: BirthdayService → BirthdayFacadeService
 * - All methods have the same signature
 * - All observables are available with the same names
 * - Remove 'await' keywords (methods are now synchronous actions)
 *
 * Example:
 * ```typescript
 * // Before
 * constructor(private birthdayService: BirthdayService) {}
 * await this.birthdayService.addBirthday(birthday);
 *
 * // After
 * constructor(private birthdayFacade: BirthdayFacadeService) {}
 * this.birthdayFacade.addBirthday(birthday);
 * ```
 *
 * See NGRX_MIGRATION_GUIDE.md for complete migration instructions.
 */
@Injectable({
  providedIn: 'root'
})
export class BirthdayService {
  // Legacy Observables - delegating to NgRx Store via Facade
  public birthdays$ = this.facade.birthdays$;
  public searchTerm$ = this.facade.searchTerm$;
  public selectedMonth$ = this.facade.selectedMonth$;
  public selectedCategory$ = this.facade.selectedCategory$;
  public sortOrder$ = this.facade.sortOrder$;
  public filteredBirthdays$ = this.facade.filteredBirthdays$;

  constructor(private facade: BirthdayFacadeService) {}

  /**
   * @deprecated Use BirthdayFacadeService.addBirthday() instead
   */
  async addBirthday(birthday: Omit<Birthday, 'id'>): Promise<void> {
    this.facade.addBirthday(birthday);
    return Promise.resolve();
  }

  /**
   * @deprecated Use BirthdayFacadeService.deleteBirthday() instead
   */
  async deleteBirthday(id: string): Promise<void> {
    this.facade.deleteBirthday(id);
    return Promise.resolve();
  }

  /**
   * @deprecated Use BirthdayFacadeService.updateBirthday() instead
   */
  async updateBirthday(updatedBirthday: Birthday): Promise<void> {
    this.facade.updateBirthday(updatedBirthday);
    return Promise.resolve();
  }

  /**
   * @deprecated Use BirthdayFacadeService.getUpcomingBirthdays() instead
   */
  getUpcomingBirthdays(days: number = 30): Birthday[] {
    console.warn('BirthdayService.getUpcomingBirthdays() is deprecated. Use BirthdayFacadeService.getUpcomingBirthdays() which returns an Observable.');
    // This returns empty array since we can't convert Observable to sync array
    // Components should migrate to use the Observable version
    return [];
  }

  /**
   * @deprecated Use BirthdayFacadeService.setSearchTerm() instead
   */
  setSearchTerm(term: string): void {
    this.facade.setSearchTerm(term);
  }

  /**
   * @deprecated Use BirthdayFacadeService.setSelectedMonth() instead
   */
  setSelectedMonth(month: number | null): void {
    this.facade.setSelectedMonth(month);
  }

  /**
   * @deprecated Use BirthdayFacadeService.setSortOrder() instead
   */
  setSortOrder(order: string): void {
    this.facade.setSortOrder(order as 'name' | 'age' | 'nextBirthday');
  }

  /**
   * @deprecated Use BirthdayFacadeService.setSelectedCategory() instead
   */
  setSelectedCategory(category: string | null): void {
    this.facade.setSelectedCategory(category);
  }

  /**
   * @deprecated Use BirthdayFacadeService.clearFilters() instead
   */
  clearFilters(): void {
    this.facade.clearFilters();
  }

  /**
   * @deprecated Use BirthdayFacadeService.birthdaysThisMonth$ instead
   */
  getBirthdaysThisMonth(): Birthday[] {
    console.warn('BirthdayService.getBirthdaysThisMonth() is deprecated. Use BirthdayFacadeService.birthdaysThisMonth$ Observable instead.');
    return [];
  }

  /**
   * @deprecated Use BirthdayFacadeService.getBirthdaysNext30Days() instead
   */
  getBirthdaysNext30Days(): Birthday[] {
    console.warn('BirthdayService.getBirthdaysNext30Days() is deprecated. Use BirthdayFacadeService.getBirthdaysNext30Days() Observable instead.');
    return [];
  }

  /**
   * @deprecated Use BirthdayFacadeService.averageAge$ instead
   */
  getAverageAge(): number {
    console.warn('BirthdayService.getAverageAge() is deprecated. Use BirthdayFacadeService.averageAge$ Observable instead.');
    return 0;
  }

  /**
   * @deprecated Use BirthdayFacadeService.next5Birthdays$ instead
   */
  getNext5Birthdays(): Birthday[] {
    console.warn('BirthdayService.getNext5Birthdays() is deprecated. Use BirthdayFacadeService.next5Birthdays$ Observable instead.');
    return [];
  }

  /**
   * @deprecated Use BirthdayFacadeService.birthdaysByMonth$ instead
   */
  getBirthdaysByMonth(): { month: string; count: number; monthIndex: number }[] {
    console.warn('BirthdayService.getBirthdaysByMonth() is deprecated. Use BirthdayFacadeService.birthdaysByMonth$ Observable instead.');
    return [];
  }

  /**
   * @deprecated Not needed with NgRx Store
   */
  getDaysUntilBirthday(birthDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextBirthday = this.getNextBirthdayDate(birthDate);
    nextBirthday.setHours(0, 0, 0, 0);
    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * @deprecated Not needed with NgRx Store
   */
  getNextBirthdayText(birthDate: Date): string {
    const days = this.getDaysUntilBirthday(birthDate);
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow!';
    return `In ${days} days`;
  }

  /**
   * @deprecated Use BirthdayFacadeService.clearAllBirthdays() instead
   */
  async clearAllBirthdays(): Promise<void> {
    this.facade.clearAllBirthdays();
    return Promise.resolve();
  }

  /**
   * @deprecated Test data should be loaded differently
   */
  async addTestBirthdays(): Promise<void> {
    console.warn('BirthdayService.addTestBirthdays() is deprecated. Please implement test data loading separately.');
    return Promise.resolve();
  }

  /**
   * @deprecated Use BirthdayFacadeService.addMessageToBirthday() instead
   */
  async addMessageToBirthday(birthdayId: string, message: ScheduledMessage): Promise<void> {
    this.facade.addMessageToBirthday(birthdayId, message);
    return Promise.resolve();
  }

  /**
   * @deprecated Use BirthdayFacadeService.updateMessageInBirthday() instead
   */
  async updateMessageInBirthday(birthdayId: string, messageId: string, updates: Partial<ScheduledMessage>): Promise<void> {
    this.facade.updateMessageInBirthday(birthdayId, messageId, updates);
    return Promise.resolve();
  }

  /**
   * @deprecated Use BirthdayFacadeService.deleteMessageFromBirthday() instead
   */
  async deleteMessageFromBirthday(birthdayId: string, messageId: string): Promise<void> {
    this.facade.deleteMessageFromBirthday(birthdayId, messageId);
    return Promise.resolve();
  }

  /**
   * @deprecated Use BirthdayFacadeService.getMessagesByBirthday() instead
   */
  getMessagesByBirthday(birthdayId: string): ScheduledMessage[] {
    console.warn('BirthdayService.getMessagesByBirthday() is deprecated. Use BirthdayFacadeService.getMessagesByBirthday() Observable instead.');
    return [];
  }

  // Private helper methods - kept for backward compatibility
  private getNextBirthdayDate(birthDate: Date): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }

    return nextBirthday;
  }
}
