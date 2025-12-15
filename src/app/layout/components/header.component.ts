import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NetworkStatusComponent } from '../../shared/components/network-status.component';
import { ThemeService } from '../../core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NetworkStatusComponent, MatSlideToggleModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-header">
      <div class="header-top">
        <h1 class="hero-title">
          <img src="assets/icons/logo-reminder.png" alt="Birthday Reminder Logo" class="app-logo">
          Birthday Memories
        </h1>
        <div class="header-controls">
          <mat-slide-toggle
            [checked]="(themeService.darkMode$ | async) ?? false"
            (change)="themeService.toggleDarkMode()"
            class="theme-toggle"
            color="primary">
            <mat-icon>{{ (themeService.darkMode$ | async) ? 'dark_mode' : 'light_mode' }}</mat-icon>
          </mat-slide-toggle>
          <app-network-status></app-network-status>
        </div>
      </div>
      <p class="hero-subtitle">Never forget the special moments that matter most. Keep track of all your loved ones' birthdays with style.</p>
      <nav class="nav-menu">
        <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          <mat-icon>home</mat-icon>
          Dashboard
        </a>
        <a mat-button routerLink="/scheduled-messages" routerLinkActive="active">
          <mat-icon>schedule_send</mat-icon>
          Messages
        </a>
        <a mat-button routerLink="/calendar-sync" routerLinkActive="active">
          <mat-icon>sync</mat-icon>
          Calendar
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }

    .header-top {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      position: relative;
    }

    .hero-title {
      font-size: 2.5rem;
      margin: 0;
      font-weight: 700;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .app-logo {
      height: 60px;
      width: 60px;
      object-fit: contain;
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
    }

    .hero-subtitle {
      font-size: 1.1rem;
      margin-top: 0.5rem;
      opacity: 0.95;
      font-weight: 300;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      position: absolute;
      right: 0;
      top: 0;
    }

    .theme-toggle {
      ::ng-deep .mdc-switch {
        opacity: 0.9;
      }

      mat-icon {
        margin-left: 8px;
        vertical-align: middle;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    app-network-status {
      position: static;
    }

    @media (max-width: 768px) {
      .app-header {
        padding: 1.5rem;
      }

      .hero-title {
        font-size: 1.8rem;
      }

      .app-logo {
        height: 45px;
        width: 45px;
      }

      .hero-subtitle {
        font-size: 0.95rem;
      }

      .header-top {
        flex-direction: column;
        gap: 0.5rem;
      }

      .header-controls {
        position: static;
        justify-content: center;
      }

      .theme-toggle {
        font-size: 0.9rem;
      }

      .nav-menu {
        margin-top: 8px;
      }
    }

    .nav-menu {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);

      a {
        color: white !important;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 20px;
        border-radius: 24px;
        transition: all 0.3s ease;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        &.active {
          background: rgba(255, 255, 255, 0.3);
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }
    }
  `]
})
export class HeaderComponent {
  constructor(public themeService: ThemeService) {}
}
