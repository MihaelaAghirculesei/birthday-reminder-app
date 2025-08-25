import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { MaterialModule } from './shared/material.module';
import { DashboardComponent } from './components/dashboard.component';
import { CalendarIconComponent } from './shared/icons/calendar-icon.component';

import { BirthdayService } from './services/birthday.service';
import { Birthday } from './models/birthday.model';
import { MONTHS, SORT_OPTIONS } from './shared/constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    DashboardComponent,
    CalendarIconComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Birthday Reminder App';
  birthdayForm: FormGroup;
  birthdays$: Observable<Birthday[]>;
  filteredBirthdays$: Observable<Birthday[]>;
  
  // Filter properties
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
      reminderDays: [7, [Validators.min(1), Validators.max(365)]]
    });

    this.birthdays$ = this.birthdayService.birthdays$;
    this.filteredBirthdays$ = this.birthdayService.filteredBirthdays$;
  }

  ngOnInit() {}

  onSubmit() {
    if (this.birthdayForm.valid) {
      this.birthdayService.addBirthday(this.birthdayForm.value);
      this.birthdayForm.reset();
      this.birthdayForm.patchValue({ reminderDays: 7 });
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

  // Filter methods
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

  getMonthName(monthIndex: number | null): string {
    if (monthIndex === null || monthIndex < 0) return '';
    return this.months[monthIndex] || '';
  }

  // Custom validator to prevent future dates
  private pastDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (selectedDate > today) {
      return { futureDate: true };
    }
    
    return null;
  }
}