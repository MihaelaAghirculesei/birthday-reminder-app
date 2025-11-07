import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule, CategoryIconComponent, BIRTHDAY_CATEGORIES } from '../../../../shared';

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
  styleUrls: ['./category-filter.component.scss']
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

  isCustomCategory(categoryId: string): boolean {
    const defaultIds = BIRTHDAY_CATEGORIES.map(c => c.id);
    return !defaultIds.includes(categoryId);
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategory === categoryId;
  }
}
