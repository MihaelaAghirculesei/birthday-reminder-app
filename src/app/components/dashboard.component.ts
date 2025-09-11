import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
    MaterialModule,
    CalendarIconComponent,
    ZodiacIconComponent,
    CategoryIconComponent,
    GoogleCalendarSyncComponent
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-section">
        <div class="dashboard-section-header">
          <div class="dashboard-section-title-wrapper">
            <h3 class="dashboard-section-title">
              <div class="dashboard-title-icon-wrapper">
                <calendar-icon size="38" strokeWidth="2" cssClass="dashboard-hero-icon"></calendar-icon>
              </div>
              Dashboard & Statistics
            </h3>
            <p class="dashboard-section-subtitle">Overview of your birthday collection</p>
          </div>
        </div>
      </div>

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

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon upcoming">event</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ nextBirthdayText$ | async }}</div>
                <div class="stat-label">Next Birthday</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>


      <div class="categories-section" *ngIf="(categoriesStats$ | async)?.length! > 0">
        <div class="section-header">
          <div class="section-title-wrapper">
            <h3 class="section-title">
              <div class="title-icon-wrapper">
                <mat-icon>category</mat-icon>
              </div>
              Categories Overview
            </h3>
            <p class="section-subtitle">Click any category to filter your birthdays</p>
          </div>
          <button *ngIf="selectedCategory" 
                  mat-fab 
                  color="primary" 
                  class="clear-all-btn"
                  (click)="clearCategoryFilter()"
                  matTooltip="Clear all filters">
            <mat-icon>clear_all</mat-icon>
          </button>
        </div>
        
        <div class="categories-grid">
          <div *ngFor="let categoryStats of categoriesStats$ | async" 
               class="category-stat-card"
               [class.selected]="isCategorySelected(categoryStats.id)"
               (click)="selectCategory(categoryStats.id)">
            <div class="category-card-background"></div>
            <div class="category-stat-content">
              <div class="category-icon-section">
                <category-icon [categoryId]="categoryStats.id" cssClass="category-stat-icon"></category-icon>
                <div class="selection-indicator" *ngIf="isCategorySelected(categoryStats.id)">
                  <mat-icon>check_circle</mat-icon>
                </div>
              </div>
              <div class="category-stat-info">
                <div class="category-stat-name">{{ categoryStats.name }}</div>
                <div class="category-stat-count">{{ categoryStats.count }} {{ categoryStats.count === 1 ? 'person' : 'people' }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="filter-info" *ngIf="selectedCategory">
          <div class="filter-text">
            <mat-icon>filter_alt</mat-icon>
            Showing {{ (birthdayService.filteredBirthdays$ | async)?.length }} birthdays from selected category
          </div>
          <button mat-stroked-button (click)="clearCategoryFilter()" class="clear-filter-btn">
            <mat-icon>clear</mat-icon>
            Clear Filter
          </button>
        </div>
        
        <div class="filtered-dashboard-grid" *ngIf="selectedCategory && (birthdayService.filteredBirthdays$ | async)?.length! > 0">
          <div *ngFor="let birthday of getSortedFilteredBirthdays(birthdayService.filteredBirthdays$ | async)" class="filtered-birthday-card">
            <div class="filtered-card-content">
              <div class="filtered-name-section">
                <span class="filtered-name">{{ birthday.name }}</span>
                <span class="filtered-date">{{ birthday.birthDate | date:'MMM dd' }}</span>
              </div>
              <div class="filtered-icons-section">
                <category-icon [categoryId]="birthday.category || defaultCategory" class="filtered-category-icon"></category-icon>
                <zodiac-icon [zodiacSign]="birthday.zodiacSign" *ngIf="birthday.zodiacSign" class="filtered-zodiac-icon"></zodiac-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="full-width-section" *ngIf="(birthdayService.birthdays$ | async)?.length! > 0">
        <mat-card class="birthday-list-card">
          <mat-card-header class="birthday-list-header">
            <div class="header-title-section">
              <mat-card-title>📅 All Upcoming Birthdays</mat-card-title>
            </div>
            <div class="header-search-section">
              <mat-form-field appearance="fill" class="dashboard-search-field">
                <mat-label>Search by name</mat-label>
                <input matInput 
                       placeholder="Type to search..." 
                       (input)="onDashboardSearchChange($event)"
                       [value]="dashboardSearchTerm">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="dashboard-birthday-list scrollable" *ngIf="(allBirthdays$ | async)?.length! > 0">
              <div *ngFor="let birthday of allBirthdays$ | async; trackBy: trackByBirthday" 
                   class="dashboard-birthday-item"
                   tabindex="0">
                
                <div class="dashboard-avatar" *ngIf="birthday.photo">
                  <img [src]="birthday.photo" [alt]="birthday.name" class="dashboard-photo">
                </div>
                <div class="dashboard-avatar" *ngIf="!birthday.photo">
                  <mat-icon class="dashboard-default-icon">person</mat-icon>
                </div>
                
                <div class="dashboard-birthday-content">
                  <div class="dashboard-birthday-info">
                    <div class="dashboard-name" *ngIf="!isEditing(birthday.id)">{{ birthday.name }}</div>
                    <input *ngIf="isEditing(birthday.id)" 
                           type="text" 
                           [(ngModel)]="editingBirthdayData.name"
                           class="edit-name-input"
                           placeholder="Name">
                    <div class="dashboard-age">{{ getAge(birthday.birthDate) }} years old</div>
                  </div>
                  
                  <div class="dashboard-birthday-details">
                    <div class="dashboard-birth-date" *ngIf="!isEditing(birthday.id)">
                      <mat-icon class="small-icon">cake</mat-icon>
                      {{ birthday.birthDate | date:'EEEE, MMMM dd, yyyy' }}
                    </div>
                    <div class="dashboard-birth-date-edit" *ngIf="isEditing(birthday.id)">
                      <mat-icon class="small-icon">cake</mat-icon>
                      <input type="date" 
                             [(ngModel)]="editingBirthdayData.birthDate"
                             class="edit-date-input"
                             placeholder="Birth Date">
                    </div>
                    <div class="dashboard-notes" *ngIf="birthday.notes && !isEditing(birthday.id)">
                      <mat-icon class="small-icon">note</mat-icon>
                      {{ birthday.notes }}
                    </div>
                    <div class="dashboard-notes-edit" *ngIf="isEditing(birthday.id)">
                      <mat-icon class="small-icon">note</mat-icon>
                      <input type="text" 
                             [(ngModel)]="editingBirthdayData.notes"
                             class="edit-notes-input"
                             placeholder="Notes">
                    </div>
                  </div>
                  
                  <div class="dashboard-icons" *ngIf="!isEditing(birthday.id)">
                    <category-icon [categoryId]="birthday.category || defaultCategory" 
                                   cssClass="dashboard-category-inline"></category-icon>
                    <zodiac-icon [zodiacSign]="birthday.zodiacSign" 
                                 *ngIf="birthday.zodiacSign" 
                                 cssClass="dashboard-zodiac-inline"></zodiac-icon>
                  </div>
                  
                  <div class="dashboard-category-edit" *ngIf="isEditing(birthday.id)">
                    <mat-icon class="small-icon">category</mat-icon>
                    <select [(ngModel)]="editingBirthdayData.category" class="edit-category-select">
                      <option *ngFor="let category of getBirthdayCategories()" [value]="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                  </div>
                </div>
                
                <div class="dashboard-actions">
                  <div class="birthday-days-circle"
                       [class]="getDaysChipClass(birthday.daysUntil)" *ngIf="!isEditing(birthday.id)">
                    <div class="days-circle-content">
                      <div class="days-number">{{ getDaysText(birthday.daysUntil) }}</div>
                    </div>
                  </div>
                  
                  <ng-container *ngIf="!isEditing(birthday.id)">
                    <button mat-icon-button 
                            color="primary" 
                            (click)="editBirthday(birthday)"
                            class="edit-button-circle"
                            matTooltip="Edit birthday">
                      <mat-icon class="edit-icon">edit</mat-icon>
                    </button>
                    
                    <button mat-icon-button 
                            color="warn" 
                            (click)="deleteBirthday(birthday)"
                            class="delete-button-circle"
                            matTooltip="Delete birthday">
                      <img src="assets/icons/delete-button.png" alt="Delete" class="delete-icon">
                    </button>
                  </ng-container>
                  
                  <ng-container *ngIf="isEditing(birthday.id)">
                    <button mat-icon-button 
                            color="primary" 
                            (click)="saveEditingBirthday(birthday)"
                            class="save-button-circle"
                            matTooltip="Save changes">
                      <mat-icon class="save-icon">check</mat-icon>
                    </button>
                    
                    <button mat-icon-button 
                            color="warn" 
                            (click)="cancelEditingBirthday()"
                            class="cancel-button-circle"
                            matTooltip="Cancel">
                      <mat-icon class="cancel-icon">close</mat-icon>
                    </button>
                  </ng-container>
                </div>
              </div>
            </div>
            
            <div class="no-search-results" *ngIf="(allBirthdays$ | async)?.length === 0 && dashboardSearchTerm.trim()">
              <mat-icon class="large-search-icon">search_off</mat-icon>
              <p>No birthdays found for "<strong>{{ dashboardSearchTerm }}</strong>"</p>
              <button mat-button color="primary" (click)="clearDashboardSearch()">
                <mat-icon>clear</mat-icon>
                Clear search
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="sync-row">
        <app-google-calendar-sync></app-google-calendar-sync>
        
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>bar_chart</mat-icon>
              Monthly Distribution
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

    .dashboard-section {
      margin-bottom: 32px;
      position: relative;
    }
    
    .dashboard-section-header {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 32px;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -16px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--primary) 0%, transparent 100%);
        border-radius: 1px;
      }
    }
    
    .dashboard-section-title-wrapper {
      flex: 1;
      text-align: center;
    }
    
    .dashboard-section-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-inverse);
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    
    .dashboard-title-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
      
      .dashboard-hero-icon {
        color: rgb(30,41,59);
      }
    }
    
    .dashboard-section-subtitle {
      color: var(--text-inverse);
      font-size: 1rem;
      margin: 0;
      font-weight: 500;
      opacity: 0.9;
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
        &.upcoming { 
          background: linear-gradient(135deg, var(--warning));
          color: var(--text-inverse);
          box-shadow: 0 8px 16px rgba(252, 70, 107, 0.3);
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


    .full-width-section {
      margin: 32px 0;
      display: flex;
      justify-content: center;
      width: 100%;
      
      .birthday-list-card {
        width: 100%;
        max-width: none;
      }
    }

    .birthday-list-card {
      background: var(--surface) !important;
      border-radius: var(--radius-lg) !important;
      box-shadow: var(--shadow) !important;
      border: 1px solid var(--border-light) !important;
      overflow: hidden;
      animation: fadeInUp 0.6s ease-out 0.4s both;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-elevated) !important;
      }
      
      .birthday-list-header {
        background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        color: var(--text-primary);
        padding: 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }
      
      .header-title-section {
        flex: 1;
        min-width: 300px;
        
        .mat-mdc-card-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
          text-shadow: none;
        }
      }
      
      .header-search-section {
        flex-shrink: 0;
        
        .dashboard-search-field {
          width: 300px;
        }
      }
      
      .header-search-section {
        * {
          color: #000000 !important;
        }
      }
      
      ::ng-deep .header-search-section .dashboard-search-field {
        margin-bottom: 24px;
        
        .mat-mdc-text-field-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        
        .mat-mdc-form-field-flex {
          background: var(--surface-elevated) !important;
          border-radius: var(--radius) !important;
          padding-left: 26px !important;
          border: 2px solid var(--border) !important;
        }
        
        .mat-mdc-form-field-underline,
        .mdc-line-ripple {
          display: none !important;
        }
        
        .mat-mdc-input-element {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
        }
        
        input[matInput] {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
        }
        
        input {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
        }
        
        .mat-mdc-form-field-infix input {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
        }
        
        &.mat-focused .mat-mdc-form-field-flex {
          border-color: var(--primary) !important;
        }
        
        &:hover:not(.mat-focused) .mat-mdc-form-field-flex {
          border-color: var(--primary) !important;
          opacity: 0.7;
        }
      }
      
      .mat-mdc-card-content {
        padding: 32px !important;
      }
    }

    .chart-card {
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
      
      .mat-mdc-card-content {
        padding: 24px !important;
        min-height: 350px !important;
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
      
      &.scrollable {
        max-height: 600px;
        overflow-y: auto;
        padding-right: 8px;
        margin-right: -7px;
        
        &::-webkit-scrollbar {
          width: 8px;
        }
        
        &::-webkit-scrollbar-track {
          background: var(--surface-elevated);
          border-radius: 4px;
        }
        
        &::-webkit-scrollbar-thumb {
          background: var(--primary);
          border-radius: 4px;
          
          &:hover {
            background: var(--secondary);
          }
        }
      }
    }
    
    .dashboard-birthday-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      position: relative;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 8px;
      margin-left: 10px;
      border-left: 8px solid #4c3fd9;
      border: 1px solid transparent;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      
      &:first-child {
        margin-top: 10px;
      }
      
      &:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        border: 1px solid #6c757d;
        border-left: 8px solid #4c3fd9;
        background: #f1f3f4;
      }
      
      &:focus, &:focus-within {
        outline: none;
        border: 1px solid #6c757d;
        border-left: 8px solid #4c3fd9;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        background: #ffffff;
      }
      
      &:active {
        transform: translateY(-1px) scale(1.01);
        box-shadow: 0 4px 15px rgba(0,0,0,0.12);
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .dashboard-birthday-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .dashboard-birthday-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .dashboard-age {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    
    .dashboard-birthday-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 8px 0;
    }
    
    .dashboard-birth-date {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 8px 12px;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      width: fit-content;
      
      &:hover {
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
      }
      
      .small-icon {
        color: white;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
      }
    }
    
    
    .dashboard-notes {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-style: italic;
      margin: 4px 0;
      
      .small-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
        color: var(--text-secondary);
      }
    }
    
    .dashboard-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      height: calc(100% + 5px);
      justify-content: flex-start;
    }
    
    .delete-button {
      opacity: 0.7;
      transition: all 0.3s ease;
      
      &:hover {
        opacity: 1;
        transform: scale(1.1);
      }
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
    
    .dashboard-icons {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }
    
    .edit-button-circle {
      width: 55px !important;
      height: 55px !important;
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
      color: white !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: 29px !important;
      margin-right: 8px !important;
      
      &:hover {
        transform: translateY(-1px) scale(1.1) !important;
        box-shadow: 0 6px 12px rgba(0, 123, 255, 0.4) !important;
      }
      
      .edit-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: white !important;
        transition: all 0.3s ease;
      }
      
      &:hover .edit-icon {
        filter: drop-shadow(0 0 4px rgba(255,255,255,0.8));
      }
      
      .mat-mdc-button-touch-target {
        background: transparent !important;
      }
    }

    .save-button-circle {
      width: 55px !important;
      height: 55px !important;
      background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%) !important;
      color: white !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: 29px !important;
      margin-right: 8px !important;
      
      &:hover {
        transform: translateY(-1px) scale(1.1) !important;
        box-shadow: 0 6px 12px rgba(40, 167, 69, 0.4) !important;
      }
      
      .save-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: white !important;
        transition: all 0.3s ease;
      }
      
      &:hover .save-icon {
        filter: drop-shadow(0 0 4px rgba(255,255,255,0.8));
      }
      
      .mat-mdc-button-touch-target {
        background: transparent !important;
      }
    }

    .cancel-button-circle {
      width: 55px !important;
      height: 55px !important;
      background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%) !important;
      color: white !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: 29px !important;
      
      &:hover {
        transform: translateY(-1px) scale(1.1) !important;
        box-shadow: 0 6px 12px rgba(108, 117, 125, 0.4) !important;
      }
      
      .cancel-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: white !important;
        transition: all 0.3s ease;
      }
      
      &:hover .cancel-icon {
        filter: drop-shadow(0 0 4px rgba(255,255,255,0.8));
      }
      
      .mat-mdc-button-touch-target {
        background: transparent !important;
      }
    }

    .edit-name-input, .edit-notes-input, .edit-date-input, .edit-category-select {
      background: rgba(255, 255, 255, 0.9) !important;
      border: 2px solid #007bff !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #333 !important;
      width: 100% !important;
      transition: all 0.3s ease !important;
      
      &:focus {
        outline: none !important;
        border-color: #0056b3 !important;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25) !important;
        background: white !important;
      }
      
      &::placeholder {
        color: #6c757d !important;
      }
    }

    .edit-name-input {
      font-size: 16px !important;
      font-weight: 600 !important;
      margin-bottom: 4px !important;
    }

    .dashboard-notes-edit {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }

    .dashboard-birth-date-edit {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      margin-bottom: 8px !important;
    }

    .dashboard-category-edit {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      margin-top: 8px !important;
    }

    .edit-category-select {
      cursor: pointer !important;
    }
    
    .delete-button-circle {
      width: 55px !important;
      height: 55px !important;
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
      color: white !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: 29px !important;
      
      &:hover {
        transform: translateY(-1px) scale(1.1) !important;
        box-shadow: 0 6px 12px rgba(220, 53, 69, 0.4) !important;
      }
      
      .delete-icon {
        width: 34px !important;
        height: 34px !important;
        filter: brightness(0) invert(1);
        transition: all 0.3s ease;
      }
      
      &:hover .delete-icon {
        filter: brightness(0) invert(1) drop-shadow(0 0 4px rgba(255,255,255,0.8));
      }
      
      .mat-mdc-button-touch-target {
        background: transparent !important;
      }
    }
    
    
    .birthday-days-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 0.9rem;
      color: white;
      text-align: center;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: visible;
      flex-shrink: 0;
      cursor: pointer;
      margin: 18px;
      
      &::before {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border-radius: 50%;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 0;
      }
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
        border-radius: 50%;
        z-index: 1;
      }
      
      .days-circle-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      
      .days-number {
        font-size: 0.9rem;
        font-weight: 900;
        line-height: 1;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        letter-spacing: -0.5px;
      }
      
      &.red-alert { 
        background: radial-gradient(circle, #ff4757 0%, #ff3742 40%, #c23616 100%);
        animation: red-alert-attention 1.5s infinite;
        box-shadow: 0 0 35px rgba(255, 71, 87, 0.9), 
                    0 0 70px rgba(255, 71, 87, 0.5),
                    0 0 100px rgba(255, 71, 87, 0.2),
                    inset 0 2px 10px rgba(255,255,255,0.4);
        
        &::before {
          background: radial-gradient(circle, rgba(255, 71, 87, 0.7) 0%, transparent 70%);
          animation: red-ring-pulse 2s infinite;
          opacity: 1;
        }
        
        .days-number {
          animation: red-text-glow 2s infinite;
          font-weight: 900;
        }
      }
      
      &.orange-warning { 
        background: radial-gradient(circle, #ff9500 0%, #ff7675 40%, #e17055 100%);
        animation: orange-warning-attention 2.5s infinite;
        box-shadow: 0 0 25px rgba(255, 149, 0, 0.7),
                    0 0 50px rgba(255, 149, 0, 0.3),
                    inset 0 2px 8px rgba(255,255,255,0.3);
        
        &::before {
          background: radial-gradient(circle, rgba(255, 149, 0, 0.5) 0%, transparent 70%);
          animation: orange-ring-pulse 3s infinite;
        }
      }
      
      &.green-safe { 
        background: radial-gradient(circle, #00b894 0%, #00a085 40%, #00cec9 100%);
        animation: green-calm-glow 4s infinite;
        box-shadow: 0 0 15px rgba(0, 184, 148, 0.5),
                    0 0 30px rgba(0, 184, 148, 0.2),
                    inset 0 2px 8px rgba(255,255,255,0.3);
        
        &::before {
          background: radial-gradient(circle, rgba(0, 184, 148, 0.3) 0%, transparent 70%);
          animation: green-ring-pulse 4s infinite;
        }
      }
      
      &:hover {
        transform: scale(1.15) rotate(5deg);
        
        &.red-alert { 
          transform: scale(1.25) rotate(10deg);
          box-shadow: 0 0 50px rgba(255, 71, 87, 1), 
                      0 0 100px rgba(255, 71, 87, 0.6);
        }
        &.orange-warning { 
          transform: scale(1.18) rotate(6deg);
          box-shadow: 0 0 35px rgba(255, 149, 0, 0.8);
        }
        &.green-safe { 
          transform: scale(1.12) rotate(3deg);
          box-shadow: 0 0 25px rgba(0, 184, 148, 0.6);
        }
      }
    }
    
    @keyframes red-alert-attention {
      0%, 100% { 
        transform: scale(1) rotate(0deg);
        box-shadow: 0 0 35px rgba(255, 71, 87, 0.9), 
                    0 0 70px rgba(255, 71, 87, 0.5),
                    0 0 100px rgba(255, 71, 87, 0.2);
      }
      25% { 
        transform: scale(1.08) rotate(3deg);
        box-shadow: 0 0 45px rgba(255, 71, 87, 1), 
                    0 0 90px rgba(255, 71, 87, 0.6),
                    0 0 120px rgba(255, 71, 87, 0.3);
      }
      50% { 
        transform: scale(1.04) rotate(-2deg);
        box-shadow: 0 0 40px rgba(255, 71, 87, 0.95), 
                    0 0 80px rgba(255, 71, 87, 0.5),
                    0 0 110px rgba(255, 71, 87, 0.25);
      }
      75% { 
        transform: scale(1.06) rotate(2deg);
        box-shadow: 0 0 42px rgba(255, 71, 87, 0.98), 
                    0 0 85px rgba(255, 71, 87, 0.55),
                    0 0 115px rgba(255, 71, 87, 0.28);
      }
    }
    
    @keyframes orange-warning-attention {
      0%, 100% { 
        transform: scale(1);
        box-shadow: 0 0 25px rgba(255, 149, 0, 0.7),
                    0 0 50px rgba(255, 149, 0, 0.3);
      }
      50% { 
        transform: scale(1.04);
        box-shadow: 0 0 32px rgba(255, 149, 0, 0.8),
                    0 0 65px rgba(255, 149, 0, 0.4);
      }
    }
    
    @keyframes green-calm-glow {
      0%, 100% { 
        box-shadow: 0 0 15px rgba(0, 184, 148, 0.5),
                    0 0 30px rgba(0, 184, 148, 0.2);
      }
      50% { 
        box-shadow: 0 0 20px rgba(0, 184, 148, 0.6),
                    0 0 40px rgba(0, 184, 148, 0.3);
      }
    }
    
    @keyframes red-ring-pulse {
      0%, 100% { opacity: 0; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.5); }
    }
    
    @keyframes orange-ring-pulse {
      0%, 100% { opacity: 0; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.3); }
    }
    
    @keyframes green-ring-pulse {
      0%, 100% { opacity: 0; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    
    @keyframes red-text-glow {
      0%, 100% { 
        text-shadow: 0 2px 4px rgba(0,0,0,0.4);
      }
      50% { 
        text-shadow: 0 2px 4px rgba(0,0,0,0.4), 
                     0 0 12px rgba(255,255,255,0.9),
                     0 0 20px rgba(255, 71, 87, 0.6);
      }
    }

    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
    }
    
    .categories-section {
      margin-top: 32px;
      margin-bottom: 32px;
      position: relative;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -16px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--primary) 0%, transparent 100%);
        border-radius: 1px;
      }
    }
    
    .section-title-wrapper {
      flex: 1;
      text-align: center;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-inverse);
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    
    .title-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
      
      mat-icon {
        color: white;
        font-size: 38px;
        width: 38px;
        height: 38px;
      }
      
      .title-custom-icon {
        width: 38px !important;
        height: 38px !important;
        filter: brightness(0) invert(1);
      }
    }
    
    .section-subtitle {
      color: var(--text-inverse);
      font-size: 1rem;
      margin: 0;
      font-weight: 500;
      opacity: 0.9;
    }
    
    .clear-all-btn {
      position: relative;
      background: linear-gradient(135deg, var(--warning) 0%, #ff6b6b 100%) !important;
      box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3) !important;
      animation: pulse-warning 2s infinite;
      
      mat-icon {
        color: white !important;
      }
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4) !important;
      }
    }
    
    @keyframes pulse-warning {
      0%, 100% { box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3); }
      50% { box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5); }
    }
    
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .category-stat-card {
      background: var(--surface) !important;
      border-radius: 20px !important;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
      border: 2px solid transparent !important;
      padding: 24px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
        z-index: 0;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 12px 32px rgba(0,0,0,0.15) !important;
        border-color: var(--primary) !important;
        
        &::before {
          opacity: 1;
        }
        
        .category-card-background {
          transform: scale(1.1);
          opacity: 0.15;
        }
      }
      
      &.selected {
        border: 2px solid var(--primary) !important;
        background: linear-gradient(135deg, var(--primary-light) 0%, rgba(102, 126, 234, 0.05) 100%) !important;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25) !important;
        transform: translateY(-4px) scale(1.05);
        
        &::before {
          opacity: 1;
        }
        
        .category-stat-name {
          color: var(--primary);
          font-weight: 800;
        }
        
        .category-card-background {
          opacity: 0.2;
          transform: scale(1.2);
        }
      }
    }
    
    .category-card-background {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 80px;
      height: 80px;
      background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
      border-radius: 50%;
      opacity: 0.05;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
    }
    
    .category-stat-content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .category-icon-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
    }
    
    .category-stat-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
    }
    
    .selection-indicator {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--success);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
      animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      
      mat-icon {
        color: white !important;
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
      }
    }
    
    @keyframes bounceIn {
      0% { transform: scale(0) rotate(180deg); opacity: 0; }
      50% { transform: scale(1.3) rotate(90deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    .category-stat-info {
      flex: 1;
      text-align: left;
    }
    
    .category-stat-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }
    
    .category-stat-count {
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 600;
      opacity: 0.8;
      text-transform: lowercase;
      
      &::first-letter {
        text-transform: uppercase;
      }
    }
    
    .filter-icon {
      color: var(--primary) !important;
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
      animation: checkmark 0.3s ease-in-out;
    }
    
    @keyframes checkmark {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    
    .filter-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--primary-light);
      border: 1px solid var(--primary);
      border-radius: var(--radius);
      padding: 16px;
      margin-top: 16px;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .filter-text {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
      font-weight: 600;
      
      mat-icon {
        color: var(--primary) !important;
      }
    }
    
    .clear-filter-btn {
      color: var(--primary) !important;
      border-color: var(--primary) !important;
      
      mat-icon {
        margin-right: 4px;
      }
      
      &:hover {
        background: var(--primary) !important;
        color: white !important;
      }
    }
    
    .filtered-dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-top: 24px;
      animation: slideInUp 0.5s ease-out;
    }
    
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .filtered-birthday-card {
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
    }
    
    .filtered-card-content {
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
    }
    
    .filtered-name-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    
    .filtered-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    
    .filtered-date {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 600;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .filtered-icons-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-light);
    }
    
    .filtered-category-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
      }
    }
    
    .filtered-zodiac-icon {
      width: 48px !important;
      height: 48px !important;
      font-size: 32px !important;
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
      }
    }

    .sync-row {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr 500px;
      gap: 32px;
      align-items: start;

      app-google-calendar-sync {
        width: 100%;
      }
    }
    
    .birthday-list-card {
      .mat-mdc-card-content {
        max-height: 600px !important;
      }
    }
    
    .chart-card {
      .mat-mdc-card-content {
        min-height: 180px !important;
        max-height: 300px !important;
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

      .sync-row {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 16px;
      }

      .birthday-list-card, .chart-card {
        .mat-mdc-card-content {
          padding: 16px !important;
          min-height: 280px !important;
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
        padding: 16px;
        gap: 12px;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 8px;
        
        &:hover {
          transform: translateY(-1px) scale(1.01);
          border: 1px solid #6c757d;
          border-left: 8px solid #4c3fd9;
        }
        
        &:focus, &:focus-within {
          border: 1px solid #6c757d;
          border-left: 8px solid #4c3fd9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          background: #ffffff;
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

      .dashboard-birthday-content {
        width: 100%;
        gap: 8px;
      }

      .dashboard-name {
        font-size: 1.1rem;
      }
      
      .dashboard-age {
        font-size: 0.8rem;
      }

      .dashboard-birthday-details {
        gap: 6px;
        margin: 6px 0;
      }
      
      .dashboard-birth-date {
        font-size: 0.8rem;
      }
      
      
      .dashboard-notes {
        font-size: 0.8rem;
      }

      .dashboard-actions {
        align-self: flex-end;
        flex-direction: row;
        gap: 12px;
        
        .birthday-days-circle {
          width: 60px;
          height: 60px;
          
          .days-number {
            font-size: 0.7rem;
          }
        }
      }
      
      .birthday-list-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
        
        .header-title-section {
          min-width: auto;
          width: 100%;
        }
        
        .header-search-section {
          width: 100%;
          
          .dashboard-search-field {
            width: 100%;
            max-width: 400px;
          }
        }
      }
    }
    
    @media (max-width: 900px) {
      .birthday-list-header {
        flex-direction: column;
        align-items: flex-start;
        
        .header-title-section {
          min-width: auto;
        }
        
        .header-search-section {
          width: 100%;
          
          .dashboard-search-field {
            width: 100%;
            max-width: 400px;
          }
        }
      }
    }

    @media (min-width: 769px) and (max-width: 1023px) {
      .sync-row {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .birthday-list-card, .chart-card {
        .mat-mdc-card-content {
          padding: 20px !important;
          min-height: 320px !important;
        }
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
        .birthday-days-circle {
          width: 65px;
          height: 65px;
          
          .days-number {
            font-size: 0.75rem;
          }
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
    
    
    .no-search-results {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-secondary);
      
      .large-search-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 24px;
        opacity: 0.6;
      }
      
      p {
        font-size: 1.1rem;
        margin: 0 0 24px 0;
        
        strong {
          color: var(--primary);
        }
      }
      
      button {
        margin-top: 16px;
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
  nextBirthdayText$: Observable<string>;
  chartData$: Observable<any[]>;
  maxCount$: Observable<number>;
  categoriesStats$: Observable<any[]>;
  allBirthdays$!: Observable<any[]>;
  selectedCategory: string | null = null;
  currentMonth = new Date().getMonth();
  defaultCategory = DEFAULT_CATEGORY;
  isAddingTestData = false;
  isClearingData = false;
  dashboardSearchTerm = '';
  editingBirthdayId: string | null = null;
  editingBirthdayData: any = {};

  constructor(public birthdayService: BirthdayService) {
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

    this.nextBirthdayText$ = this.next5Birthdays$.pipe(
      map(birthdays => {
        if (birthdays.length === 0) return 'None';
        const days = birthdays[0].daysUntil;
        if (days === 0) return 'Today!';
        if (days === 1) return 'Tomorrow';
        return `${days} days`;
      })
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

    this.updateAllBirthdays();
  }

  ngOnInit() {}

  getDaysText(days: number): string {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }

  getDaysChipClass(days: number): string {
    if (days <= 7) return 'red-alert';    
    if (days <= 30) return 'orange-warning'; 
    return 'green-safe';                      
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

  selectCategory(categoryId: string): void {
    this.selectedCategory = this.selectedCategory === categoryId ? null : categoryId;
    this.birthdayService.setSelectedCategory(this.selectedCategory);
  }

  clearCategoryFilter(): void {
    this.selectedCategory = null;
    this.birthdayService.setSelectedCategory(null);
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategory === categoryId;
  }

  getSortedFilteredBirthdays(birthdays: any[] | null): any[] {
    if (!birthdays) return [];
    
    return this.birthdayService.getNext5Birthdays()
      .filter(b => birthdays.some(filtered => filtered.id === b.id));
  }

  trackByBirthday(index: number, birthday: any): any {
    return birthday.id || index;
  }

  getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  deleteBirthday(birthday: any): void {
    this.birthdayService.deleteBirthday(birthday.id);
  }

  editBirthday(birthday: any): void {
    this.editingBirthdayId = birthday.id;
    this.editingBirthdayData = {
      name: birthday.name,
      notes: birthday.notes || '',
      birthDate: this.formatDateForInput(birthday.birthDate),
      category: birthday.category || this.defaultCategory
    };
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  saveEditingBirthday(birthday: any): void {
    if (this.editingBirthdayId !== birthday.id) return;

    const updatedBirthday = {
      ...birthday,
      name: this.editingBirthdayData.name.trim() || birthday.name,
      notes: this.editingBirthdayData.notes.trim(),
      birthDate: new Date(this.editingBirthdayData.birthDate),
      category: this.editingBirthdayData.category
    };
    
    this.birthdayService.updateBirthday(updatedBirthday);
    this.cancelEditingBirthday();
  }

  cancelEditingBirthday(): void {
    this.editingBirthdayId = null;
    this.editingBirthdayData = {};
  }

  isEditing(birthdayId: string): boolean {
    return this.editingBirthdayId === birthdayId;
  }

  getBirthdayCategories() {
    return BIRTHDAY_CATEGORIES;
  }

  onDashboardSearchChange(event: any): void {
    this.dashboardSearchTerm = event.target.value;
    this.updateAllBirthdays();
  }

  clearDashboardSearch(): void {
    this.dashboardSearchTerm = '';
    this.updateAllBirthdays();
  }

  private updateAllBirthdays(): void {
    this.allBirthdays$ = this.birthdayService.birthdays$.pipe(
      map(birthdays => {
        if (!birthdays || birthdays.length === 0) {
          return [];
        }
        
        let filteredBirthdays = birthdays
          .map(birthday => ({
            ...birthday,
            daysUntil: this.birthdayService.getDaysUntilBirthday(birthday.birthDate)
          }))
          .sort((a, b) => a.daysUntil - b.daysUntil);
        
        if (this.dashboardSearchTerm.trim()) {
          const searchTerm = this.dashboardSearchTerm.toLowerCase().trim();
          filteredBirthdays = filteredBirthdays.filter(birthday =>
            birthday.name.toLowerCase().includes(searchTerm)
          );
        }
        
        return filteredBirthdays;
      })
    );
  }
}