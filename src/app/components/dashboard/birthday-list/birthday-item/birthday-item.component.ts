import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material.module';
import { ZodiacIconComponent } from '../../../../shared/components/zodiac-icon.component';
import { CategoryIconComponent } from '../../../../shared/components/category-icon.component';
import { PhotoUploadComponent } from '../../../../shared/components/photo-upload.component';
import { RememberPhotoComponent } from '../../remember-photo/remember-photo.component';
import { Birthday } from '../../../../models/birthday.model';
import { BIRTHDAY_CATEGORIES } from '../../../../shared/constants/categories';

@Component({
  selector: 'app-birthday-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    ZodiacIconComponent,
    CategoryIconComponent,
    PhotoUploadComponent,
    RememberPhotoComponent,
  ],
  templateUrl: './birthday-item.component.html',
  styleUrls: ['./birthday-item.component.scss'],
})
export class BirthdayItemComponent {
  @Input() birthday!: Birthday;
  @Input() isEditing: boolean = false;
  @Input() editingData: any = {};
  @Input() daysUntilBirthday: number = 0;
  @Input() defaultCategory: string = '';

  @Output() edit = new EventEmitter<Birthday>();
  @Output() delete = new EventEmitter<Birthday>();
  @Output() save = new EventEmitter<Birthday>();
  @Output() cancel = new EventEmitter<void>();
  @Output() quickEdit = new EventEmitter<Birthday>();
  @Output() editInputChange = new EventEmitter<Birthday>();
  @Output() photoSelected = new EventEmitter<string>();
  @Output() photoRemoved = new EventEmitter<void>();
  @Output() rememberPhotoSelected = new EventEmitter<string>();
  @Output() rememberPhotoRemoved = new EventEmitter<void>();
  @Output() shareRememberPhoto = new EventEmitter<Birthday>();
  @Output() downloadRememberPhoto = new EventEmitter<Birthday>();

  getAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  getDaysText(days: number): string {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }

  getDaysChipClass(days: number): string {
    if (days <= 7) return 'red-alert';
    if (days <= 21) return 'orange-warning';
    return 'green-safe';
  }

  getBirthdayCategories() {
    return BIRTHDAY_CATEGORIES;
  }

  onEdit(): void {
    this.edit.emit(this.birthday);
  }

  onDelete(): void {
    this.delete.emit(this.birthday);
  }

  onSave(): void {
    this.save.emit(this.birthday);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onQuickEdit(): void {
    this.quickEdit.emit(this.birthday);
  }

  onEditInputChange(): void {
    this.editInputChange.emit(this.birthday);
  }

  onPhotoSelected(photoDataUrl: string): void {
    this.photoSelected.emit(photoDataUrl);
  }

  onPhotoRemoved(): void {
    this.photoRemoved.emit();
  }

  onRememberPhotoSelected(photoDataUrl: string): void {
    this.rememberPhotoSelected.emit(photoDataUrl);
  }

  onRememberPhotoRemoved(): void {
    this.rememberPhotoRemoved.emit();
  }

  onShareRememberPhoto(): void {
    this.shareRememberPhoto.emit(this.birthday);
  }

  onDownloadRememberPhoto(): void {
    this.downloadRememberPhoto.emit(this.birthday);
  }
}
