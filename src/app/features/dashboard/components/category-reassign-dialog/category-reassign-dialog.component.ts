import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from '../../../../shared/material.module';
import { BirthdayCategory, getAllCategories } from '../../../../shared';

export interface CategoryReassignDialogData {
  categoryToDelete: BirthdayCategory;
  affectedBirthdaysCount: number;
  mode?: 'delete' | 'reassign-only';
}

@Component({
  selector: 'app-category-reassign-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  templateUrl: './category-reassign-dialog.component.html',
  styleUrls: ['./category-reassign-dialog.component.scss']
})
export class CategoryReassignDialogComponent {
  availableCategories: BirthdayCategory[] = [];
  selectedCategoryId: string | null = null;
  isReassignOnly: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<CategoryReassignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryReassignDialogData
  ) {
    this.isReassignOnly = this.data.mode === 'reassign-only';

    // Get all categories except the one being deleted/reassigned
    this.availableCategories = getAllCategories()
      .filter(cat => cat.id !== this.data.categoryToDelete.id);

    // Set default selection to the first available category
    if (this.availableCategories.length > 0) {
      this.selectedCategoryId = this.availableCategories[0].id;
    }
  }

  onConfirm(): void {
    this.dialogRef.close({
      action: 'reassign',
      newCategoryId: this.selectedCategoryId
    });
  }

  onDeleteWithoutReassign(): void {
    this.dialogRef.close({
      action: 'delete-orphan',
      newCategoryId: null
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
