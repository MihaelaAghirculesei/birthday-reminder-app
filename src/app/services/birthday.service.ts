import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Birthday } from '../models/birthday.model';

@Injectable({
  providedIn: 'root'
})
export class BirthdayService {
  private birthdays: Birthday[] = [];
  private birthdaysSubject = new BehaviorSubject<Birthday[]>([]);
  public birthdays$ = this.birthdaysSubject.asObservable();

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