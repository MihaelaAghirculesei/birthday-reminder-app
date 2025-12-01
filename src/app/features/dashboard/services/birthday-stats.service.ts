import { Injectable } from '@angular/core';
import { Birthday } from '../../../shared';

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

  calculateStats(birthdays: Birthday[]): DashboardStats {
    const total = birthdays.length;
    const currentMonth = new Date().getMonth();
    const thisMonth = birthdays.filter(b => new Date(b.birthDate).getMonth() === currentMonth).length;

    const totalAge = birthdays.reduce((sum, b) => {
      const age = new Date().getFullYear() - new Date(b.birthDate).getFullYear();
      return sum + age;
    }, 0);
    const averageAge = birthdays.length > 0 ? Math.round(totalAge / birthdays.length) : 0;

    const nextBirthday = this.getNextBirthday(birthdays);
    const nextBirthdayDays = nextBirthday ? this.calculateDaysUntil(nextBirthday.birthDate) : 0;
    const nextBirthdayText = nextBirthday ? nextBirthday.name : 'No upcoming birthdays';

    return {
      total,
      thisMonth,
      averageAge,
      nextBirthdayDays,
      nextBirthdayText
    };
  }

  private getNextBirthday(birthdays: Birthday[]): Birthday | null {
    if (birthdays.length === 0) return null;

    const sorted = [...birthdays].sort((a, b) => {
      const daysA = this.calculateDaysUntil(a.birthDate);
      const daysB = this.calculateDaysUntil(b.birthDate);
      return daysA - daysB;
    });

    return sorted[0];
  }

  private calculateDaysUntil(birthDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const birth = new Date(birthDate);
    const nextBirthday = new Date(birth);
    nextBirthday.setFullYear(today.getFullYear());
    nextBirthday.setHours(0, 0, 0, 0);

    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
