/**
 * Centralized error handling with toast notifications
 */

import { Alert } from 'react-native';
import { toast } from '@backpackapp-io/react-native-toast';
import { captureError } from './sentry';
import {
  ErrorCategory,
  categorizeError,
  getUserFriendlyMessage,
  requiresReauth,
} from './errors';

export interface HandleErrorOptions {
  /** Operation name for logging/tracking */
  operation: string;
  /** Additional context for Sentry */
  context?: Record<string, unknown>;
  /** Callback when retry is requested (for critical errors) */
  onRetry?: () => void;
  /** Override the default message */
  customMessage?: string;
  /** Force showing an alert instead of toast */
  forceAlert?: boolean;
}

/**
 * Handle an error with appropriate UI feedback and reporting
 *
 * @param error - The error to handle
 * @param options - Configuration options
 */
export function handleError(
  error: Error | unknown,
  options: HandleErrorOptions
): void {
  const { operation, context, onRetry, customMessage, forceAlert } = options;

  // Get error category and message
  const category = categorizeError(error);
  const message = customMessage || getUserFriendlyMessage(error);

  // Report to Sentry with context
  captureError(error, {
    operation,
    category,
    ...context,
  });

  // Handle based on category
  if (category === ErrorCategory.CRITICAL || forceAlert) {
    // Critical errors show a blocking alert with retry option
    if (onRetry) {
      Alert.alert('Error', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: onRetry },
      ]);
    } else {
      Alert.alert('Error', message);
    }
  } else if (requiresReauth(error)) {
    // Auth errors that require re-login show an alert
    Alert.alert('Session Expired', message, [{ text: 'OK' }]);
  } else {
    // All other errors show a toast
    toast.error(message, {
      duration: 3000,
    });
  }
}

/**
 * Show a success toast
 */
export function showSuccess(message: string): void {
  toast.success(message, {
    duration: 2000,
  });
}

/**
 * Show an info toast
 */
export function showInfo(message: string): void {
  toast(message, {
    duration: 2000,
  });
}
