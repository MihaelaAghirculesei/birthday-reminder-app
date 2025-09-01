import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, combineLatest, map, firstValueFrom } from 'rxjs';
import { Birthday } from '../models/birthday.model';
import { MONTHS } from '../shared/constants';
import { getZodiacSign } from '../shared/utils/zodiac.util';
import { IndexedDBStorageService } from './offline-storage.service';
import { NetworkService } from './network.service';
import { GoogleCalendarService } from './google-calendar.service';

@Injectable({
  providedIn: 'root'
})
export class BirthdayService {
  private birthdays: Birthday[] = [];
  private birthdaysSubject = new BehaviorSubject<Birthday[]>([]);
  public birthdays$ = this.birthdaysSubject.asObservable();
  private isInitialized = false;
  private pendingChanges: (() => Promise<void>)[] = [];

  private searchTermSubject = new BehaviorSubject<string>('');
  private selectedMonthSubject = new BehaviorSubject<number | null>(null);
  private sortOrderSubject = new BehaviorSubject<string>('name');

  public searchTerm$ = this.searchTermSubject.asObservable();
  public selectedMonth$ = this.selectedMonthSubject.asObservable();
  public sortOrder$ = this.sortOrderSubject.asObservable();

  public filteredBirthdays$ = combineLatest([
    this.birthdays$,
    this.searchTerm$,
    this.selectedMonth$,
    this.sortOrder$
  ]).pipe(
    map(([birthdays, searchTerm, selectedMonth, sortOrder]) => {
      let filtered = [...birthdays];

      if (searchTerm.trim()) {
        filtered = filtered.filter(birthday =>
          birthday.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedMonth !== null) {
        filtered = filtered.filter(birthday =>
          birthday.birthDate.getMonth() === selectedMonth
        );
      }

      filtered.sort((a, b) => {
        switch (sortOrder) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'age':
            return this.calculateAge(b.birthDate) - this.calculateAge(a.birthDate);
          case 'nextBirthday':
            const nextA = this.getNextBirthdayDate(a.birthDate);
            const nextB = this.getNextBirthdayDate(b.birthDate);
            return nextA.getTime() - nextB.getTime();
          default:
            return 0;
        }
      });

      return filtered;
    })
  );

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private offlineStorage: IndexedDBStorageService,
    private networkService: NetworkService,
    private googleCalendarService: GoogleCalendarService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeService();
      this.setupNetworkSync();
    }
  }

  async addBirthday(birthday: Omit<Birthday, 'id'>): Promise<void> {
    const newBirthday: Birthday = {
      ...birthday,
      id: this.generateId()
    };
    
    if (this.googleCalendarService.isEnabled()) {
      try {
        const eventId = await this.googleCalendarService.syncBirthdayToCalendar(newBirthday);
        newBirthday.googleCalendarEventId = eventId;
      } catch (error) {
        console.warn('Failed to sync birthday to Google Calendar:', error);
      }
    }
    
    this.birthdays.push(newBirthday);
    this.updateBirthdaysSubject();
    
    await this.saveToStorage(newBirthday, 'add');
  }

  async deleteBirthday(id: string): Promise<void> {
    const birthdayToDelete = this.birthdays.find(b => b.id === id);
    
    if (birthdayToDelete?.googleCalendarEventId && this.googleCalendarService.isEnabled()) {
      try {
        await this.googleCalendarService.deleteBirthdayFromCalendar(birthdayToDelete.googleCalendarEventId);
      } catch (error) {
        console.warn('Failed to delete birthday from Google Calendar:', error);
      }
    }
    
    this.birthdays = this.birthdays.filter(b => b.id !== id);
    this.updateBirthdaysSubject();
    
    await this.saveToStorage({ id } as Birthday, 'delete');
  }

  async updateBirthday(updatedBirthday: Birthday): Promise<void> {
    const index = this.birthdays.findIndex(b => b.id === updatedBirthday.id);
    if (index !== -1) {
      if (updatedBirthday.googleCalendarEventId && this.googleCalendarService.isEnabled()) {
        try {
          await this.googleCalendarService.updateBirthdayInCalendar(updatedBirthday, updatedBirthday.googleCalendarEventId);
        } catch (error) {
          console.warn('Failed to update birthday in Google Calendar:', error);
        }
      }
      
      this.birthdays[index] = updatedBirthday;
      this.updateBirthdaysSubject();
      
      await this.saveToStorage(updatedBirthday, 'update');
    }
  }

  getUpcomingBirthdays(days: number = 30): Birthday[] {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.birthdays.filter(birthday => {
      const nextBirthday = this.getNextBirthdayDate(birthday.birthDate);
      return nextBirthday >= today && nextBirthday <= futureDate;
    }).sort((a, b) => {
      const nextA = this.getNextBirthdayDate(a.birthDate);
      const nextB = this.getNextBirthdayDate(b.birthDate);
      return nextA.getTime() - nextB.getTime();
    });
  }

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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  private updateBirthdaysSubject(): void {
    this.birthdaysSubject.next([...this.birthdays]);
  }

  private saveToLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('birthdays', JSON.stringify(this.birthdays));
    }
  }

  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  setSelectedMonth(month: number | null): void {
    this.selectedMonthSubject.next(month);
  }

  setSortOrder(order: string): void {
    this.sortOrderSubject.next(order);
  }

  clearFilters(): void {
    this.searchTermSubject.next('');
    this.selectedMonthSubject.next(null);
    this.setSortOrder('name');
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getBirthdaysThisMonth(): Birthday[] {
    const currentMonth = new Date().getMonth();
    return this.birthdays.filter(birthday => 
      birthday.birthDate.getMonth() === currentMonth
    );
  }

  getAverageAge(): number {
    if (this.birthdays.length === 0) return 0;
    const totalAge = this.birthdays.reduce((sum, birthday) => 
      sum + this.calculateAge(birthday.birthDate), 0
    );
    return Math.round(totalAge / this.birthdays.length);
  }

  getNext5Birthdays(): Birthday[] {
    return this.birthdays
      .map(birthday => ({
        ...birthday,
        nextBirthday: this.getNextBirthdayDate(birthday.birthDate),
        daysUntil: this.getDaysUntilBirthday(birthday.birthDate)
      }))
      .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
      .slice(0, 5);
  }

  getBirthdaysByMonth(): { month: string; count: number; monthIndex: number }[] {
    const monthCounts = new Array(12).fill(0);
    
    this.birthdays.forEach(birthday => {
      monthCounts[birthday.birthDate.getMonth()]++;
    });
    
    return MONTHS.SHORT.map((month, index) => ({
      month,
      count: monthCounts[index],
      monthIndex: index
    }));
  }

  getDaysUntilBirthday(birthDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const nextBirthday = this.getNextBirthdayDate(birthDate);
    nextBirthday.setHours(0, 0, 0, 0); 
    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  getNextBirthdayText(birthDate: Date): string {
    const days = this.getDaysUntilBirthday(birthDate);
    
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow!';
    return `In ${days} days`;
  }

  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const storedBirthdays = await this.offlineStorage.getBirthdays();
      
      if (storedBirthdays.length > 0) {
        this.birthdays = storedBirthdays.map(b => ({
          ...b,
          zodiacSign: b.zodiacSign || getZodiacSign(b.birthDate).name
        }));
      } else {
        await this.migrateFromLocalStorage();
      }
      
      this.updateBirthdaysSubject();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Error initializing service, falling back to localStorage:', error);
      await this.migrateFromLocalStorage();
      this.isInitialized = true;
    }
  }

  private async migrateFromLocalStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('birthdays');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.birthdays = parsed.map((b: Omit<Birthday, 'birthDate'> & { birthDate: string }) => {
            const birthDate = new Date(b.birthDate);
            return {
              ...b,
              birthDate,
              zodiacSign: b.zodiacSign || getZodiacSign(birthDate).name
            };
          });
          
          await this.offlineStorage.saveBirthdays(this.birthdays);
          
          localStorage.removeItem('birthdays');
        }
      }
    } catch (error) {
      console.warn('Error migrating from localStorage:', error);
      localStorage.removeItem('birthdays');
    }
  }

  private setupNetworkSync(): void {
    this.networkService.online$.subscribe(async (isOnline) => {
      if (isOnline && this.pendingChanges.length > 0) {
        const changes = [...this.pendingChanges];
        this.pendingChanges = [];
        
        for (const changeFunction of changes) {
          try {
            await changeFunction();
          } catch (error) {
            console.warn('Error processing pending change:', error);
          }
        }
      }
    });
  }

  private async saveToStorage(birthday: Birthday, operation: 'add' | 'update' | 'delete'): Promise<void> {
    try {
      switch (operation) {
        case 'add':
          await this.offlineStorage.addBirthday(birthday);
          break;
        case 'update':
          await this.offlineStorage.updateBirthday(birthday);
          break;
        case 'delete':
          await this.offlineStorage.deleteBirthday(birthday.id);
          break;
      }
      
      this.saveToLocalStorage();
    } catch (error) {
      console.warn(`Error saving to IndexedDB, using localStorage backup:`, error);
      this.saveToLocalStorage();
      
      if (this.networkService.isOffline) {
        const changeFunction = async () => {
          try {
            switch (operation) {
              case 'add':
                await this.offlineStorage.addBirthday(birthday);
                break;
              case 'update':
                await this.offlineStorage.updateBirthday(birthday);
                break;
              case 'delete':
                await this.offlineStorage.deleteBirthday(birthday.id);
                break;
            }
          } catch (retryError) {
            console.warn('Retry failed:', retryError);
          }
        };
        this.pendingChanges.push(changeFunction);
      }
    }
  }
}