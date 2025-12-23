import { Injectable, isDevMode } from '@angular/core';
import { BirthdayCategory } from '../../shared';

@Injectable({
  providedIn: 'root'
})
export class CategoryStorageService {
  private readonly CUSTOM_CATEGORIES_KEY = 'customCategories';
  private readonly MODIFIED_CATEGORIES_KEY = 'modifiedCategories';
  private readonly DELETED_IDS_KEY = 'deletedCategoryIds';

  getCustomCategories(): BirthdayCategory[] {
    try {
      const data = localStorage.getItem(this.CUSTOM_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to load custom categories:', error);
      }
      return [];
    }
  }

  getModifiedCategories(): BirthdayCategory[] {
    try {
      const data = localStorage.getItem(this.MODIFIED_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to load modified categories:', error);
      }
      return [];
    }
  }

  getDeletedIds(): string[] {
    try {
      const data = localStorage.getItem(this.DELETED_IDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to load deleted category IDs:', error);
      }
      return [];
    }
  }

  addCustomCategory(category: BirthdayCategory): void {
    try {
      const categories = this.getCustomCategories();
      categories.push(category);
      localStorage.setItem(this.CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to save custom category:', error);
      }
    }
  }

  updateCategory(category: BirthdayCategory): void {
    try {
      const categories = this.getModifiedCategories();
      const index = categories.findIndex(c => c.id === category.id);

      if (index !== -1) {
        categories[index] = category;
      } else {
        categories.push(category);
      }

      localStorage.setItem(this.MODIFIED_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to update category:', error);
      }
    }
  }

  deleteCategory(categoryId: string): void {
    try {
      const deletedIds = this.getDeletedIds();

      if (!deletedIds.includes(categoryId)) {
        deletedIds.push(categoryId);
        localStorage.setItem(this.DELETED_IDS_KEY, JSON.stringify(deletedIds));
      }
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to delete category:', error);
      }
    }
  }

  restoreCategory(categoryId: string): void {
    try {
      const deletedIds = this.getDeletedIds();
      const updatedIds = deletedIds.filter(id => id !== categoryId);
      localStorage.setItem(this.DELETED_IDS_KEY, JSON.stringify(updatedIds));
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to restore category:', error);
      }
    }
  }
}
