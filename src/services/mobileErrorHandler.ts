import { Alert } from 'react-native';

export interface MobileError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

class MobileErrorHandler {
  private static instance: MobileErrorHandler;
  private errors: MobileError[] = [];

  static getInstance(): MobileErrorHandler {
    if (!MobileErrorHandler.instance) {
      MobileErrorHandler.instance = new MobileErrorHandler();
    }
    return MobileErrorHandler.instance;
  }

  handleError(
    error: any,
    context: string,
    options: ErrorHandlerOptions = {}
  ): MobileError {
    const {
      showAlert = true,
      logError = true,
      fallbackMessage = 'Wystąpił nieoczekiwany błąd'
    } = options;

    // Extract error information
    const mobileError: MobileError = {
      code: error?.code || error?.errorCode || 'UNKNOWN_ERROR',
      message: error?.message || error?.data?.message || fallbackMessage,
      details: error?.details || error?.data?.details || context,
      timestamp: new Date().toISOString(),
    };

    // Store error for debugging
    this.errors.push(mobileError);
    if (logError) {
      console.error(`[${context}] Error:`, mobileError);
    }

    // Show user-friendly alert
    if (showAlert) {
      this.showErrorAlert(mobileError);
    }

    return mobileError;
  }

  private showErrorAlert(error: MobileError): void {
    const title = this.getErrorTitle(error.code);
    const message = this.getUserFriendlyMessage(error);

    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          style: 'default',
        },
        ...(this.isRetryableError(error.code) ? [{
          text: 'Spróbuj ponownie',
          onPress: () => {
            // Emit retry event or callback
            this.emitRetryEvent(error);
          }
        }] : [])
      ]
    );
  }

  private getErrorTitle(code: string): string {
    const titleMap: { [key: string]: string } = {
      'NETWORK_ERROR': 'Problem z połączeniem',
      'VALIDATION_ERROR': 'Błąd walidacji',
      'AUTH_ERROR': 'Błąd autoryzacji',
      'SYNC_ERROR': 'Błąd synchronizacji',
      'CALCULATION_ERROR': 'Błąd obliczeń',
      'UNKNOWN_ERROR': 'Błąd aplikacji',
    };

    return titleMap[code] || 'Błąd';
  }

  private getUserFriendlyMessage(error: MobileError): string {
    const messageMap: { [key: string]: string } = {
      'NETWORK_ERROR': 'Sprawdź połączenie internetowe i spróbuj ponownie.',
      'VALIDATION_ERROR': 'Sprawdź poprawność wprowadzonych danych.',
      'AUTH_ERROR': 'Zaloguj się ponownie do aplikacji.',
      'SYNC_ERROR': 'Dane zostaną zsynchronizowane przy następnym połączeniu.',
      'CALCULATION_ERROR': 'Sprawdź obliczenia i spróbuj ponownie.',
    };

    return messageMap[error.code] || error.message;
  }

  private isRetryableError(code: string): boolean {
    const retryableErrors = [
      'NETWORK_ERROR',
      'SYNC_ERROR',
      'CALCULATION_ERROR',
    ];

    return retryableErrors.includes(code);
  }

  private emitRetryEvent(error: MobileError): void {
    // In a real app, you might use an event emitter or callback system
    console.log('Retry requested for error:', error);
  }

  getErrors(): MobileError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getErrorsByContext(context: string): MobileError[] {
    return this.errors.filter(error =>
      error.details?.includes(context)
    );
  }
}

export const mobileErrorHandler = MobileErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleApiError = (error: any, context: string) => {
  return mobileErrorHandler.handleError(error, context);
};

export const handleNetworkError = (context: string) => {
  return mobileErrorHandler.handleError(
    { code: 'NETWORK_ERROR', message: 'Network request failed' },
    context
  );
};

export const handleValidationError = (message: string, context: string) => {
  return mobileErrorHandler.handleError(
    { code: 'VALIDATION_ERROR', message },
    context
  );
};

export const handleSyncError = (error: any, context: string) => {
  return mobileErrorHandler.handleError(
    { code: 'SYNC_ERROR', message: 'Synchronization failed' },
    context
  );
};