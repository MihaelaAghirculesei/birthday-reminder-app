import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { BirthdayService } from '../services/birthday.service';
import { Birthday } from '../models/birthday.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="dashboard-container">
      <h2 class="dashboard-title">
        <mat-icon>dashboard</mat-icon>
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
              <mat-icon class="stat-icon month">event_note</mat-icon>
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
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      font-size: 28px;
      font-weight: 500;
      color: #333;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .stat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        padding: 8px;

        &.total { background-color: #e3f2fd; color: #1976d2; }
        &.month { background-color: #f3e5f5; color: #7b1fa2; }
        &.age { background-color: #e8f5e8; color: #388e3c; }
        &.next { background-color: #fff3e0; color: #f57c00; }
      }

      .stat-info {
        .stat-number {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }
      }
    }

    .content-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .next-birthdays-card, .chart-card {
      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }

    .birthday-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;

      span {
        font-weight: 500;
      }

      mat-chip {
        &.today { background-color: #ffebee; color: #d32f2f; }
        &.tomorrow { background-color: #fff3e0; color: #f57c00; }
        &.soon { background-color: #e8f5e8; color: #388e3c; }
        &.later { background-color: #f5f5f5; color: #666; }
      }
    }

    .chart-container {
      display: flex;
      align-items: end;
      justify-content: space-between;
      height: 200px;
      padding: 16px 0;
      border-bottom: 2px solid #e0e0e0;
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
      width: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: all 0.3s ease;

      &.current-month {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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
      margin-top: 8px;
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .no-data {
      text-align: center;
      padding: 32px;
      color: #666;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
    }

    .no-data-text {
      text-align: center;
      color: #666;
      font-style: italic;
      margin-top: 16px;
    }

    // Responsive
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .content-row {
        grid-template-columns: 1fr;
      }

      .chart-container {
        height: 150px;
      }

      .bar-container {
        height: 120px;
      }

      .bar {
        width: 16px;
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