import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { getCategoryIcon, getCategoryColor, getCategoryById } from '../constants/categories';

@Component({
  selector: 'category-icon',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="category-icon-wrapper" 
         [style.background-color]="iconColor"
         [matTooltip]="categoryName"
         [class]="cssClass">
      <mat-icon class="category-icon">
        {{ iconName }}
      </mat-icon>
    </div>
  `,
  styles: [`
    .category-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 55px;
      height: 55px;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      position: relative;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 12px rgba(0,0,0,0.25);
      }
      
      .category-icon {
        color: white !important;
        font-size: 28px !important;
        width: 28px !important;
        height: 28px !important;
        text-shadow: 0 2px 4px rgba(0,0,0,0.4);
      }
    }
    
    .dashboard-category-inline.category-icon-wrapper {
      width: 55px;
      height: 55px;
      
      .category-icon {
        font-size: 28px !important;
        width: 28px !important;
        height: 28px !important;
      }
    }
    
    .category-stat-icon.category-icon-wrapper {
      width: 40px;
      height: 40px;
      
      .category-icon {
        font-size: 24px !important;
        width: 24px !important;
        height: 24px !important;
      }
    }
  `]
})
export class CategoryIconComponent {
  @Input() categoryId: string = 'friends';
  @Input() cssClass: string = '';

  get iconName(): string {
    return getCategoryIcon(this.categoryId);
  }

  get iconColor(): string {
    return getCategoryColor(this.categoryId);
  }

  get categoryName(): string {
    return getCategoryById(this.categoryId)?.name || 'Unknown';
  }
}