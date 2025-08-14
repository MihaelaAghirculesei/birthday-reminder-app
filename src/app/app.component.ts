import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { BirthdayService } from './services/birthday.service';
import { Birthday } from './models/birthday.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
    MatSelectModule,
    MatChipsModule
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
  
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'age', label: 'Age (Oldest first)' },
    { value: 'nextBirthday', label: 'Next Birthday' }
  ];

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
    const today = new Date();
    const currentYear = today.getFullYear();
    const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow!';
    return `In ${diffDays} days`;
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