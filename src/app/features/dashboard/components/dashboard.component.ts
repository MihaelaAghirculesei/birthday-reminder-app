import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { MaterialModule, DEFAULT_CATEGORY, BIRTHDAY_CATEGORIES } from '../../../shared';
import { CalendarIconComponent } from '../../../shared/icons/calendar-icon.component';
import { GoogleCalendarSyncComponent } from '../../calendar-sync/google-calendar-sync.component';
import { DashboardStatsComponent } from './stats/dashboard-stats.component';
import { BirthdayChartComponent } from './birthday-chart/birthday-chart.component';
import { CategoryFilterComponent, CategoryStats } from './category-filter/category-filter.component';
import { BirthdayListComponent } from './birthday-list/birthday-list.component';
import { BirthdayService } from '../../../core';
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
    public birthdayService: BirthdayService,
    public editService: BirthdayEditService,
    private statsService: BirthdayStatsService
  ) {
    this.totalBirthdays$ = this.birthdayService.birthdays$.pipe(
      map((birthdays) => birthdays.length)
    );

    this.birthdaysThisMonth$ = this.birthdayService.birthdays$.pipe(
      map(() => this.birthdayService.getBirthdaysNext30Days().length)
    );

    this.averageAge$ = this.birthdayService.birthdays$.pipe(
      map(() => this.birthdayService.getAverageAge())
    );

    this.nextBirthdayDays$ = this.birthdayService.birthdays$.pipe(
      map(() => {
        const nextBirthdays = this.birthdayService.getNext5Birthdays();
        if (nextBirthdays.length > 0) {
          return this.birthdayService.getDaysUntilBirthday(nextBirthdays[0].birthDate);
        }
        return 0;
      })
    );

    this.nextBirthdayText$ = this.birthdayService.birthdays$.pipe(
      map(() => {
        const nextBirthdays = this.birthdayService.getNext5Birthdays();
        return nextBirthdays.length > 0
          ? this.birthdayService.getNextBirthdayText(nextBirthdays[0].birthDate)
          : 'N/A';
      })
    );

    this.chartData$ = this.birthdayService.birthdays$.pipe(
      map((birthdays) => this.statsService.getChartData(birthdays))
    );

    this.maxCount$ = this.chartData$.pipe(
      map((chartData) => this.statsService.getMaxCount(chartData))
    );

    this.categoriesStats$ = this.birthdayService.birthdays$.pipe(
      map((birthdays) => {
        const stats = this.statsService.getCategoriesStats(birthdays);
        return stats.map(stat => ({
          id: stat.categoryId,
          name: BIRTHDAY_CATEGORIES.find(c => c.id === stat.categoryId)?.name || 'Unknown',
          count: stat.count
        }));
      })
    );

    this.allBirthdays$ = this.birthdayService.birthdays$.pipe(
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
      filtered = filtered.filter(b => b.category === this.selectedCategory);
    }

    if (this.dashboardSearchTerm) {
      const searchLower = this.dashboardSearchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => {
      const daysA = this.birthdayService.getDaysUntilBirthday(a.birthDate);
      const daysB = this.birthdayService.getDaysUntilBirthday(b.birthDate);
      return daysA - daysB;
    });
  }

  async addTestData(): Promise<void> {
    await this.birthdayService.addTestBirthdays();
  }

  async clearAllData(): Promise<void> {
    await this.birthdayService.clearAllBirthdays();
    this.lastAction = null;
  }

  undoLastAction(): void {
    if (this.lastAction && this.lastAction.type === 'delete') {
      this.birthdayService.addBirthday(this.lastAction.data);
      this.lastAction = null;
    }
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
    this.allBirthdays$ = this.birthdayService.birthdays$.pipe(
      map((birthdays) => this.getSortedFilteredBirthdays(birthdays))
    );
  }
}
