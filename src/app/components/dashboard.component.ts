import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { MaterialModule } from '../shared/material.module';
import { CalendarIconComponent } from '../shared/icons/calendar-icon.component';
import { ZodiacIconComponent } from '../shared/components/zodiac-icon.component';
import { CategoryIconComponent } from '../shared/components/category-icon.component';
import { GoogleCalendarSyncComponent } from './google-calendar-sync.component';
import { BirthdayService } from '../services/birthday.service';
import { Birthday } from '../models/birthday.model';
import { DEFAULT_CATEGORY, BIRTHDAY_CATEGORIES } from '../shared/constants/categories';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    CalendarIconComponent,
    ZodiacIconComponent,
    CategoryIconComponent,
    GoogleCalendarSyncComponent
  ],
  template: `
    <div class="dashboard-container">
      <h2 class="dashboard-title">
        <calendar-icon size="48" strokeWidth="2" cssClass="hero-icon"></calendar-icon>
        Dashboard & Statistics
      </h2>

      <div class="stats-row">
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

      <div class="content-row">
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
              <div class="dashboard-birthday-list">
                <div *ngFor="let birthday of next5Birthdays$ | async; let last = last" class="dashboard-birthday-item">
                  <div class="dashboard-avatar">
                    <img *ngIf="birthday.photo" 
                         [src]="birthday.photo" 
                         [alt]="birthday.name"
                         class="dashboard-photo">
                    <mat-icon *ngIf="!birthday.photo" color="primary" class="dashboard-default-icon">face</mat-icon>
                  </div>
                  
                  <div class="dashboard-birthday-content">
                    <div class="dashboard-name">{{ birthday.name }}</div>
                    <div class="dashboard-birthday-info">
                      <div class="dashboard-date-section">
                        <span class="dashboard-date">{{ birthday.birthDate | date:'MMM dd' }}</span>
                        <div class="dashboard-icons">
                          <category-icon [categoryId]="birthday.category || defaultCategory" class="dashboard-category-inline"></category-icon>
                          <zodiac-icon [zodiacSign]="birthday.zodiacSign" *ngIf="birthday.zodiacSign" class="dashboard-zodiac-inline"></zodiac-icon>
                        </div>
                      </div>
                      <mat-chip [class]="getDaysChipClass(birthday.daysUntil)">
                        {{ getDaysText(birthday.daysUntil) }}
                      </mat-chip>
                    </div>
                  </div>
                  
                  <mat-divider *ngIf="!last" class="dashboard-divider"></mat-divider>
                </div>
              </div>
            </ng-template>
          </mat-card-content>
        </mat-card>

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

      <div class="categories-section" *ngIf="(categoriesStats$ | async)?.length! > 0">
        <h3 class="section-title">
          <mat-icon>category</mat-icon>
          Categories Overview
        </h3>
        <div class="categories-grid">
          <div *ngFor="let categoryStats of categoriesStats$ | async" class="category-stat-card">
            <div class="category-stat-content">
              <category-icon [categoryId]="categoryStats.id" cssClass="category-stat-icon"></category-icon>
              <div class="category-stat-info">
                <div class="category-stat-name">{{ categoryStats.name }}</div>
                <div class="category-stat-count">{{ categoryStats.count }} persone</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sync-row">
        <app-google-calendar-sync></app-google-calendar-sync>
      </div>

      <div class="test-data-section" *ngIf="(totalBirthdays$ | async) === 0">
        <mat-card class="test-data-card">
          <mat-card-content>
            <div class="test-data-content">
              <mat-icon class="test-icon">science</mat-icon>
              <div class="test-info">
                <h3>Want to try the app?</h3>
                <p>Add 10 sample birthdays with photos to test all features</p>
              </div>
              <button mat-raised-button color="primary" (click)="addTestData()" [disabled]="isAddingTestData" class="add-test-btn">
                <mat-icon *ngIf="!isAddingTestData">add_circle</mat-icon>
                <mat-progress-spinner *ngIf="isAddingTestData" diameter="20" mode="indeterminate"></mat-progress-spinner>
                {{ isAddingTestData ? 'Adding...' : 'Add Test Data' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="dev-controls" *ngIf="(totalBirthdays$ | async)! > 0" style="margin-top: 16px; text-align: center;">
        <button mat-stroked-button color="warn" (click)="clearAllData()" [disabled]="isClearingData">
          <mat-icon *ngIf="!isClearingData">delete_sweep</mat-icon>
          <mat-progress-spinner *ngIf="isClearingData" diameter="16" mode="indeterminate"></mat-progress-spinner>
          {{ isClearingData ? 'Clearing...' : 'Clear All Data (Test)' }}
        </button>
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
      grid-template-columns: 1fr 400px;
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
        min-height: 350px !important;
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
      height: 180px;
      padding: 16px 0;
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
      height: 120px;
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
      color: var(--text-secondary);
      font-style: italic;
      margin-top: 16px;
    }
    
    .dashboard-avatar {
      width: 200px !important;
      height: 200px !important;
      min-width: 200px !important;
      min-height: 200px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      overflow: hidden;
      background: var(--surface-elevated);
      border: 3px solid var(--primary);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      
      .dashboard-photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
      
      .dashboard-default-icon {
        font-size: 100px !important;
        width: 100px !important;
        height: 100px !important;
        background: var(--primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      &:hover {
        transform: scale(1.05);
        border-color: var(--primary);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
      }
    }
    
    .dashboard-birthday-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .dashboard-birthday-item {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 16px 0;
      position: relative;
    }
    
    .dashboard-birthday-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .dashboard-zodiac-inline {
      flex-shrink: 0;
    }
    
    .dashboard-category-inline {
      flex-shrink: 0;
      font-size: 18px !important;
    }
    
    .dashboard-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .dashboard-birthday-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 0;
      
      .dashboard-date-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .dashboard-date {
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 1rem;
      }
      
      .dashboard-icons {
        display: flex;
        align-items: center;
        gap: 8px;
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
      }
    }
    
    .dashboard-divider {
      position: absolute;
      bottom: 0;
      left: 240px;
      right: 0;
      border-color: var(--border-light) !important;
    }

    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
    }
    
    .categories-section {
      margin-top: 32px;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 24px;
      
      mat-icon {
        color: var(--primary);
        font-size: 1.8rem;
        width: 1.8rem;
        height: 1.8rem;
      }
    }
    
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .category-stat-card {
      background: var(--surface) !important;
      border-radius: var(--radius) !important;
      box-shadow: var(--shadow) !important;
      border: 1px solid var(--border-light) !important;
      padding: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-elevated) !important;
      }
    }
    
    .category-stat-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .category-stat-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
    }
    
    .category-stat-info {
      flex: 1;
    }
    
    .category-stat-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .category-stat-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .sync-row {
      margin-top: 32px;
      display: flex;
      justify-content: center;

      app-google-calendar-sync {
        width: 100%;
        max-width: 800px;
      }
    }

    .test-data-section {
      margin-top: 32px;
      display: flex;
      justify-content: center;
    }

    .test-data-card {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%) !important;
      border-radius: var(--radius-lg) !important;
      box-shadow: var(--shadow-elevated) !important;
      border: none !important;
      max-width: 600px;
      width: 100%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateY(-4px) scale(1.02);
      }
      
      .mat-mdc-card-content {
        padding: 32px !important;
      }
    }

    .test-data-content {
      display: flex;
      align-items: center;
      gap: 24px;
      color: var(--text-inverse);
      
      .test-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        padding: 16px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 80px;
        min-height: 80px;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255,255,255,0.3);
      }
      
      .test-info {
        flex: 1;
        
        h3 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-inverse);
        }
        
        p {
          margin: 0;
          font-size: 1rem;
          color: rgba(255,255,255,0.9);
          line-height: 1.4;
        }
      }
      
      .add-test-btn {
        background: var(--text-inverse) !important;
        color: var(--primary) !important;
        font-weight: 700 !important;
        padding: 12px 24px !important;
        border-radius: var(--radius) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 180px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        
        &:hover:not([disabled]) {
          background: rgba(255,255,255,0.9) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        
        &[disabled] {
          background: rgba(255,255,255,0.7) !important;
          color: rgba(102, 126, 234, 0.7) !important;
          cursor: not-allowed;
        }
        
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 0 8px;
      }
      
      .dashboard-title {
        font-size: 1.8rem;
        margin-bottom: 24px;
        
        mat-icon {
          font-size: 2.2rem;
          width: 2.2rem;
          height: 2.2rem;
        }
      }

      .stats-row {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 24px;
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
        gap: 16px;
        margin-top: 16px;
      }

      .next-birthdays-card, .chart-card {
        .mat-mdc-card-content {
          padding: 16px !important;
          min-height: 280px !important;
        }
        
        .mat-mdc-card-header {
          padding: 16px;
          
          .mat-mdc-card-title {
            font-size: 1.2rem;
          }
        }
      }

      .chart-container {
        height: 140px;
        padding: 8px 0;
      }

      .bar-container {
        height: 100px;
      }

      .sync-row {
        margin-top: 24px;
        
        app-google-calendar-sync {
          max-width: none;
          margin: 0;
        }
      }

      .test-data-section {
        margin-top: 24px;
        padding: 0 8px;
      }

      .test-data-card {
        .mat-mdc-card-content {
          padding: 24px !important;
        }
      }

      .test-data-content {
        flex-direction: column;
        text-align: center;
        gap: 16px;
        
        .test-icon {
          min-width: 64px;
          min-height: 64px;
          font-size: 40px;
          width: 40px;
          height: 40px;
          padding: 12px;
        }
        
        .test-info {
          h3 {
            font-size: 1.3rem;
          }
          
          p {
            font-size: 0.9rem;
          }
        }
        
        .add-test-btn {
          min-width: 160px;
          height: 44px;
        }
      }

      .bar {
        width: 20px;
      }

      .dashboard-birthday-list {
        gap: 16px;
      }

      .dashboard-birthday-item {
        padding: 12px 0;
        gap: 16px;
      }

      .dashboard-avatar {
        width: 80px !important;
        height: 80px !important;
        min-width: 80px !important;
        min-height: 80px !important;
        border: 2px solid var(--primary);
        
        .dashboard-default-icon {
          font-size: 40px !important;
          width: 40px !important;
          height: 40px !important;
        }
      }

      .dashboard-birthday-content {
        gap: 4px;
      }

      .dashboard-name {
        font-size: 1rem;
      }

      .dashboard-birthday-info {
        padding: 4px 0;
        
        .dashboard-date {
          font-size: 0.9rem;
        }
        
        mat-chip {
          font-size: 0.8rem !important;
          padding: 6px 4px !important;
          min-width: 65px !important;
          width: 65px !important;
          text-align: center !important;
          display: inline-flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
      }

      .dashboard-zodiac-inline {
        margin: 0 4px;
      }

      .dashboard-divider {
        left: 96px;
      }
    }
    
    @media (min-width: 769px) and (max-width: 1023px) {
      .content-row {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .next-birthdays-card, .chart-card {
        .mat-mdc-card-content {
          padding: 20px !important;
          min-height: 320px !important;
        }
      }

      .sync-row app-google-calendar-sync {
        max-width: 600px;
      }
    }

    @media (max-width: 480px) {
      .dashboard-container {
        padding: 0 4px;
      }

      .dashboard-title {
        font-size: 1.5rem;
        margin-bottom: 16px;
        gap: 8px;
        
        mat-icon {
          font-size: 1.8rem;
          width: 1.8rem;
          height: 1.8rem;
        }
      }
      
      .stat-card {
        .mat-mdc-card-content {
          padding: 16px !important;
        }
        
        .stat-content {
          flex-direction: column;
          text-align: center;
          gap: 12px;
        }

        .stat-icon {
          min-width: 60px;
          min-height: 60px;
          font-size: 36px;
        }

        .stat-info .stat-number {
          font-size: 2rem;
        }
      }

      .dashboard-avatar {
        width: 60px !important;
        height: 60px !important;
        min-width: 60px !important;
        min-height: 60px !important;
        
        .dashboard-default-icon {
          font-size: 30px !important;
          width: 30px !important;
          height: 30px !important;
        }
      }

      .dashboard-name {
        font-size: 0.95rem;
      }

      .dashboard-birthday-info {
        mat-chip {
          min-width: 75px !important;
          width: 75px !important;
          text-align: center !important;
          display: inline-flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
      }

      .dashboard-divider {
        left: 76px;
      }

      .chart-container {
        height: 120px;
      }

      .bar-container {
        height: 90px;
      }

      .bar {
        width: 16px;
      }

      .bar-label {
        font-size: 0.75rem;
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
  categoriesStats$: Observable<any[]>;
  currentMonth = new Date().getMonth();
  defaultCategory = DEFAULT_CATEGORY;
  isAddingTestData = false;
  isClearingData = false;

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
      map(data => data.length > 0 ? Math.max(...data.map(d => d.count)) || 1 : 1)
    );

    this.categoriesStats$ = this.birthdayService.birthdays$.pipe(
      map(birthdays => {
        const stats = BIRTHDAY_CATEGORIES.map(category => ({
          ...category,
          count: birthdays.filter(b => (b.category || DEFAULT_CATEGORY) === category.id).length
        })).filter(stat => stat.count > 0);
        return stats;
      })
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
    return (count / max) * 90; 
  }

  async addTestData(): Promise<void> {
    this.isAddingTestData = true;
    try {
      await this.birthdayService.addTestBirthdays();
    } catch (error) {
      console.error('Errore durante l\'aggiunta dei dati test:', error);
    } finally {
      this.isAddingTestData = false;
    }
  }

  async clearAllData(): Promise<void> {
    this.isClearingData = true;
    try {
      await this.birthdayService.clearAllBirthdays();
    } catch (error) {
      console.error('Errore durante l\'eliminazione dei dati:', error);
    } finally {
      this.isClearingData = false;
    }
  }
}