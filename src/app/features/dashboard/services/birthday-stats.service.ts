import { Injectable } from '@angular/core';
import { Birthday, BirthdayCategory } from '../../../shared';
import { BirthdayFacadeService } from '../../../core';

export interface DashboardStats {
  total: number;
  thisMonth: number;
  averageAge: number;
  nextBirthdayDays: number;
  nextBirthdayText: string;
}

export interface ChartDataItem {
  month: string;
  count: number;
  label: string;
}

export interface CategoryStats {
  categoryId: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class BirthdayStatsService {
  private readonly MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  private readonly FULL_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  calculateStats(birthdays: Birthday[], birthdayService: BirthdayFacadeService): DashboardStats {
    const total = birthdays.length;
    const thisMonth = birthdayService.getBirthdaysThisMonth().length;
    const averageAge = birthdayService.getAverageAge();
    const nextBirthdayDays = birthdayService.getNextBirthdayDays();
    const nextBirthdayText = birthdayService.getNextBirthdayText();

    return {
      total,
      thisMonth,
      averageAge,
      nextBirthdayDays,
      nextBirthdayText
    };
  }

  getChartData(birthdays: Birthday[]): ChartDataItem[] {
    const monthCounts = new Array(12).fill(0);

    birthdays.forEach(birthday => {
      const month = new Date(birthday.birthDate).getMonth();
      monthCounts[month]++;
    });

    return monthCounts.map((count, index) => ({
      month: this.MONTHS[index],
      count,
      label: this.FULL_MONTHS[index]
    }));
  }

  getMaxCount(chartData: ChartDataItem[]): number {
    return Math.max(...chartData.map(d => d.count), 0);
  }

  getCategoriesStats(birthdays: Birthday[]): CategoryStats[] {
    const categoryCounts = new Map<string, number>();

    birthdays.forEach(birthday => {
      const categoryId = birthday.category || 'default';
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
    });

    return Array.from(categoryCounts.entries()).map(([categoryId, count]) => ({
      categoryId,
      count
    }));
  }

  getBarHeight(count: number, maxCount: number | null): number {
    if (!maxCount || maxCount === 0) return 0;
    return (count / maxCount) * 100;
  }
}
