import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Birthday } from '../models/birthday.model';

@Injectable({
  providedIn: 'root'
})
export class BirthdayService {
  private birthdays: Birthday[] = [];
  private birthdaysSubject = new BehaviorSubject<Birthday[]>([]);
  public birthdays$ = this.birthdaysSubject.asObservable();

  // Filter and search subjects
  private searchTermSubject = new BehaviorSubject<string>('');
  private selectedMonthSubject = new BehaviorSubject<number | null>(null);
  private sortOrderSubject = new BehaviorSubject<string>('name');

  public searchTerm$ = this.searchTermSubject.asObservable();
  public selectedMonth$ = this.selectedMonthSubject.asObservable();
  public sortOrder$ = this.sortOrderSubject.asObservable();

  // Filtered and sorted birthdays
  public filteredBirthdays$ = combineLatest([
    this.birthdays$,
    this.searchTerm$,
    this.selectedMonth$,
    this.sortOrder$
  ]).pipe(
    map(([birthdays, searchTerm, selectedMonth, sortOrder]) => {
      let filtered = [...birthdays];

      // Apply search filter
      if (searchTerm.trim()) {
        filtered = filtered.filter(birthday =>
          birthday.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply month filter
      if (selectedMonth !== null) {
        filtered = filtered.filter(birthday =>
          birthday.birthDate.getMonth() === selectedMonth
        );
      }

      // Apply sorting
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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Carica dati dal localStorage solo se siamo nel browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromLocalStorage();
    }
  }

  addBirthday(birthday: Omit<Birthday, 'id'>): void {
    const newBirthday: Birthday = {
      ...birthday,
      id: this.generateId()
    };
    
    this.birthdays.push(newBirthday);
    this.updateBirthdaysSubject();
    this.saveToLocalStorage();
  }

  deleteBirthday(id: string): void {
    this.birthdays = this.birthdays.filter(b => b.id !== id);
    this.updateBirthdaysSubject();
    this.saveToLocalStorage();
  }

  updateBirthday(updatedBirthday: Birthday): void {
    const index = this.birthdays.findIndex(b => b.id === updatedBirthday.id);
    if (index !== -1) {
      this.birthdays[index] = updatedBirthday;
      this.updateBirthdaysSubject();
      this.saveToLocalStorage();
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
    const currentYear = today.getFullYear();
    const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    
    return nextBirthday;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private updateBirthdaysSubject(): void {
    this.birthdaysSubject.next([...this.birthdays]);
  }

  private saveToLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('birthdays', JSON.stringify(this.birthdays));
    }
  }

  // Filter and search methods
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

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private loadFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('birthdays');
      if (stored) {
        this.birthdays = JSON.parse(stored).map((b: any) => ({
          ...b,
          birthDate: new Date(b.birthDate)
        }));
        this.updateBirthdaysSubject();
      }
    }
  }
}