import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { MaterialModule } from '../shared/material.module';
import { CalendarIconComponent } from '../shared/icons/calendar-icon.component';
import { BirthdayService } from '../services/birthday.service';
import { Birthday } from '../models/birthday.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    CalendarIconComponent
  ],
  template: `
    <div class="dashboard-container">
      <h2 class="dashboard-title">
        <calendar-icon size="48" strokeWidth="2" cssClass="hero-icon"></calendar-icon>
        Dashboard & Statistics
      </h2>

      <!-- Statistics Cards Row -->
      <div class="stats-row">
        <!-- Total Birthdays -->
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon total">cake</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ totalBirthdays$ | async }}</div>
                <div class="stat-label">Total Birthdays</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- This Month -->
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <calendar-icon size="40" strokeWidth="2" cssClass="stat-icon month"></calendar-icon>
              <div class="stat-info">
                <div class="stat-number">{{ birthdaysThisMonth$ | async }}</div>
                <div class="stat-label">This Month</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Average Age -->
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon age">person</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ averageAge$ | async }}</div>
                <div class="stat-label">Average Age</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Next Birthday -->
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon next">schedule</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ nextBirthdayDays$ | async }}</div>
                <div class="stat-label">Days to Next</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Content Row -->
      <div class="content-row">
        <!-- Next 5 Birthdays -->
        <mat-card class="next-birthdays-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>upcoming</mat-icon>
              Next 5 Birthdays
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="(next5Birthdays$ | async)?.length === 0; else birthdaysList" class="no-data">
              <mat-icon>cake</mat-icon>
              <p>No upcoming birthdays</p>
            </div>
            
            <ng-template #birthdaysList>
              <mat-list>
                <mat-list-item *ngFor="let birthday of next5Birthdays$ | async; let last = last">
                  <mat-icon matListItemIcon color="primary">person</mat-icon>
                  <div matListItemTitle>{{ birthday.name }}</div>
                  <div matListItemLine class="birthday-info">
                    <span>{{ birthday.birthDate | date:'MMM dd' }}</span>
                    <mat-chip [class]="getDaysChipClass(birthday.daysUntil)">
                      {{ getDaysText(birthday.daysUntil) }}
                    </mat-chip>
                  </div>
                  <mat-divider *ngIf="!last"></mat-divider>
                </mat-list-item>
              </mat-list>
            </ng-template>
          </mat-card-content>
        </mat-card>

        <!-- Birthday Chart -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>bar_chart</mat-icon>
              Birthdays by Month
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-container">
              <div *ngFor="let monthData of chartData$ | async" class="chart-bar">
                <div class="bar-container">
                  <div class="bar" 
                       [style.height.%]="getBarHeight(monthData.count, maxCount$ | async)"
                       [class.current-month]="monthData.monthIndex === currentMonth">
                  </div>
                  <div class="bar-value" *ngIf="monthData.count > 0">{{ monthData.count }}</div>
                </div>
                <div class="bar-label">{{ monthData.month }}</div>
              </div>
            </div>
            <div class="chart-legend" *ngIf="(totalBirthdays$ | async) === 0">
              <p class="no-data-text">Add some birthdays to see the chart!</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 0;
      max-width: 100%;
      margin: 0 auto;
      animation: fadeInUp 0.8s ease-out;
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 40px;
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--text-inverse) 0%, rgba(255,255,255,0.8) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: rgba(255,255,255,0.9);
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
      }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }

    .stat-card {
      background: var(--surface) !important;
      border-radius: var(--radius-lg) !important;
      box-shadow: var(--shadow) !important;
      border: 1px solid var(--border-light) !important;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--primary);
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }
      
      &:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: var(--shadow-elevated) !important;
        
        &::before {
          transform: scaleX(1);
        }
      }
      
      .mat-mdc-card-content {
        padding: 32px !important;
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .stat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 80px;
        min-height: 80px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &.total { 
          background: linear-gradient(135deg, var(--primary));
          color: var(--text-inverse);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }
        &.month { 
          background: linear-gradient(135deg, var(--secondary));
          color: var(--text-inverse);
          box-shadow: 0 8px 16px rgba(240, 147, 251, 0.3);
        }
        &.age { 
          background: linear-gradient(135deg, var(--success));
          color: var(--text-inverse);
          box-shadow: 0 8px 16px rgba(17, 153, 142, 0.3);
        }
        &.next { 
          background: linear-gradient(135deg, var(--accent));
          color: var(--text-inverse);
          box-shadow: 0 8px 16px rgba(79, 172, 254, 0.3);
        }
      }
      
      &:hover .stat-icon {
        transform: scale(1.1) rotate(5deg);
      }

      .stat-info {
        flex: 1;
        
        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          background: var(--primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
          line-height: 1;
        }

        .stat-label {
          font-size: 1rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
    }

    .content-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 24px;
    }

    .next-birthdays-card, .chart-card {
      background: var(--surface) !important;
      border-radius: var(--radius-lg) !important;
      box-shadow: var(--shadow) !important;
      border: 1px solid var(--border-light) !important;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateY(-6px);
        box-shadow: var(--shadow-elevated) !important;
      }
      
      .mat-mdc-card-header {
        background: linear-gradient(135deg, var(--accent) 0%, var(--success) 100%);
        color: var(--text-primary);
        padding: 24px;
        
        .mat-mdc-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
          text-shadow: none;
        }
      }
      
      .mat-mdc-card-content {
        padding: 24px !important;
      }
    }

    .birthday-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 0;

      span {
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 1rem;
      }

      mat-chip {
        border-radius: var(--radius-sm) !important;
        font-weight: 600 !important;
        padding: 8px 16px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        &.today { 
          background: var(--warning) !important;
          color: var(--text-inverse) !important;
          animation: pulse 2s infinite;
          box-shadow: 0 4px 12px rgba(252, 70, 107, 0.3);
        }
        &.tomorrow { 
          background: var(--secondary) !important;
          color: var(--text-inverse) !important;
          box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
        }
        &.soon { 
          background: var(--success) !important;
          color: var(--text-inverse) !important;
          box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3);
        }
        &.later { 
          background: var(--surface-hover) !important;
          color: var(--text-secondary) !important;
          border: 2px solid var(--border) !important;
        }
        
        &:hover {
          transform: translateY(-2px) scale(1.05);
        }
      }
    }

    .chart-container {
      display: flex;
      align-items: end;
      justify-content: space-between;
      height: 240px;
      padding: 24px 0;
      border-bottom: 3px solid var(--primary);
      background: linear-gradient(180deg, transparent 0%, var(--surface-elevated) 100%);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    }

    .chart-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      margin: 0 2px;
    }

    .bar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 160px;
      justify-content: end;
      position: relative;
    }

    .bar {
      width: 24px;
      background: var(--primary);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      min-height: 6px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
      }

      &.current-month {
        background: var(--secondary);
        box-shadow: var(--shadow);
        transform: scale(1.1);
        
        &::after {
          content: '•';
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          color: var(--warning);
          font-size: 20px;
          animation: pulse 2s infinite;
        }
      }
      
      &:hover {
        transform: scale(1.15);
        box-shadow: var(--shadow-elevated);
      }
    }

    .bar-value {
      position: absolute;
      top: -20px;
      font-size: 12px;
      font-weight: 600;
      color: #333;
    }

    .bar-label {
      margin-top: 12px;
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 600;
      text-align: center;
    }

    .no-data {
      text-align: center;
      padding: 48px;
      color: var(--text-secondary);
      background: var(--surface-elevated);
      border-radius: var(--radius);
      border: 2px dashed var(--border);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 24px;
        background: var(--primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      p {
        font-size: 1.2rem;
        font-weight: 600;
        margin-top: 16px;
      }
    }

    .no-data-text {
      text-align: center;
      color: #666;
      font-style: italic;
      margin-top: 16px;
    }

    // Responsive Design
    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
    }
    
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 0;
      }
      
      .dashboard-title {
        font-size: 2rem;
        margin-bottom: 32px;
        
        mat-icon {
          font-size: 2.5rem;
          width: 2.5rem;
          height: 2.5rem;
        }
      }

      .stats-row {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 32px;
      }
      
      .stat-card {
        .mat-mdc-card-content {
          padding: 24px !important;
        }
        
        .stat-icon {
          min-width: 64px;
          min-height: 64px;
          font-size: 40px;
        }
        
        .stat-info .stat-number {
          font-size: 2rem;
        }
      }

      .content-row {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .chart-container {
        height: 180px;
        padding: 16px 0;
      }

      .bar-container {
        height: 140px;
      }

      .bar {
        width: 20px;
      }
    }
    
    @media (max-width: 480px) {
      .dashboard-title {
        font-size: 1.75rem;
        
        mat-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
        }
      }
      
      .stat-card .stat-content {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  totalBirthdays$: Observable<number>;
  birthdaysThisMonth$: Observable<number>;
  averageAge$: Observable<number>;
  next5Birthdays$: Observable<any[]>;
  nextBirthdayDays$: Observable<number>;
  chartData$: Observable<any[]>;
  maxCount$: Observable<number>;
  currentMonth = new Date().getMonth();

  constructor(private birthdayService: BirthdayService) {
    this.totalBirthdays$ = this.birthdayService.birthdays$.pipe(
      map(birthdays => birthdays.length)
    );

    this.birthdaysThisMonth$ = this.birthdayService.birthdays$.pipe(
      map(() => this.birthdayService.getBirthdaysThisMonth().length)
    );

    this.averageAge$ = this.birthdayService.birthdays$.pipe(
      map(() => this.birthdayService.getAverageAge())
    );

    this.next5Birthdays$ = this.birthdayService.birthdays$.pipe(
      map(() => this.birthdayService.getNext5Birthdays())
    );

    this.nextBirthdayDays$ = this.next5Birthdays$.pipe(
      map(birthdays => birthdays.length > 0 ? birthdays[0].daysUntil : 0)
    );

    this.chartData$ = this.birthdayService.birthdays$.pipe(
      map(() => this.birthdayService.getBirthdaysByMonth())
    );

    this.maxCount$ = this.chartData$.pipe(
      map(data => Math.max(...data.map(d => d.count), 1))
    );
  }

  ngOnInit() {}

  getDaysText(days: number): string {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }

  getDaysChipClass(days: number): string {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days <= 7) return 'soon';
    return 'later';
  }

  getBarHeight(count: number, maxCount: number | null): number {
    const max = maxCount || 1;
    if (max === 0) return 0;
    return (count / max) * 90; // 90% max height
  }
}