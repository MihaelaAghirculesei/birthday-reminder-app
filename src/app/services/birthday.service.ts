import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Birthday } from '../models/birthday.model';
import { MONTHS } from '../shared/constants';
import { getZodiacSign } from '../shared/utils/zodiac.util';
import { DEFAULT_CATEGORY } from '../shared/constants/categories';
import { IndexedDBStorageService } from './offline-storage.service';
import { NetworkService } from './network.service';
import { GoogleCalendarService } from './google-calendar.service';
import { NotificationService } from './notification.service';

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
  private selectedCategorySubject = new BehaviorSubject<string | null>(null);
  private sortOrderSubject = new BehaviorSubject<string>('name');

  public searchTerm$ = this.searchTermSubject.asObservable();
  public selectedMonth$ = this.selectedMonthSubject.asObservable();
  public selectedCategory$ = this.selectedCategorySubject.asObservable();
  public sortOrder$ = this.sortOrderSubject.asObservable();

  public filteredBirthdays$ = combineLatest([
    this.birthdays$,
    this.searchTerm$,
    this.selectedMonth$,
    this.selectedCategory$,
    this.sortOrder$
  ]).pipe(
    map(([birthdays, searchTerm, selectedMonth, selectedCategory, sortOrder]) => {
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

      if (selectedCategory !== null) {
        filtered = filtered.filter(birthday =>
          (birthday.category || DEFAULT_CATEGORY) === selectedCategory
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
    private googleCalendarService: GoogleCalendarService,
    private notificationService: NotificationService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeService();
      this.setupNetworkSync();
    }
  }

  async addBirthday(birthday: Omit<Birthday, 'id'>): Promise<void> {
    await this.initializeService();
    
    const newBirthday: Birthday = {
      ...birthday,
      id: this.generateId(),
      category: birthday.category || DEFAULT_CATEGORY,
      zodiacSign: birthday.zodiacSign || getZodiacSign(birthday.birthDate).name
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
    this.notificationService.show(`${newBirthday.name} added successfully!`, 'success');
  }

  async deleteBirthday(id: string): Promise<void> {
    await this.initializeService();
    
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
    this.notificationService.show(`Birthday deleted successfully!`, 'success');
  }

  async updateBirthday(updatedBirthday: Birthday): Promise<void> {
    await this.initializeService();
    
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
      this.notificationService.show(`${updatedBirthday.name} updated successfully!`, 'success');
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

  setSelectedCategory(category: string | null): void {
    this.selectedCategorySubject.next(category);
  }

  clearFilters(): void {
    this.searchTermSubject.next('');
    this.selectedMonthSubject.next(null);
    this.selectedCategorySubject.next(null);
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

  async clearAllBirthdays(): Promise<void> {
    this.birthdays = [];
    this.updateBirthdaysSubject();
    
    try {
      await this.offlineStorage.clear();
      localStorage.removeItem('birthdays');
    } catch (error) {
      console.warn('Error clearing birthdays:', error);
      localStorage.removeItem('birthdays');
    }
  }

  async addTestBirthdays(): Promise<void> {
    const testBirthdays = [
      {
        name: 'Marcus Ross',
        birthDate: new Date(1985, 0, 15),
        notes: 'Loves pizza and soccer',
        reminderDays: 7,
        category: 'friends',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Claire Rice',
        birthDate: new Date(1991, 0, 18),
        notes: 'Teacher and book lover',
        reminderDays: 3,
        category: 'colleagues',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Alexander Green',
        birthDate: new Date(1988, 0, 25),
        notes: 'Musician and photographer',
        reminderDays: 5,
        category: 'friends',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Valentina Roman',
        birthDate: new Date(1987, 0, 29),
        notes: 'Designer and artist',
        reminderDays: 5,
        category: 'romantic',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Sofia Black',
        birthDate: new Date(1995, 4, 8),
        notes: 'Chef and foodie',
        reminderDays: 7,
        category: 'family',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Lorenzo Ferrari',
        birthDate: new Date(1990, 4, 15),
        notes: 'Software developer',
        reminderDays: 14,
        category: 'colleagues',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Frank White',
        birthDate: new Date(1993, 4, 25),
        notes: 'Doctor and runner',
        reminderDays: 10,
        category: 'acquaintances',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Julia White',
        birthDate: new Date(1992, 8, 12),
        notes: 'Travel enthusiast',
        reminderDays: 3,
        category: 'friends',
        photo: undefined
      },
      {
        name: 'Elena Gallo',
        birthDate: new Date(1994, 8, 22),
        notes: 'Lawyer and yoga lover',
        reminderDays: 5,
        category: 'family',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'David Moretti',
        birthDate: new Date(1989, 11, 10),
        notes: 'Engineer and cyclist',
        reminderDays: 7,
        category: 'other',
        photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Emma Thompson',
        birthDate: new Date(1986, 1, 14),
        notes: 'Marketing specialist and yoga instructor',
        reminderDays: 5,
        category: 'colleagues',
        photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Lucas Anderson',
        birthDate: new Date(1992, 2, 3),
        notes: 'Graphic designer and coffee lover',
        reminderDays: 10,
        category: 'friends',
        photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Isabella Martinez',
        birthDate: new Date(1988, 2, 22),
        notes: 'Architect and nature lover',
        reminderDays: 7,
        category: 'romantic',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616c96ae5f5?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Noah Campbell',
        birthDate: new Date(1991, 3, 5),
        notes: 'Teacher and chess player',
        reminderDays: 14,
        category: 'family',
        photo: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Mia Rodriguez',
        birthDate: new Date(1993, 3, 18),
        notes: 'Journalist and film critic',
        reminderDays: 3,
        category: 'acquaintances',
        photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Oliver Johnson',
        birthDate: new Date(1987, 5, 7),
        notes: 'Veterinarian and animal lover',
        reminderDays: 7,
        category: 'friends',
        photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Ava Wilson',
        birthDate: new Date(1990, 5, 28),
        notes: 'Nurse and marathon runner',
        reminderDays: 5,
        category: 'colleagues',
        photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Ethan Davis',
        birthDate: new Date(1985, 6, 11),
        notes: 'Chef and wine enthusiast',
        reminderDays: 10,
        category: 'family',
        photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Charlotte Brown',
        birthDate: new Date(1994, 6, 24),
        notes: 'Fashion designer and art collector',
        reminderDays: 3,
        category: 'romantic',
        photo: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Mason Taylor',
        birthDate: new Date(1989, 7, 9),
        notes: 'Financial advisor and golfer',
        reminderDays: 14,
        category: 'acquaintances',
        photo: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Amelia Garcia',
        birthDate: new Date(1991, 7, 31),
        notes: 'Psychologist and meditation teacher',
        reminderDays: 7,
        category: 'other',
        photo: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'James Miller',
        birthDate: new Date(1986, 9, 2),
        notes: 'Mechanic and motorcycle enthusiast',
        reminderDays: 5,
        category: 'friends',
        photo: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Harper Wilson',
        birthDate: new Date(1992, 9, 19),
        notes: 'Photographer and travel blogger',
        reminderDays: 10,
        category: 'colleagues',
        photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Benjamin Jones',
        birthDate: new Date(1988, 10, 6),
        notes: 'Software architect and gamer',
        reminderDays: 7,
        category: 'family',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Evelyn Moore',
        birthDate: new Date(1993, 10, 23),
        notes: 'Interior designer and plant enthusiast',
        reminderDays: 3,
        category: 'romantic',
        photo: 'https://images.unsplash.com/photo-1488508872907-592763824245?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'William Clark',
        birthDate: new Date(1987, 11, 4),
        notes: 'Dentist and tennis player',
        reminderDays: 14,
        category: 'acquaintances',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Abigail Lewis',
        birthDate: new Date(1990, 11, 27),
        notes: 'Librarian and book club organizer',
        reminderDays: 5,
        category: 'other',
        photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Henry Walker',
        birthDate: new Date(1985, 1, 8),
        notes: 'Real estate agent and history buff',
        reminderDays: 7,
        category: 'friends',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Elizabeth Hall',
        birthDate: new Date(1991, 3, 12),
        notes: 'Pharmacist and fitness coach',
        reminderDays: 10,
        category: 'colleagues',
        photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&h=300&fit=crop&crop=face'
      },
      {
        name: 'Sebastian Young',
        birthDate: new Date(1989, 7, 16),
        notes: 'Music producer and DJ',
        reminderDays: 3,
        category: 'family',
        photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=face'
      }
    ];

    for (const testBirthday of testBirthdays) {
      await this.addBirthday(testBirthday);
    }
  }
}