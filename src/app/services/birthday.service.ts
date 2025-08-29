import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Birthday } from '../models/birthday.model';
import { MONTHS } from '../shared/constants';
import { getZodiacSign } from '../shared/utils/zodiac.util';

@Injectable({
  providedIn: 'root'
})
export class BirthdayService {
  private birthdays: Birthday[] = [];
  private birthdaysSubject = new BehaviorSubject<Birthday[]>([]);
  public birthdays$ = this.birthdaysSubject.asObservable();

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
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

  private loadFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
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
            this.updateBirthdaysSubject();
          }
        }
      } catch (error) {
        localStorage.removeItem('birthdays');
        console.warn('Corrupted birthday data removed from localStorage');
      }
    }
  }
}