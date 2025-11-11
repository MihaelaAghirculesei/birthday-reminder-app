import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule, BirthdayCategory } from '../../../../shared';
import { BirthdayItemComponent } from './birthday-item/birthday-item.component';
import { BirthdayFacadeService } from '../../../../core';
import { BirthdayEditService } from '../../services/birthday-edit.service';

@Component({
  selector: 'app-birthday-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    BirthdayItemComponent
  ],
  templateUrl: './birthday-list.component.html',
  styleUrls: ['./birthday-list.component.scss']
})
export class BirthdayListComponent {
  @Input() birthdays: any[] = [];
  @Input() categories: BirthdayCategory[] = [];
  @Input() searchTerm: string = '';
  @Input() lastAction: { type: string; data: any } | null = null;
  @Input() totalBirthdays: number = 0;

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() undoAction = new EventEmitter<void>();
  @Output() addTestData = new EventEmitter<void>();
  @Output() clearAllData = new EventEmitter<void>();

  isAddingTestData = false;
  isClearingData = false;

  constructor(
    public birthdayFacade: BirthdayFacadeService,
    public editService: BirthdayEditService
  ) {}

  onSearchChange(event: any): void {
    this.searchTermChange.emit(event.target.value);
  }

  onClearSearch(): void {
    this.clearSearch.emit();
  }

  onUndo(): void {
    this.undoAction.emit();
  }

  onAddTestData(): void {
    this.isAddingTestData = true;
    this.addTestData.emit();
    setTimeout(() => {
      this.isAddingTestData = false;
    }, 2000);
  }

  onClearAllData(): void {
    this.isClearingData = true;
    this.clearAllData.emit();
    setTimeout(() => {
      this.isClearingData = false;
    }, 2000);
  }

  trackByBirthday(index: number, birthday: any): any {
    return birthday.id;
  }

  editBirthday(birthday: any): void {
    this.editService.startEdit(
      birthday,
      this.formatDateForInput.bind(this),
      'default'
    );
  }

  deleteBirthday(birthday: any): void {
    this.birthdayFacade.deleteBirthday(birthday.id);
  }

  saveBirthday(birthday: any): void {
    const editingData = this.editService.currentEditingData;
    if (!editingData) return;

    const updatedBirthday = {
      ...birthday,
      name: editingData.name.trim() || birthday.name,
      notes: editingData.notes.trim(),
      birthDate: new Date(editingData.birthDate),
      category: editingData.category,
    };

    this.birthdayFacade.updateBirthday(updatedBirthday);
    this.editService.cancelEdit();
  }

  cancelEdit(): void {
    this.editService.cancelEdit();
  }

  quickEditName(birthday: any): void {
    this.editBirthday(birthday);
    setTimeout(() => {
      const nameInput = document.querySelector('.edit-name-input') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 100);
  }

  onEditInputChange(birthday: any): void {
    this.editService.scheduleAutoSave(() => {
      this.saveBirthday(birthday);
    });
  }

  onPhotoSelected(photoDataUrl: string): void {
    const editingData = this.editService.currentEditingData;
    if (editingData) {
      this.editService.updateEditingData({ photo: photoDataUrl });
      this.autoSavePhotoChange();
    }
  }

  onPhotoRemoved(): void {
    const editingData = this.editService.currentEditingData;
    if (editingData) {
      this.editService.updateEditingData({ photo: null });
      this.autoSavePhotoChange();
    }
  }

  onRememberPhotoSelected(photoDataUrl: string): void {
    const editingData = this.editService.currentEditingData;
    if (editingData) {
      this.editService.updateEditingData({ rememberPhoto: photoDataUrl });
      this.autoSaveRememberPhotoChange();
    }
  }

  onRememberPhotoRemoved(): void {
    const editingData = this.editService.currentEditingData;
    if (editingData) {
      this.editService.updateEditingData({ rememberPhoto: null });
      this.autoSaveRememberPhotoChange();
    }
  }

  private autoSavePhotoChange(): void {
    this.editService.scheduleAutoSave(() => {
      const editingId = this.editService.currentEditingId;
      const birthday = this.birthdays.find(b => b.id === editingId);
      if (birthday) {
        this.saveBirthday(birthday);
      }
    }, 1000);
  }

  private autoSaveRememberPhotoChange(): void {
    this.editService.scheduleAutoSave(() => {
      const editingId = this.editService.currentEditingId;
      const birthday = this.birthdays.find(b => b.id === editingId);
      if (birthday) {
        this.saveBirthday(birthday);
      }
    }, 1000);
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isEditing(birthdayId: string): boolean {
    return this.editService.isEditing(birthdayId);
  }

  getEditingData(): any {
    return this.editService.currentEditingData;
  }

  getDaysUntilBirthday(birthDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextBirthday = this.getNextBirthdayDate(birthDate);
    nextBirthday.setHours(0, 0, 0, 0);
    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
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
}
