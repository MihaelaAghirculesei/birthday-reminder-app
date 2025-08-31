import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { MaterialModule } from './shared/material.module';
import { DashboardComponent } from './components/dashboard.component';
import { CalendarIconComponent } from './shared/icons/calendar-icon.component';
import { PhotoUploadComponent } from './shared/components/photo-upload.component';
import { ZodiacIconComponent } from './shared/components/zodiac-icon.component';
import { NetworkStatusComponent } from './shared/components/network-status.component';

import { BirthdayService } from './services/birthday.service';
import { Birthday } from './models/birthday.model';
import { MONTHS, SORT_OPTIONS } from './shared/constants';
import { getZodiacSign } from './shared/utils/zodiac.util';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    DashboardComponent,
    CalendarIconComponent,
    PhotoUploadComponent,
    ZodiacIconComponent,
    NetworkStatusComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Birthday Reminder App';
  birthdayForm: FormGroup;
  birthdays$: Observable<Birthday[]>;
  filteredBirthdays$: Observable<Birthday[]>;
  selectedPhoto: string | null = null;

  searchTerm$ = this.birthdayService.searchTerm$;
  selectedMonth$ = this.birthdayService.selectedMonth$;
  sortOrder$ = this.birthdayService.sortOrder$;
  
  months = MONTHS.FULL;
  sortOptions = SORT_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private birthdayService: BirthdayService
  ) {
    this.birthdayForm = this.fb.group({
      name: ['', Validators.required],
      birthDate: ['', [Validators.required, this.pastDateValidator]],
      notes: [''],
      reminderDays: [7, [Validators.min(1), Validators.max(365)]],
      photo: [null]
    });

    this.birthdays$ = this.birthdayService.birthdays$;
    this.filteredBirthdays$ = this.birthdayService.filteredBirthdays$;
  }

  ngOnInit() {}

  onSubmit() {
    if (this.birthdayForm.valid) {
      const birthDate = new Date(this.birthdayForm.value.birthDate);
      const zodiacSign = getZodiacSign(birthDate);
      
      const formData = {
        ...this.birthdayForm.value,
        photo: this.selectedPhoto,
        zodiacSign: zodiacSign.name
      };
      this.birthdayService.addBirthday(formData);
      this.birthdayForm.reset();
      this.birthdayForm.patchValue({ reminderDays: 7 });
      this.selectedPhoto = null;
    }
  }

  deleteBirthday(id: string) {
    this.birthdayService.deleteBirthday(id);
  }

  getNextBirthdayText(birthDate: Date): string {
    return this.birthdayService.getNextBirthdayText(birthDate);
  }

  calculateAge(birthDate: Date): number {
    return this.birthdayService.calculateAge(birthDate);
  }

  onSearchChange(event: any): void {
    this.birthdayService.setSearchTerm(event.target.value);
  }

  onMonthChange(month: number | null): void {
    this.birthdayService.setSelectedMonth(month);
  }

  onSortChange(sortOrder: string): void {
    this.birthdayService.setSortOrder(sortOrder);
  }

  clearFilters(): void {
    this.birthdayService.clearFilters();
  }

  onPhotoSelected(photo: string): void {
    this.selectedPhoto = photo;
    this.birthdayForm.patchValue({ photo: photo });
  }

  onPhotoRemoved(): void {
    this.selectedPhoto = null;
    this.birthdayForm.patchValue({ photo: null });
  }

  getMonthName(monthIndex: number | null): string {
    if (monthIndex === null || monthIndex < 0) return '';
    return this.months[monthIndex] || '';
  }

  private pastDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); 
    
    if (selectedDate > today) {
      return { futureDate: true };
    }
    
    return null;
  }
}