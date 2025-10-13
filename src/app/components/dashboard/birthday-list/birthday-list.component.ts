import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { BirthdayItemComponent } from './birthday-item/birthday-item.component';
import { BirthdayService } from '../../../services/birthday.service';
import { BirthdayEditService } from '../../../services/birthday-edit.service';

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
    public birthdayService: BirthdayService,
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
    this.birthdayService.deleteBirthday(birthday.id);
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

    this.birthdayService.updateBirthday(updatedBirthday);
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
    return this.birthdayService.getDaysUntilBirthday(birthDate);
  }
}
