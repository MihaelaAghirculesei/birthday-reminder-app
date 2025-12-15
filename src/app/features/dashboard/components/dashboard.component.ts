import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, map, takeUntil, combineLatest } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule, Birthday, BirthdayCategory, NotificationPermissionBannerComponent } from '../../../shared';
import { CalendarIconComponent } from '../../../shared/icons/calendar-icon.component';
import { GoogleCalendarSyncComponent } from '../../calendar-sync/google-calendar-sync.component';
import { DashboardStatsComponent } from './stats/dashboard-stats.component';
import { BirthdayChartComponent } from './birthday-chart/birthday-chart.component';
import { CategoryFilterComponent, CategoryStats } from './category-filter/category-filter.component';
import { BirthdayListComponent } from './birthday-list/birthday-list.component';
import { MessageScheduleDialogComponent } from '../../scheduled-messages/message-schedule-dialog/message-schedule-dialog.component';
import { BirthdayFacadeService, CategoryFacadeService } from '../../../core';
import { BirthdayEditService, BirthdayStatsService, ChartDataItem, CategoryManagerService } from '../services';
import { getDaysUntilBirthday } from '../../../shared/utils/date.utils';

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
    GoogleCalendarSyncComponent,
    NotificationPermissionBannerComponent
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
  allBirthdays$: Observable<Birthday[]>;
  categories$: Observable<BirthdayCategory[]>;

  selectedCategory: string | null = null;
  currentMonth = new Date().getMonth();
  dashboardSearchTerm = '';
  lastAction: { type: string; data: Birthday | BirthdayCategory } | null = null;

  constructor(
    public birthdayFacade: BirthdayFacadeService,
    private categoryFacade: CategoryFacadeService,
    public editService: BirthdayEditService,
    private statsService: BirthdayStatsService,
    private dialog: MatDialog,
    private categoryManager: CategoryManagerService
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

        const orphanedCount = birthdays.filter(b =>
          b.category && !validCategoryIds.has(b.category)
        ).length;

        const categoryStats = allCategories.map(category => ({
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          count: statsMap.get(category.id) || 0
        }));

        if (orphanedCount > 0) {
          categoryStats.unshift({
            id: '__orphaned__',
            name: 'Work',
            icon: 'business_center',
            color: '#FF9800',
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
    this.categoryManager.addCategory();
  }

  onEditCategory(categoryId: string): void {
    this.categoryManager.editCategory(categoryId);
  }

  onDeleteCategory(categoryId: string): void {
    this.categoryManager.deleteCategory(categoryId);
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

  getSortedFilteredBirthdays(birthdays: Birthday[] | null, categories: BirthdayCategory[]): Birthday[] {
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
      const daysA = getDaysUntilBirthday(a.birthDate);
      const daysB = getDaysUntilBirthday(b.birthDate);
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
      this.birthdayFacade.addBirthday(this.lastAction.data as Birthday);
      this.lastAction = null;
    }
  }

  onBirthdayDeleted(birthday: Birthday): void {
    this.lastAction = { type: 'delete', data: { ...birthday } };
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.editService.currentEditingId) return;

    const target = event.target as HTMLElement;

    if (target.closest('.collapsible-header, .add-birthday-card, .category-filter')) {
      return;
    }

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
