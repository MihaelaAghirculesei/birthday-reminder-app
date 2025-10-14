import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../../material.module';
import { Birthday } from '../../../models/birthday.model';

@Component({
  selector: 'app-message-indicator',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './message-indicator.component.html',
  styleUrls: ['./message-indicator.component.scss'],
})
export class MessageIndicatorComponent {
  @Input() birthday: Birthday | null = null;

  get hasActiveMessages(): boolean {
    if (!this.birthday?.scheduledMessages) {
      console.log('No scheduled messages for:', this.birthday?.name);
      return false;
    }
    const hasActive = this.birthday.scheduledMessages.some(
      (msg) => msg.isActive
    );
    console.log(
      'Has active messages for',
      this.birthday.name,
      ':',
      hasActive,
      this.birthday.scheduledMessages
    );
    return hasActive;
  }

  get activeMessageCount(): number {
    if (!this.birthday?.scheduledMessages) return 0;
    return this.birthday.scheduledMessages.filter((msg) => msg.isActive).length;
  }

  get totalMessageCount(): number {
    return this.birthday?.scheduledMessages?.length || 0;
  }

  getTooltipText(): string {
    if (!this.birthday) return 'No information available';

    const activeCount = this.activeMessageCount;
    const totalCount = this.totalMessageCount;

    if (activeCount === 0 && totalCount === 0) {
      return '❌ No messages configured for this birthday';
    }

    if (activeCount === 0 && totalCount > 0) {
      return `⏸️ ${totalCount} message${totalCount > 1 ? 's' : ''} configured but disabled`;
    }

    if (activeCount === 1 && totalCount === 1) {
      const message = this.birthday.scheduledMessages?.find(
        (msg) => msg.isActive
      );
      return `✅ Message configured: "${message?.title}" - sending at ${message?.deliveryTime}`;
    }

    if (activeCount === totalCount) {
      return `✅ ${activeCount} messages configured and active for birthday`;
    }

    return `✅ ${activeCount} of ${totalCount} configured messages are active`;
  }

  debugClick(): void {
    console.log('=== MESSAGE INDICATOR DEBUG ===');
    console.log('Birthday:', this.birthday);
    console.log('Has active messages:', this.hasActiveMessages);
    console.log('Active message count:', this.activeMessageCount);
    console.log('Total message count:', this.totalMessageCount);
    console.log(
      'Border color should be:',
      this.hasActiveMessages ? '#9b59b6' : '#95a5a6'
    );
  }

  getNextMessageInfo(): string {
    if (!this.hasActiveMessages) return '';

    const activeMessages =
      this.birthday?.scheduledMessages?.filter((msg) => msg.isActive) || [];

    if (activeMessages.length === 0) return '';

    const sortedMessages = activeMessages.sort((a, b) => {
      return a.deliveryTime.localeCompare(b.deliveryTime);
    });

    const nextMessage = sortedMessages[0];
    return `Next: ${nextMessage.title} at ${nextMessage.deliveryTime}`;
  }
}
