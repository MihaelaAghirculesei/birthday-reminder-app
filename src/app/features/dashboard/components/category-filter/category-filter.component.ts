import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule, CategoryIconComponent } from '../../../../shared';

export interface CategoryStats {
  id: string;
  name: string;
  count: number;
}

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule, MaterialModule, CategoryIconComponent],
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryFilterComponent {
  @Input() categoriesStats: CategoryStats[] = [];
  @Input() selectedCategory: string | null = null;

  @Output() categorySelected = new EventEmitter<string>();
  @Output() filterCleared = new EventEmitter<void>();
  @Output() addCategoryClicked = new EventEmitter<void>();
  @Output() editCategoryClicked = new EventEmitter<string>();
  @Output() deleteCategoryClicked = new EventEmitter<string>();

  selectCategory(categoryId: string): void {
    this.categorySelected.emit(categoryId);
  }

  clearFilter(): void {
    this.filterCleared.emit();
  }

  addNewCategory(): void {
    this.addCategoryClicked.emit();
  }

  editCategory(event: Event, categoryId: string): void {
    event.stopPropagation();
    this.editCategoryClicked.emit(categoryId);
  }

  deleteCategory(event: Event, categoryId: string): void {
    event.stopPropagation();
    this.deleteCategoryClicked.emit(categoryId);
  }

  trackByCategoryStats(_index: number, categoryStats: CategoryStats): string {
    return categoryStats.id;
  }
}
