import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoryState, categoryAdapter } from './category.state';

export const selectCategoryState = createFeatureSelector<CategoryState>('categories');

const { selectAll, selectEntities } = categoryAdapter.getSelectors();

export const selectAllCategoriesRaw = createSelector(
  selectCategoryState,
  selectAll
);

export const selectCategoryEntities = createSelector(
  selectCategoryState,
  selectEntities
);

export const selectDeletedCategoryIds = createSelector(
  selectCategoryState,
  (state) => state.deletedCategoryIds
);

export const selectCustomCategoryIds = createSelector(
  selectCategoryState,
  (state) => state.customCategoryIds
);

export const selectAllCategories = createSelector(
  selectAllCategoriesRaw,
  selectDeletedCategoryIds,
  (categories, deletedIds) =>
    categories.filter(cat => !deletedIds.includes(cat.id))
);

export const selectCategoryById = (categoryId: string) =>
  createSelector(
    selectCategoryEntities,
    selectDeletedCategoryIds,
    (entities, deletedIds) => {
      if (deletedIds.includes(categoryId)) return undefined;
      return entities[categoryId];
    }
  );

export const selectCategoriesLoaded = createSelector(
  selectCategoryState,
  (state) => state.loaded
);

export const selectCategoriesLoading = createSelector(
  selectCategoryState,
  (state) => state.loading
);

export const selectCategoriesError = createSelector(
  selectCategoryState,
  (state) => state.error
);

export const selectDefaultCategories = createSelector(
  selectAllCategories,
  selectCustomCategoryIds,
  (categories, customIds) =>
    categories.filter(cat => !customIds.includes(cat.id))
);

export const selectCustomCategories = createSelector(
  selectAllCategories,
  selectCustomCategoryIds,
  (categories, customIds) =>
    categories.filter(cat => customIds.includes(cat.id))
);
