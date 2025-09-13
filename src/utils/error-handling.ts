/**
 * Centralized error handling utilities for consistent error management.
 */

/**
 * Error types for better error classification
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Standardized error interface
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  userMessage?: string;
}

/**
 * Create a standardized application error
 */
export function createAppError(
  type: ErrorType,
  message: string,
  originalError?: Error,
  context?: Record<string, any>
): AppError {
  return {
    type,
    message,
    originalError,
    context,
    userMessage: getUserFriendlyMessage(type, message),
  };
}

/**
 * Handle async operations with consistent error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const appError = error instanceof Error
      ? createAppError(ErrorType.UNKNOWN, error.message, error, { context })
      : createAppError(ErrorType.UNKNOWN, 'Unknown error occurred', undefined, { context });

    console.error(`Async operation failed: ${context}`, appError);
    return fallbackValue;
  }
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON', { jsonString, error });
    return fallback;
  }
}

/**
 * Safe array access with bounds checking
 */
export function safeArrayAccess<T>(array: T[], index: number, fallback: T): T {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    console.warn('Array access out of bounds', { index, arrayLength: array?.length });
    return fallback;
  }
  return array[index];
}

/**
 * Safe object property access with fallback
 */
export function safePropertyAccess<T>(
  obj: any,
  path: string,
  fallback: T
): T {
  try {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return fallback;
      }
      current = current[key];
    }

    return current !== undefined ? current : fallback;
  } catch (error) {
    console.warn('Property access failed', { path, error });
    return fallback;
  }
}

/**
 * Validate required fields
 */
export function validateRequired<T>(
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get user-friendly error messages
 */
function getUserFriendlyMessage(type: ErrorType, originalMessage: string): string {
  switch (type) {
    case ErrorType.NETWORK:
      return 'Network connection failed. Please check your internet connection and try again.';
    case ErrorType.PERMISSION:
      return 'You do not have permission to perform this action.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorType.VALIDATION:
      return 'Please check your input and try again.';
    case ErrorType.SERVER:
      return 'Server error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed`, { error: lastError.message });

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError!;
}
