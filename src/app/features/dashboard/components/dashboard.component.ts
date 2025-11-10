import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule, DEFAULT_CATEGORY, getAllCategories } from '../../../shared';
import { CalendarIconComponent } from '../../../shared/icons/calendar-icon.component';
import { GoogleCalendarSyncComponent } from '../../calendar-sync/google-calendar-sync.component';
import { DashboardStatsComponent } from './stats/dashboard-stats.component';
import { BirthdayChartComponent } from './birthday-chart/birthday-chart.component';
import { CategoryFilterComponent, CategoryStats } from './category-filter/category-filter.component';
import { BirthdayListComponent } from './birthday-list/birthday-list.component';
import { CategoryDialogComponent } from './category-dialog/category-dialog.component';
import { CategoryReassignDialogComponent } from './category-reassign-dialog/category-reassign-dialog.component';
import { MessageScheduleDialogComponent } from '../../scheduled-messages/message-schedule-dialog/message-schedule-dialog.component';
import { BirthdayFacadeService } from '../../../core';
import { BirthdayEditService, BirthdayStatsService, ChartDataItem } from '../services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    CalendarIconComponent,
    DashboardStatsComponent,
    BirthdayChartComponent,
    CategoryFilterComponent,
    BirthdayListComponent,
    GoogleCalendarSyncComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  totalBirthdays$: Observable<number>;
  birthdaysThisMonth$: Observable<number>;
  averageAge$: Observable<number>;
  nextBirthdayDays$: Observable<number>;
  nextBirthdayText$: Observable<string>;
  chartData$: Observable<ChartDataItem[]>;
  maxCount$: Observable<number>;
  categoriesStats$: Observable<CategoryStats[]>;
  allBirthdays$: Observable<any[]>;

  selectedCategory: string | null = null;
  currentMonth = new Date().getMonth();
  dashboardSearchTerm = '';
  lastAction: { type: string; data: any } | null = null;

  constructor(
    public birthdayFacade: BirthdayFacadeService,
    public editService: BirthdayEditService,
    private statsService: BirthdayStatsService,
    private dialog: MatDialog
  ) {
    this.totalBirthdays$ = this.birthdayFacade.birthdays$.pipe(
      map((birthdays) => birthdays.length)
    );

    this.birthdaysThisMonth$ = this.birthdayFacade.getBirthdaysNext30Days().pipe(
      map((birthdays) => birthdays.length)
    );

    this.averageAge$ = this.birthdayFacade.averageAge$;

    this.nextBirthdayDays$ = this.birthdayFacade.next5Birthdays$.pipe(
      map((nextBirthdays) => {
        if (nextBirthdays.length > 0) {
          return nextBirthdays[0].daysUntil;
        }
        return 0;
      })
    );

    this.nextBirthdayText$ = this.birthdayFacade.next5Birthdays$.pipe(
      map((nextBirthdays) => {
        if (nextBirthdays.length === 0) return 'N/A';
        const days = nextBirthdays[0].daysUntil;
        if (days === 0) return 'Today!';
        if (days === 1) return 'Tomorrow!';
        return `In ${days} days`;
      })
    );

    this.chartData$ = this.birthdayFacade.birthdays$.pipe(
      map((birthdays) => this.statsService.getChartData(birthdays))
    );

    this.maxCount$ = this.chartData$.pipe(
      map((chartData) => this.statsService.getMaxCount(chartData))
    );

    this.categoriesStats$ = this.birthdayFacade.birthdays$.pipe(
      map((birthdays) => {
        const stats = this.statsService.getCategoriesStats(birthdays);
        const allCategories = getAllCategories();

        const statsMap = new Map(stats.map(s => [s.categoryId, s.count]));

        return allCategories.map(category => ({
          id: category.id,
          name: category.name,
          count: statsMap.get(category.id) || 0
        }));
      })
    );

    this.allBirthdays$ = this.birthdayFacade.birthdays$.pipe(
      map((birthdays) => this.getSortedFilteredBirthdays(birthdays))
    );
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = this.selectedCategory === categoryId ? null : categoryId;
    this.updateAllBirthdays();
  }

  clearCategoryFilter(): void {
    this.selectedCategory = null;
    this.updateAllBirthdays();
  }

  onAddCategory(): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '600px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newCategory = {
          id: this.generateCategoryId(result.name),
          name: result.name,
          icon: result.icon,
          color: result.color
        };

        this.saveCustomCategory(newCategory);
      }
    });
  }

  onEditCategory(categoryId: string): void {
    const allCategories = getAllCategories();
    const category = allCategories.find(c => c.id === categoryId);

    if (!category) return;

    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        category: category
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedCategory = {
          ...category,
          name: result.name,
          icon: result.icon,
          color: result.color
        };

        this.updateCategory(categoryId, updatedCategory);
      }
    });
  }

  onDeleteCategory(categoryId: string): void {
    const allCategories = getAllCategories();
    const category = allCategories.find(c => c.id === categoryId);

    if (!category) return;

    // Check if there are birthdays using this category
    this.birthdayFacade.birthdays$.subscribe(birthdays => {
      const affectedBirthdays = birthdays.filter(b => b.category === categoryId);

      if (affectedBirthdays.length > 0) {
        // Open dialog to handle reassignment
        const dialogRef = this.dialog.open(CategoryReassignDialogComponent, {
          width: '600px',
          maxWidth: '95vw',
          data: {
            categoryToDelete: category,
            affectedBirthdaysCount: affectedBirthdays.length
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            if (result.action === 'reassign' && result.newCategoryId) {
              // Reassign all affected birthdays to new category
              this.reassignBirthdaysToCategory(affectedBirthdays, result.newCategoryId);
              this.deleteCategory(categoryId);
            } else if (result.action === 'delete-orphan') {
              // Delete category, birthdays will use default category
              this.deleteCategory(categoryId);
            }
          }
        });
      } else {
        // No birthdays affected, just confirm deletion
        if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
          this.deleteCategory(categoryId);
        }
      }
    }).unsubscribe();
  }

  openMessageDialog(event?: MouseEvent): void {
    if (event?.target instanceof HTMLElement) {
      const button = event.target.closest('button');
      if (button) {
        button.blur();
      }
    }

    this.dialog.open(MessageScheduleDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: 'dialog',
      restoreFocus: true
    });
  }

  private generateCategoryId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  }

  private saveCustomCategory(category: any): void {
    const customCategories = this.getCustomCategories();
    customCategories.push(category);
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    this.refreshCategories();
  }

  private updateCategory(categoryId: string, updatedCategory: any): void {
    const modifiedCategories = this.getModifiedCategories();
    const index = modifiedCategories.findIndex(c => c.id === categoryId);

    if (index !== -1) {
      modifiedCategories[index] = updatedCategory;
    } else {
      modifiedCategories.push(updatedCategory);
    }

    localStorage.setItem('modifiedCategories', JSON.stringify(modifiedCategories));
    this.refreshCategories();
  }

  private deleteCategory(categoryId: string): void {
    const deletedIds = this.getDeletedCategoryIds();
    if (!deletedIds.includes(categoryId)) {
      deletedIds.push(categoryId);
      localStorage.setItem('deletedCategoryIds', JSON.stringify(deletedIds));
    }
    this.refreshCategories();
  }

  private reassignBirthdaysToCategory(birthdays: any[], newCategoryId: string): void {
    birthdays.forEach(birthday => {
      const updatedBirthday = {
        ...birthday,
        category: newCategoryId
      };
      this.birthdayFacade.updateBirthday(updatedBirthday);
    });
  }

  private getModifiedCategories(): any[] {
    const stored = localStorage.getItem('modifiedCategories');
    return stored ? JSON.parse(stored) : [];
  }

  private getDeletedCategoryIds(): string[] {
    const stored = localStorage.getItem('deletedCategoryIds');
    return stored ? JSON.parse(stored) : [];
  }

  private refreshCategories(): void {
    this.categoriesStats$ = this.birthdayFacade.birthdays$.pipe(
      map((birthdays) => {
        const stats = this.statsService.getCategoriesStats(birthdays);
        const allCategories = getAllCategories();
        const validCategoryIds = new Set(allCategories.map(c => c.id));

        const statsMap = new Map(stats.map(s => [s.categoryId, s.count]));

        // Count orphaned birthdays (with non-existent categories)
        const orphanedCount = birthdays.filter(b =>
          b.category && !validCategoryIds.has(b.category)
        ).length;

        const categoryStats = allCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          count: statsMap.get(cat.id) || 0
        }));

        // Add orphaned category if there are orphaned birthdays
        if (orphanedCount > 0) {
          categoryStats.unshift({
            id: '__orphaned__',
            name: '⚠️ Uncategorized',
            count: orphanedCount
          });
        }

        return categoryStats;
      })
    );
  }

  private getCustomCategories(): any[] {
    const stored = localStorage.getItem('customCategories');
    return stored ? JSON.parse(stored) : [];
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategory === categoryId;
  }

  onSearchTermChange(searchTerm: string): void {
    this.dashboardSearchTerm = searchTerm;
    this.updateAllBirthdays();
  }

  onClearSearch(): void {
    this.dashboardSearchTerm = '';
    this.updateAllBirthdays();
  }

  getSortedFilteredBirthdays(birthdays: any[] | null): any[] {
    if (!birthdays) return [];

    let filtered = [...birthdays];

    if (this.selectedCategory) {
      if (this.selectedCategory === '__orphaned__') {
        // Filter orphaned birthdays (with non-existent categories)
        const validCategoryIds = new Set(getAllCategories().map(c => c.id));
        filtered = filtered.filter(b => b.category && !validCategoryIds.has(b.category));
      } else {
        filtered = filtered.filter(b => b.category === this.selectedCategory);
      }
    }

    if (this.dashboardSearchTerm) {
      const searchLower = this.dashboardSearchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => {
      const daysA = this.getDaysUntilBirthday(a.birthDate);
      const daysB = this.getDaysUntilBirthday(b.birthDate);
      return daysA - daysB;
    });
  }

  addTestData(): void {
    this.birthdayFacade.loadTestData();
  }

  clearAllData(): void {
    this.birthdayFacade.clearAllBirthdays();
    this.lastAction = null;
  }

  undoLastAction(): void {
    if (this.lastAction && this.lastAction.type === 'delete') {
      this.birthdayFacade.addBirthday(this.lastAction.data);
      this.lastAction = null;
    }
  }

  private getDaysUntilBirthday(birthDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextBirthday = this.getNextBirthdayDate(birthDate);
    nextBirthday.setHours(0, 0, 0, 0);
    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  private getNextBirthdayDate(birthDate: Date): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    return nextBirthday;
  }

  onBirthdayDeleted(birthday: any): void {
    this.lastAction = { type: 'delete', data: { ...birthday } };
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.editService.currentEditingId) return;

    const target = event.target as HTMLElement;
    if (target.closest('button, mat-icon')) return;

    const clickedBirthdayItem = target.closest('.dashboard-birthday-item') as HTMLElement;

    if (clickedBirthdayItem) {
      const isInEditMode = clickedBirthdayItem.querySelector('.edit-name-input, .dashboard-category-edit, .dashboard-photo-edit');
      if (!isInEditMode) {
        this.editService.cancelEdit();
      }
    } else {
      this.editService.cancelEdit();
    }
  }

  private updateAllBirthdays(): void {
    this.allBirthdays$ = this.birthdayFacade.birthdays$.pipe(
      map((birthdays) => this.getSortedFilteredBirthdays(birthdays))
    );
  }
}
