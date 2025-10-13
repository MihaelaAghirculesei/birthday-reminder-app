import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';
import { CategoryIconComponent } from '../../../shared/components/category-icon.component';

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

  selectCategory(categoryId: string): void {
    this.categorySelected.emit(categoryId);
  }

  clearFilter(): void {
    this.filterCleared.emit();
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategory === categoryId;
  }
}
