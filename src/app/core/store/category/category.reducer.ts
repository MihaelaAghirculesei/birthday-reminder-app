import { createReducer, on } from '@ngrx/store';
import * as CategoryActions from './category.actions';
import { categoryAdapter, initialCategoryState } from './category.state';

export const categoryReducer = createReducer(
  initialCategoryState,

  on(CategoryActions.loadCategories, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CategoryActions.loadCategoriesSuccess, (state, { categories, customIds, deletedIds }) =>
    categoryAdapter.setAll(categories, {
      ...state,
      customCategoryIds: customIds,
      deletedCategoryIds: deletedIds,
      loaded: true,
      loading: false,
      error: null,
    })
  ),

  on(CategoryActions.loadCategoriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(CategoryActions.addCategorySuccess, (state, { category }) =>
    categoryAdapter.addOne(category, {
      ...state,
      customCategoryIds: [...state.customCategoryIds, category.id],
    })
  ),

  on(CategoryActions.updateCategorySuccess, (state, { category }) =>
    categoryAdapter.updateOne(
      { id: category.id, changes: category },
      state
    )
  ),

  on(CategoryActions.deleteCategorySuccess, (state, { categoryId }) => ({
    ...state,
    deletedCategoryIds: [...state.deletedCategoryIds, categoryId],
  })),

  on(CategoryActions.restoreCategorySuccess, (state, { categoryId }) => ({
    ...state,
    deletedCategoryIds: state.deletedCategoryIds.filter(id => id !== categoryId),
  }))
);
