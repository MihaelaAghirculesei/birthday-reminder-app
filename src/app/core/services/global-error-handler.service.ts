import { ErrorHandler, Injectable, Injector, isDevMode } from '@angular/core';
import { NotificationService } from './notification.service';

interface ErrorContext {
  type: 'IndexedDB' | 'NgRx' | 'GoogleAPI' | 'Network' | 'Unknown';
  userMessage: string;
  technicalMessage: string;
}

interface IndexedDBError extends Error {
  name: 'QuotaExceededError' | 'InvalidStateError' | string;
}

interface GoogleAPIError {
  result?: {
    error?: {
      code?: number | string;
    };
  };
  message?: string;
}

interface NetworkError extends Error {
  message: string;
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    const context = this.categorizeError(error);

    this.logError(error, context);
    this.notifyUser(context);
  }

  private categorizeError(error: unknown): ErrorContext {
    const errorMessage = this.getErrorMessage(error);

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

  private isIndexedDBError(error: unknown): boolean {
    if (!this.isErrorLike(error)) return false;
    return error.name === 'QuotaExceededError' ||
           error.name === 'InvalidStateError' ||
           (typeof error.message === 'string' &&
            (error.message.includes('IndexedDB') || error.message.includes('IDB')));
  }

  private isGoogleAPIError(error: unknown): boolean {
    if (!this.isObject(error)) return false;
    const hasResultError = this.isObject(error['result']) &&
                          this.isObject(error['result']['error']) &&
                          error['result']['error']['code'] !== undefined;
    const hasGoogleMessage = typeof error['message'] === 'string' &&
                            (error['message'].includes('gapi') || error['message'].includes('Google'));
    return hasResultError || hasGoogleMessage;
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    if (!this.isErrorLike(error)) return false;
    return typeof error.message === 'string' &&
           (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'));
  }

  private isNgRxError(error: unknown): boolean {
    if (!this.isErrorLike(error)) return false;
    return typeof error.message === 'string' &&
           (error.message.includes('Effect') ||
            error.message.includes('Action') ||
            error.message.includes('Reducer'));
  }

  private isErrorLike(error: unknown): error is Error {
    return error instanceof Error ||
           (this.isObject(error) && 'message' in error && 'name' in error);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (this.isObject(error) && typeof error['message'] === 'string') {
      return error['message'];
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }

  private logError(error: unknown, context: ErrorContext): void {
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
