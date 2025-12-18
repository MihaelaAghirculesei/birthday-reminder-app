import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Birthday, BirthdayCategory } from '../../../../shared';
import { BirthdayItemComponent } from './birthday-item/birthday-item.component';
import { BirthdayFacadeService, BackupService, NotificationService } from '../../../../core';
import { BirthdayEditService } from '../../services/birthday-edit.service';

interface EnrichedBirthday extends Birthday {
  daysUntilBirthday: number;
}

@Component({
  selector: 'app-birthday-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    BirthdayItemComponent
  ],
  templateUrl: './birthday-list.component.html',
  styleUrls: ['./birthday-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BirthdayListComponent implements OnChanges, OnDestroy {
  @Input() birthdays: Birthday[] = [];
  @Input() categories: BirthdayCategory[] = [];
  @Input() searchTerm = '';
  @Input() lastAction: { type: string; data: Birthday | BirthdayCategory } | null = null;
  @Input() totalBirthdays = 0;

  enrichedBirthdays: EnrichedBirthday[] = [];

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() undoAction = new EventEmitter<void>();
  @Output() addTestData = new EventEmitter<void>();
  @Output() clearAllData = new EventEmitter<void>();

  isAddingTestData = false;
  isClearingData = false;
  private testDataTimer?: ReturnType<typeof setTimeout>;
  private clearDataTimer?: ReturnType<typeof setTimeout>;

  constructor(
    public birthdayFacade: BirthdayFacadeService,
    public editService: BirthdayEditService,
    private backupService: BackupService,
    private notificationService: NotificationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['birthdays']) {
      this.enrichedBirthdays = this.birthdays.map(birthday => ({
        ...birthday,
        daysUntilBirthday: this.calculateDaysUntilBirthday(birthday.birthDate)
      }));
    }
  }

  onSearchChange(event: Event): void {
    this.searchTermChange.emit((event.target as HTMLInputElement).value);
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
    this.testDataTimer = setTimeout(() => {
      this.isAddingTestData = false;
    }, 2000);
  }

  onClearAllData(): void {
    this.isClearingData = true;
    this.clearAllData.emit();
    this.clearDataTimer = setTimeout(() => {
      this.isClearingData = false;
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.testDataTimer) clearTimeout(this.testDataTimer);
    if (this.clearDataTimer) clearTimeout(this.clearDataTimer);
  }

  onExportJSON(): void {
    this.birthdayFacade.birthdays$.pipe(
      take(1)
    ).subscribe(allBirthdays => {
      this.backupService.exportToJSON(allBirthdays);
      this.notificationService.show(`Exported ${allBirthdays.length} birthdays to JSON`, 'success');
    });
  }

  onExportCSV(): void {
    this.birthdayFacade.birthdays$.pipe(
      take(1)
    ).subscribe(allBirthdays => {
      this.backupService.exportToCSV(allBirthdays);
      this.notificationService.show(`Exported ${allBirthdays.length} birthdays to CSV`, 'success');
    });
  }

  async onImportBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const birthdays = await this.backupService.importFromFile(file);

      for (const birthday of birthdays) {
        this.birthdayFacade.addBirthday(birthday);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      this.notificationService.show(`Imported ${birthdays.length} birthdays`, 'success');
    } catch {
      this.notificationService.show('Invalid backup file', 'error');
    }

    input.value = '';
  }

  async onImportCSV(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const birthdays = await this.backupService.importFromCSV(file);

      for (const birthday of birthdays) {
        this.birthdayFacade.addBirthday(birthday);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      this.notificationService.show(`Imported ${birthdays.length} birthdays from CSV`, 'success');
    } catch {
      this.notificationService.show('Invalid CSV file', 'error');
    }

    input.value = '';
  }

  async onImportVCard(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const birthdays = await this.backupService.importFromVCard(file);
      for (const birthday of birthdays) {
        this.birthdayFacade.addBirthday(birthday);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      this.notificationService.show(`Imported ${birthdays.length} birthdays from vCard`, 'success');
    } catch {
      this.notificationService.show('Invalid vCard file', 'error');
    }
    input.value = '';
  }

  trackByBirthday(_index: number, birthday: Birthday): string {
    return birthday.id;
  }

  editBirthday(birthday: Birthday): void {
    this.editService.startEdit(
      birthday,
      this.formatDateForInput.bind(this),
      'default'
    );
  }

  deleteBirthday(birthday: Birthday): void {
    this.birthdayFacade.deleteBirthday(birthday.id);
  }

  saveBirthday(birthday: Birthday): void {
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

  quickEditName(birthday: Birthday): void {
    this.editBirthday(birthday);
    setTimeout(() => {
      const nameInput = document.querySelector('.edit-name-input') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 100);
  }

  onEditInputChange(birthday: Birthday): void {
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

  private calculateDaysUntilBirthday(birthDate: Date): number {
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
    const nextBirthday = new Date(birthDate);
    nextBirthday.setFullYear(currentYear);
    nextBirthday.setHours(0, 0, 0, 0);
    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    return nextBirthday;
  }
}
