import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import * as CategoryActions from './category.actions';
import { BIRTHDAY_CATEGORIES, BirthdayCategory } from '../../../shared';
import { CategoryStorageService } from '../../services/category-storage.service';

@Injectable()
export class CategoryEffects {
  constructor(
    private actions$: Actions,
    private categoryStorage: CategoryStorageService
  ) {}

  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.loadCategories),
      map(() => {
        try {
          const customCategories = this.categoryStorage.getCustomCategories();
          const modifiedCategories = this.categoryStorage.getModifiedCategories();
          const deletedIds = this.categoryStorage.getDeletedIds();

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
      tap(({ category }) => this.categoryStorage.addCustomCategory(category)),
      map(({ category }) => CategoryActions.addCategorySuccess({ category }))
    )
  );

  updateCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.updateCategory),
      tap(({ category }) => this.categoryStorage.updateCategory(category)),
      map(({ category }) => CategoryActions.updateCategorySuccess({ category }))
    )
  );

  deleteCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.deleteCategory),
      tap(({ categoryId }) => this.categoryStorage.deleteCategory(categoryId)),
      map(({ categoryId }) =>
        CategoryActions.deleteCategorySuccess({ categoryId })
      )
    )
  );

  restoreCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.restoreCategory),
      tap(({ categoryId }) => this.categoryStorage.restoreCategory(categoryId)),
      map(({ categoryId }) =>
        CategoryActions.restoreCategorySuccess({ categoryId })
      )
    )
  );
}
