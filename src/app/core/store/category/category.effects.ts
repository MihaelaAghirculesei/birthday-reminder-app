import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import * as CategoryActions from './category.actions';
import { BIRTHDAY_CATEGORIES, BirthdayCategory } from '../../../shared';

@Injectable()
export class CategoryEffects {
  constructor(private actions$: Actions) {}

  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.loadCategories),
      map(() => {
        try {
          // Load from localStorage
          const customCategoriesStr = localStorage.getItem('customCategories');
          const modifiedCategoriesStr = localStorage.getItem('modifiedCategories');
          const deletedIdsStr = localStorage.getItem('deletedCategoryIds');

          const customCategories = customCategoriesStr
            ? JSON.parse(customCategoriesStr)
            : [];
          const modifiedCategories = modifiedCategoriesStr
            ? JSON.parse(modifiedCategoriesStr)
            : [];
          const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

          // Create a map of modifications
          const modifiedMap = new Map(
            modifiedCategories.map((cat: BirthdayCategory) => [cat.id, cat])
          );

          // Apply modifications to default categories
          const defaultCategories = BIRTHDAY_CATEGORIES.map((cat) =>
            modifiedMap.get(cat.id) || cat
          );

          // Apply modifications to custom categories
          const processedCustomCategories = customCategories.map((cat: BirthdayCategory) =>
            modifiedMap.get(cat.id) || cat
          );

          // Combine all categories
          const allCategories = [...defaultCategories, ...processedCustomCategories];

          // Get custom category IDs
          const customIds = customCategories.map((cat: BirthdayCategory) => cat.id);

          return CategoryActions.loadCategoriesSuccess({
            categories: allCategories,
            customIds,
            deletedIds,
          });
        } catch (error) {
          return CategoryActions.loadCategoriesFailure({
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }),
      catchError((error) =>
        of(
          CategoryActions.loadCategoriesFailure({
            error: error.message || 'Failed to load categories',
          })
        )
      )
    )
  );

  addCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.addCategory),
      tap(({ category }) => {
        try {
          const customCategoriesStr = localStorage.getItem('customCategories');
          const customCategories = customCategoriesStr
            ? JSON.parse(customCategoriesStr)
            : [];
          customCategories.push(category);
          localStorage.setItem('customCategories', JSON.stringify(customCategories));
        } catch (error) {
          console.error('Failed to save custom category:', error);
        }
      }),
      map(({ category }) => CategoryActions.addCategorySuccess({ category }))
    )
  );

  updateCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.updateCategory),
      tap(({ category }) => {
        try {
          const modifiedCategoriesStr = localStorage.getItem('modifiedCategories');
          const modifiedCategories = modifiedCategoriesStr
            ? JSON.parse(modifiedCategoriesStr)
            : [];

          const index = modifiedCategories.findIndex(
            (c: BirthdayCategory) => c.id === category.id
          );

          if (index !== -1) {
            modifiedCategories[index] = category;
          } else {
            modifiedCategories.push(category);
          }

          localStorage.setItem(
            'modifiedCategories',
            JSON.stringify(modifiedCategories)
          );
        } catch (error) {
          console.error('Failed to save category modification:', error);
        }
      }),
      map(({ category }) => CategoryActions.updateCategorySuccess({ category }))
    )
  );

  deleteCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.deleteCategory),
      tap(({ categoryId }) => {
        try {
          const deletedIdsStr = localStorage.getItem('deletedCategoryIds');
          const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

          if (!deletedIds.includes(categoryId)) {
            deletedIds.push(categoryId);
            localStorage.setItem('deletedCategoryIds', JSON.stringify(deletedIds));
          }
        } catch (error) {
          console.error('Failed to save deleted category ID:', error);
        }
      }),
      map(({ categoryId }) =>
        CategoryActions.deleteCategorySuccess({ categoryId })
      )
    )
  );

  restoreCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.restoreCategory),
      tap(({ categoryId }) => {
        try {
          const deletedIdsStr = localStorage.getItem('deletedCategoryIds');
          const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

          const updatedIds = deletedIds.filter((id: string) => id !== categoryId);
          localStorage.setItem('deletedCategoryIds', JSON.stringify(updatedIds));
        } catch (error) {
          console.error('Failed to restore category:', error);
        }
      }),
      map(({ categoryId }) =>
        CategoryActions.restoreCategorySuccess({ categoryId })
      )
    )
  );
}
