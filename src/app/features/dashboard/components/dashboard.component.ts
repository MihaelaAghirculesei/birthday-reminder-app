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
        console.log('New category created:', newCategory);
      }
    });
  }

  private generateCategoryId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  }

  private saveCustomCategory(category: any): void {
    const customCategories = this.getCustomCategories();
    customCategories.push(category);
    localStorage.setItem('customCategories', JSON.stringify(customCategories));

    this.categoriesStats$ = this.birthdayFacade.birthdays$.pipe(
      map((birthdays) => {
        const stats = this.statsService.getCategoriesStats(birthdays);
        const allCategories = getAllCategories();

        const statsMap = new Map(stats.map(s => [s.categoryId, s.count]));

        return allCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          count: statsMap.get(cat.id) || 0
        }));
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
      filtered = filtered.filter(b => b.category === this.selectedCategory);
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

  async addTestData(): Promise<void> {
    console.warn('Test data loading not yet implemented with NgRx');
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
