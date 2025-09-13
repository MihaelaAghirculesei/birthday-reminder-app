import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { MaterialModule } from './shared/material.module';
import { DashboardComponent } from './components/dashboard.component';
import { PhotoUploadComponent } from './shared/components/photo-upload.component';
import { NetworkStatusComponent } from './shared/components/network-status.component';
import { NotificationComponent } from './shared/components/notification.component';

import { BirthdayService } from './services/birthday.service';
import { Birthday } from './models/birthday.model';
import { getZodiacSign } from './shared/utils/zodiac.util';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    DashboardComponent,
    PhotoUploadComponent,
    NetworkStatusComponent,
    NotificationComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ opacity: 0, height: '0px', overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 1, height: '*', overflow: 'hidden' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, height: '*', overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ opacity: 0, height: '0px', overflow: 'hidden' }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  title = 'Birthday Reminder App';
  birthdayForm: FormGroup;
  birthdays$: Observable<Birthday[]>;
  selectedPhoto: string | null = null;
  isAddingTestData = false;
  isAddBirthdayExpanded = false;


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


  onPhotoSelected(photo: string): void {
    this.selectedPhoto = photo;
    this.birthdayForm.patchValue({ photo: photo });
  }

  onPhotoRemoved(): void {
    this.selectedPhoto = null;
    this.birthdayForm.patchValue({ photo: null });
  }


  async addTestData(): Promise<void> {
    this.isAddingTestData = true;
    try {
      await this.birthdayService.addTestBirthdays();
    } finally {
      this.isAddingTestData = false;
    }
  }

  toggleAddBirthdaySection(): void {
    this.isAddBirthdayExpanded = !this.isAddBirthdayExpanded;
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