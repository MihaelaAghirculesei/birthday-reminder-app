import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStatusComponent } from '../../shared/components/network-status.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NetworkStatusComponent],
  template: `
    <div class="app-header">
      <div class="header-top">
        <h1 class="hero-title">
          <img src="assets/icons/logo-reminder.png" alt="Birthday Reminder Logo" class="app-logo">
          Birthday Memories
        </h1>
        <app-network-status></app-network-status>
      </div>
      <p class="hero-subtitle">Never forget the special moments that matter most. Keep track of all your loved ones' birthdays with style.</p>
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

    app-network-status {
      position: absolute;
      right: 0;
      top: 0;
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

      app-network-status {
        position: static;
      }
    }
  `]
})
export class HeaderComponent {}
