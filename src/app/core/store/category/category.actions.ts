import { createAction, props } from '@ngrx/store';
import { BirthdayCategory } from '../../../shared';

export const loadCategories = createAction(
  '[Category] Load Categories'
);

export const loadCategoriesSuccess = createAction(
  '[Category] Load Categories Success',
  props<{ categories: BirthdayCategory[]; customIds: string[]; deletedIds: string[] }>()
);

export const loadCategoriesFailure = createAction(
  '[Category] Load Categories Failure',
  props<{ error: string }>()
);

export const addCategory = createAction(
  '[Category] Add Category',
  props<{ category: BirthdayCategory }>()
);

export const addCategorySuccess = createAction(
  '[Category] Add Category Success',
  props<{ category: BirthdayCategory }>()
);

export const updateCategory = createAction(
  '[Category] Update Category',
  props<{ category: BirthdayCategory }>()
);

export const updateCategorySuccess = createAction(
  '[Category] Update Category Success',
  props<{ category: BirthdayCategory }>()
);

export const deleteCategory = createAction(
  '[Category] Delete Category',
  props<{ categoryId: string }>()
);

export const deleteCategorySuccess = createAction(
  '[Category] Delete Category Success',
  props<{ categoryId: string }>()
);

export const restoreCategory = createAction(
  '[Category] Restore Category',
  props<{ categoryId: string }>()
);

export const restoreCategorySuccess = createAction(
  '[Category] Restore Category Success',
  props<{ categoryId: string }>()
);
