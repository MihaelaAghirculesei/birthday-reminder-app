import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface EditingBirthdayData {
  name: string;
  notes: string;
  birthDate: string;
  category: string;
  photo: string | null;
  rememberPhoto: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class BirthdayEditService {
  private editingBirthdayIdSubject = new BehaviorSubject<string | null>(null);
  private editingBirthdayDataSubject = new BehaviorSubject<EditingBirthdayData | null>(null);
  private autoSaveTimer: any = null;

  editingBirthdayId$ = this.editingBirthdayIdSubject.asObservable();
  editingBirthdayData$ = this.editingBirthdayDataSubject.asObservable();

  get currentEditingId(): string | null {
    return this.editingBirthdayIdSubject.value;
  }

  get currentEditingData(): EditingBirthdayData | null {
    return this.editingBirthdayDataSubject.value;
  }

  startEdit(birthday: any, formatDateForInput: (date: Date) => string, defaultCategory: string): void {
    if (this.editingBirthdayIdSubject.value && this.editingBirthdayIdSubject.value !== birthday.id) {
      this.cancelEdit();
    }

    this.editingBirthdayIdSubject.next(birthday.id);
    this.editingBirthdayDataSubject.next({
      name: birthday.name,
      notes: birthday.notes || '',
      birthDate: formatDateForInput(birthday.birthDate),
      category: birthday.category || defaultCategory,
      photo: birthday.photo || null,
      rememberPhoto: birthday.rememberPhoto || null,
    });
  }

  updateEditingData(data: Partial<EditingBirthdayData>): void {
    const currentData = this.editingBirthdayDataSubject.value;
    if (currentData) {
      this.editingBirthdayDataSubject.next({ ...currentData, ...data });
    }
  }

  cancelEdit(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.editingBirthdayIdSubject.next(null);
    this.editingBirthdayDataSubject.next(null);
  }

  isEditing(birthdayId: string): boolean {
    return this.editingBirthdayIdSubject.value === birthdayId;
  }

  scheduleAutoSave(callback: () => void, delay: number = 2000): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(callback, delay);
  }
}
