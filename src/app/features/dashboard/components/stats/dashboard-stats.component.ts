import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared';
import { CalendarIconComponent } from '../../../../shared/icons/calendar-icon.component';

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule, MaterialModule, CalendarIconComponent],
  templateUrl: './dashboard-stats.component.html',
  styleUrls: ['./dashboard-stats.component.scss']
})
export class DashboardStatsComponent {
  @Input() totalBirthdays: number = 0;
  @Input() birthdaysThisMonth: number = 0;
  @Input() averageAge: number = 0;
  @Input() nextBirthdayDays: number = 0;
  @Input() nextBirthdayText: string = '';
}
