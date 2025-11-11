import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, map, takeUntil, combineLatest, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule, DEFAULT_CATEGORY, BirthdayCategory } from '../../../shared';
import { CalendarIconComponent } from '../../../shared/icons/calendar-icon.component';
import { GoogleCalendarSyncComponent } from '../../calendar-sync/google-calendar-sync.component';
import { DashboardStatsComponent } from './stats/dashboard-stats.component';
import { BirthdayChartComponent } from './birthday-chart/birthday-chart.component';
import { CategoryFilterComponent, CategoryStats } from './category-filter/category-filter.component';
import { BirthdayListComponent } from './birthday-list/birthday-list.component';
import { CategoryDialogComponent } from './category-dialog/category-dialog.component';
import { CategoryReassignDialogComponent } from './category-reassign-dialog/category-reassign-dialog.component';
import { MessageScheduleDialogComponent } from '../../scheduled-messages/message-schedule-dialog/message-schedule-dialog.component';
import { BirthdayFacadeService, CategoryFacadeService } from '../../../core';
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
export class DashboardComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  totalBirthdays$: Observable<number>;
  birthdaysThisMonth$: Observable<number>;
  averageAge$: Observable<number>;
  nextBirthdayDays$: Observable<number>;
  nextBirthdayText$: Observable<string>;
  chartData$: Observable<ChartDataItem[]>;
  maxCount$: Observable<number>;
  categoriesStats$: Observable<CategoryStats[]>;
  allBirthdays$: Observable<any[]>;
  categories$: Observable<BirthdayCategory[]>;

  selectedCategory: string | null = null;
  currentMonth = new Date().getMonth();
  dashboardSearchTerm = '';
  lastAction: { type: string; data: any } | null = null;

  constructor(
    public birthdayFacade: BirthdayFacadeService,
    private categoryFacade: CategoryFacadeService,
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

    this.categoriesStats$ = combineLatest([
      this.birthdayFacade.birthdays$,
      this.categoryFacade.categories$
    ]).pipe(
      map(([birthdays, allCategories]) => {
        const stats = this.statsService.getCategoriesStats(birthdays);
        const validCategoryIds = new Set(allCategories.map(c => c.id));
        const statsMap = new Map(stats.map(s => [s.categoryId, s.count]));

        // Count orphaned birthdays (with non-existent categories)
        const orphanedCount = birthdays.filter(b =>
          b.category && !validCategoryIds.has(b.category)
        ).length;

        const categoryStats = allCategories.map(category => ({
          id: category.id,
          name: category.name,
          count: statsMap.get(category.id) || 0
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

    this.allBirthdays$ = combineLatest([
      this.birthdayFacade.birthdays$,
      this.categoryFacade.categories$
    ]).pipe(
      map(([birthdays, categories]) => this.getSortedFilteredBirthdays(birthdays, categories))
    );

    this.categories$ = this.categoryFacade.categories$;
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

    dialogRef.afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          const newCategory: BirthdayCategory = {
            id: this.generateCategoryId(result.name),
            name: result.name,
            icon: result.icon,
            color: result.color
          };

          this.categoryFacade.addCategory(newCategory);
        }
      });
  }

  onEditCategory(categoryId: string): void {
    if (categoryId === '__orphaned__') {
      combineLatest([
        this.birthdayFacade.birthdays$,
        this.categoryFacade.categories$
      ])
        .pipe(take(1))
        .subscribe(([birthdays, allCategories]) => {
          const validCategoryIds = new Set(allCategories.map(c => c.id));
          const uncategorizedBirthdays = birthdays.filter(b => b.category && !validCategoryIds.has(b.category));

          if (uncategorizedBirthdays.length === 0) {
            alert('There are no uncategorized birthdays to reassign.');
            return;
          }

          const dialogRef = this.dialog.open(CategoryReassignDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: {
              categoryToDelete: { id: '__orphaned__', name: 'Uncategorized', icon: 'help_outline', color: '#9e9e9e' },
              affectedBirthdaysCount: uncategorizedBirthdays.length,
              mode: 'reassign-only'
            }
          });

          dialogRef.afterClosed()
            .pipe(take(1))
            .subscribe(result => {
              if (result && result.action === 'reassign' && result.newCategoryId) {
                this.reassignBirthdaysToCategory(uncategorizedBirthdays, result.newCategoryId);
              }
            });
        });
      return;
    }

    this.categoryFacade.categories$
      .pipe(take(1))
      .subscribe(allCategories => {
        const category = allCategories.find(c => c.id === categoryId);

        if (!category) return;

        const dialogRef = this.dialog.open(CategoryDialogComponent, {
          width: '600px',
          data: {
            mode: 'edit',
            category: category
          }
        });

        dialogRef.afterClosed()
          .pipe(take(1))
          .subscribe(result => {
            if (result) {
              const updatedCategory: BirthdayCategory = {
                ...category,
                name: result.name,
                icon: result.icon,
                color: result.color
              };

              this.categoryFacade.updateCategory(updatedCategory);
            }
          });
      });
  }

  onDeleteCategory(categoryId: string): void {
    combineLatest([
      this.categoryFacade.categories$,
      this.birthdayFacade.birthdays$
    ])
      .pipe(take(1))
      .subscribe(([allCategories, birthdays]) => {
        const category = allCategories.find(c => c.id === categoryId);

        if (!category) return;

        const affectedBirthdays = birthdays.filter(b => b.category === categoryId);

        if (affectedBirthdays.length > 0) {
          const dialogRef = this.dialog.open(CategoryReassignDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: {
              categoryToDelete: category,
              affectedBirthdaysCount: affectedBirthdays.length
            }
          });

          dialogRef.afterClosed()
            .pipe(take(1))
            .subscribe(result => {
              if (result) {
                if (result.action === 'reassign' && result.newCategoryId) {
                  this.reassignBirthdaysToCategory(affectedBirthdays, result.newCategoryId);
                  this.categoryFacade.deleteCategory(categoryId);
                } else if (result.action === 'delete-orphan') {
                  this.categoryFacade.deleteCategory(categoryId);
                }
              }
            });
        } else {
          if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
            this.categoryFacade.deleteCategory(categoryId);
          }
        }
      });
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

  private reassignBirthdaysToCategory(birthdays: any[], newCategoryId: string): void {
    birthdays.forEach(birthday => {
      const updatedBirthday = {
        ...birthday,
        category: newCategoryId
      };
      this.birthdayFacade.updateBirthday(updatedBirthday);
    });
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

  getSortedFilteredBirthdays(birthdays: any[] | null, categories: BirthdayCategory[]): any[] {
    if (!birthdays) return [];

    let filtered = [...birthdays];

    if (this.selectedCategory) {
      if (this.selectedCategory === '__orphaned__') {
        const validCategoryIds = new Set(categories.map(c => c.id));
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

    // Ignore clicks on the Add Birthday header and other UI elements outside dashboard
    if (target.closest('.collapsible-header, .add-birthday-card, .category-filter')) {
      return;
    }

    // Ignore clicks on buttons and icons globally (for dialogs, etc.)
    if (target.closest('button, mat-icon')) {
      return;
    }

    const clickedBirthdayItem = target.closest('.dashboard-birthday-item') as HTMLElement;

    if (clickedBirthdayItem) {
      const isInEditMode = clickedBirthdayItem.querySelector('.edit-name-input, .dashboard-category-edit, .dashboard-photo-edit');
      if (!isInEditMode) {
        this.editService.cancelEdit();
      }
    } else {
      // Clicked outside of any birthday item - cancel edit
      this.editService.cancelEdit();
    }
  }

  private updateAllBirthdays(): void {
    this.allBirthdays$ = combineLatest([
      this.birthdayFacade.birthdays$,
      this.categoryFacade.categories$
    ]).pipe(
      map(([birthdays, categories]) => this.getSortedFilteredBirthdays(birthdays, categories))
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
