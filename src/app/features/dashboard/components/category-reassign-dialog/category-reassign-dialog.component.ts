import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from '../../../../shared/material.module';
import { BirthdayCategory, getAllCategories } from '../../../../shared';

export interface CategoryReassignDialogData {
  categoryToDelete: BirthdayCategory;
  affectedBirthdaysCount: number;
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

  constructor(
    private dialogRef: MatDialogRef<CategoryReassignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryReassignDialogData
  ) {
    // Get all categories except the one being deleted
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
