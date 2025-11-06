import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { trigger, style, transition, animate } from '@angular/animations';

import { MaterialModule, PhotoUploadComponent, NotificationComponent, getAllCategories, DEFAULT_CATEGORY } from './shared';
import { Birthday, getZodiacSign } from './shared';
import { DashboardComponent } from './features/dashboard';
import { BirthdayFacadeService } from './core';
import { HeaderComponent, FooterComponent } from './layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    DashboardComponent,
    PhotoUploadComponent,
    NotificationComponent,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
export class AppComponent {
  title = 'Birthday Reminder App';
  birthdayForm: FormGroup;
  birthdays$: Observable<Birthday[]>;
  selectedPhoto: string | null = null;
  isAddingTestData = false;
  isAddBirthdayExpanded = false;
  availableCategories = getAllCategories();

  constructor(
    private fb: FormBuilder,
    private birthdayFacade: BirthdayFacadeService
  ) {
    this.birthdayForm = this.fb.group({
      name: ['', Validators.required],
      birthDate: ['', [Validators.required, this.pastDateValidator]],
      category: [DEFAULT_CATEGORY, Validators.required],
      notes: [''],
      reminderDays: [7, [Validators.min(1), Validators.max(365)]],
      photo: [null],
    });

    this.birthdays$ = this.birthdayFacade.birthdays$;
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
      this.availableCategories = getAllCategories();
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
    // Reset loading state after a short delay to allow the effect to complete
    setTimeout(() => {
      this.isAddingTestData = false;
    }, 1000);
  }

  toggleAddBirthdaySection(): void {
    this.isAddBirthdayExpanded = !this.isAddBirthdayExpanded;
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
