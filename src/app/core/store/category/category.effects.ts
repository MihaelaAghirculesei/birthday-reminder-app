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

          const modifiedMap = new Map(
            modifiedCategories.map((cat: BirthdayCategory) => [cat.id, cat])
          );

          const defaultCategories = BIRTHDAY_CATEGORIES.map((cat) =>
            modifiedMap.get(cat.id) || cat
          );
          const processedCustomCategories = customCategories.map((cat: BirthdayCategory) =>
            modifiedMap.get(cat.id) || cat
          );

          const allCategories = [...defaultCategories, ...processedCustomCategories];

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
        }
      }),
      map(({ categoryId }) =>
        CategoryActions.restoreCategorySuccess({ categoryId })
      )
    )
  );
}
