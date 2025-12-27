import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { trigger, style, transition, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhotoUploadComponent, DEFAULT_CATEGORY, BirthdayCategory } from '../../shared';
import { Birthday, getZodiacSign } from '../../shared';
import { DashboardComponent } from '../dashboard';
import { BirthdayFacadeService, CategoryFacadeService } from '../../core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DashboardComponent,
    PhotoUploadComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ opacity: 0, height: '0px', overflow: 'hidden' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, height: '*', overflow: 'hidden' })
        ),
      ]),
      transition(':leave', [
        style({ opacity: 1, height: '*', overflow: 'hidden' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, height: '0px', overflow: 'hidden' })
        ),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  birthdayForm!: FormGroup;
  birthdays: Signal<Birthday[]> = this.birthdayFacade.birthdays;
  categories: Signal<BirthdayCategory[]> = this.categoryFacade.categories;
  selectedPhoto: string | null = null;
  isAddingTestData = false;
  isAddBirthdayExpanded = false;
  private testDataTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private birthdayFacade: BirthdayFacadeService,
    private categoryFacade: CategoryFacadeService,
    private cdr: ChangeDetectorRef
  ) {
    this.birthdayForm = this.fb.group({
      name: ['', Validators.required],
      birthDate: ['', [Validators.required, this.pastDateValidator]],
      category: [DEFAULT_CATEGORY, Validators.required],
      notes: [''],
      reminderDays: [7, [Validators.min(1), Validators.max(365)]],
      photo: [null],
    });
  }

  ngOnInit(): void {
    this.categoryFacade.loadCategories();
  }

  onSubmit() {
    if (this.birthdayForm.valid) {
      const birthDate = new Date(this.birthdayForm.value.birthDate);
      const zodiacSign = getZodiacSign(birthDate);

      const formData = {
        ...this.birthdayForm.value,
        photo: this.selectedPhoto,
        zodiacSign: zodiacSign.name,
      };

      this.birthdayFacade.addBirthday(formData);
      this.birthdayForm.reset({ reminderDays: 7, category: DEFAULT_CATEGORY });
      this.selectedPhoto = null;
    }
  }

  onPhotoSelected(photo: string): void {
    this.selectedPhoto = photo;
    this.birthdayForm.patchValue({ photo: photo });
  }

  onPhotoRemoved(): void {
    this.selectedPhoto = null;
    this.birthdayForm.patchValue({ photo: null });
  }

  addTestData(): void {
    this.isAddingTestData = true;
    this.birthdayFacade.loadTestData();
    this.testDataTimer = setTimeout(() => {
      this.isAddingTestData = false;
      this.testDataTimer = null;
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.testDataTimer) {
      clearTimeout(this.testDataTimer);
      this.testDataTimer = null;
    }
  }

  toggleAddBirthdaySection(): void {
    this.isAddBirthdayExpanded = !this.isAddBirthdayExpanded;
  }

  trackByCategory(_index: number, category: BirthdayCategory): string {
    return category.id;
  }

  private pastDateValidator(control: AbstractControl): ValidationErrors | null {
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
