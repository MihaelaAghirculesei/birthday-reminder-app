import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { BirthdayCategory } from '../../shared';
import { AppState } from '../store/app.state';
import * as CategoryActions from '../store/category/category.actions';
import * as CategorySelectors from '../store/category/category.selectors';

@Injectable({
  providedIn: 'root',
})
export class CategoryFacadeService {
  // Observables
  categories$ = this.store.select(CategorySelectors.selectAllCategories);
  defaultCategories$ = this.store.select(CategorySelectors.selectDefaultCategories);
  customCategories$ = this.store.select(CategorySelectors.selectCustomCategories);
  loaded$ = this.store.select(CategorySelectors.selectCategoriesLoaded);
  loading$ = this.store.select(CategorySelectors.selectCategoriesLoading);
  error$ = this.store.select(CategorySelectors.selectCategoriesError);

  constructor(private store: Store<AppState>) {}

  loadCategories(): void {
    this.store.dispatch(CategoryActions.loadCategories());
  }

  addCategory(category: BirthdayCategory): void {
    this.store.dispatch(CategoryActions.addCategory({ category }));
  }

  updateCategory(category: BirthdayCategory): void {
    this.store.dispatch(CategoryActions.updateCategory({ category }));
  }

  deleteCategory(categoryId: string): void {
    this.store.dispatch(CategoryActions.deleteCategory({ categoryId }));
  }

  restoreCategory(categoryId: string): void {
    this.store.dispatch(CategoryActions.restoreCategory({ categoryId }));
  }

  getCategoryById(categoryId: string): Observable<BirthdayCategory | undefined> {
    return this.store.select(CategorySelectors.selectCategoryById(categoryId));
  }
}
