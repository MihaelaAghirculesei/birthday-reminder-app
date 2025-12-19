import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Observable, Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MessageSchedulerComponent } from '../../../shared/components/message-scheduler/message-scheduler.component';
import { Birthday } from '../../../shared/models';
import { BirthdayFacadeService } from '../../../core';

interface MessageScheduleDialogData {
  birthday?: Birthday;
  birthdayId?: string;
}

@Component({
  selector: 'app-message-schedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MessageSchedulerComponent
  ],
  templateUrl: './message-schedule-dialog.component.html',
  styleUrls: ['./message-schedule-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageScheduleDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedBirthday: Birthday | null = null;
  allBirthdays$: Observable<Birthday[]>;
  selectedBirthdayId = '';
  showBirthdaySelector = false;

  constructor(
    private dialogRef: MatDialogRef<MessageScheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageScheduleDialogData,
    private birthdayFacade: BirthdayFacadeService,
    private cdr: ChangeDetectorRef
  ) {
    this.allBirthdays$ = this.birthdayFacade.birthdays$;
  }

  ngOnInit(): void {
    if (this.data?.birthday) {
      this.selectedBirthday = this.data.birthday;
    } else if (this.data?.birthdayId) {
      this.allBirthdays$
        .pipe(takeUntil(this.destroy$))
        .subscribe(birthdays => {
          const found = birthdays.find(b => b.id === this.data.birthdayId);
          if (found) {
            this.selectedBirthday = found;
            this.cdr.markForCheck();
          }
        });
    } else {
      this.showBirthdaySelector = true;
    }
  }

  onBirthdaySelected(): void {
    if (this.selectedBirthdayId) {
      this.allBirthdays$
        .pipe(takeUntil(this.destroy$))
        .subscribe(birthdays => {
          const found = birthdays.find(b => b.id === this.selectedBirthdayId);
          if (found) {
            this.selectedBirthday = found;
            this.showBirthdaySelector = false;
            this.cdr.markForCheck();
          }
        });
    }
  }

  changeBirthday(): void {
    this.showBirthdaySelector = true;
    this.selectedBirthday = null;
  }

  close(): void {
    this.dialogRef.close();
  }

  trackByBirthday(_index: number, birthday: Birthday): string {
    return birthday.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
