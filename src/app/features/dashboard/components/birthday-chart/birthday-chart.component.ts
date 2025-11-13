import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared';
import { ChartDataItem } from '../../services';

@Component({
  selector: 'app-birthday-chart',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './birthday-chart.component.html',
  styleUrls: ['./birthday-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BirthdayChartComponent {
  @Input() chartData: ChartDataItem[] = [];
  @Input() maxCount: number = 0;
  @Input() currentMonth: number = new Date().getMonth();
  @Input() totalBirthdays: number = 0;

  getBarHeight(count: number, maxCount: number): number {
    if (!maxCount || maxCount === 0) return 0;
    return (count / maxCount) * 100;
  }

  getMonthIndex(month: string): number {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(month);
  }
}
