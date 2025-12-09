import { ErrorHandler, Injectable, Injector, isDevMode } from '@angular/core';
import { NotificationService } from './notification.service';

interface ErrorContext {
  type: 'IndexedDB' | 'NgRx' | 'GoogleAPI' | 'Network' | 'Unknown';
  userMessage: string;
  technicalMessage: string;
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error | any): void {
    const context = this.categorizeError(error);

    this.logError(error, context);
    this.notifyUser(context);
  }

  private categorizeError(error: any): ErrorContext {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    if (this.isIndexedDBError(error)) {
      return {
        type: 'IndexedDB',
        userMessage: 'Failed to save data locally. Please check storage permissions.',
        technicalMessage: errorMessage
      };
    }

    if (this.isGoogleAPIError(error)) {
      return {
        type: 'GoogleAPI',
        userMessage: 'Google Calendar sync failed. Please try again.',
        technicalMessage: errorMessage
      };
    }

    if (this.isNetworkError(error)) {
      return {
        type: 'Network',
        userMessage: 'Network connection lost. Changes will sync when online.',
        technicalMessage: errorMessage
      };
    }

    if (this.isNgRxError(error)) {
      return {
        type: 'NgRx',
        userMessage: 'An unexpected error occurred. Please refresh the page.',
        technicalMessage: errorMessage
      };
    }

    return {
      type: 'Unknown',
      userMessage: 'An unexpected error occurred.',
      technicalMessage: errorMessage
    };
  }

  private isIndexedDBError(error: any): boolean {
    return error?.name === 'QuotaExceededError' ||
           error?.name === 'InvalidStateError' ||
           error?.message?.includes('IndexedDB') ||
           error?.message?.includes('IDB');
  }

  private isGoogleAPIError(error: any): boolean {
    return error?.result?.error?.code ||
           error?.message?.includes('gapi') ||
           error?.message?.includes('Google');
  }

  private isNetworkError(error: any): boolean {
    return error?.message?.includes('Failed to fetch') ||
           error?.message?.includes('NetworkError') ||
           error instanceof TypeError && error.message.includes('fetch');
  }

  private isNgRxError(error: any): boolean {
    return error?.message?.includes('Effect') ||
           error?.message?.includes('Action') ||
           error?.message?.includes('Reducer');
  }

  private logError(error: any, context: ErrorContext): void {
    if (isDevMode()) {
      console.group(`🔴 ${context.type} Error`);
      console.error('Error:', error);
      console.error('Technical:', context.technicalMessage);
      console.error('User message:', context.userMessage);
      console.groupEnd();
    }
  }

  private notifyUser(context: ErrorContext): void {
    try {
      const notificationService = this.injector.get(NotificationService);

      if (context.type === 'Network') {
        notificationService.show(context.userMessage, 'warning', 5000);
      } else if (context.type === 'IndexedDB') {
        notificationService.show(context.userMessage, 'error', 7000);
      } else {
        notificationService.show(context.userMessage, 'error', 5000);
      }
    } catch (e) {
      console.error('Failed to show error notification:', e);
    }
  }
}
