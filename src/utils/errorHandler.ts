// Comprehensive error handling utilities

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class CustomError extends Error {
  public code: string;
  public details?: any;
  public context?: string;
  public severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    details?: any,
    context?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.context = context;
    this.severity = severity;
  }
}

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  
  // Data errors
  DATA_VALIDATION_ERROR: 'DATA_VALIDATION_ERROR',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_CONFLICT: 'DATA_CONFLICT',
  
  // AI service errors
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  AI_RESPONSE_INVALID: 'AI_RESPONSE_INVALID',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  
  // Business logic errors
  OKR_VALIDATION_ERROR: 'OKR_VALIDATION_ERROR',
  TASK_VALIDATION_ERROR: 'TASK_VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // System errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Log error
  public logError(error: Error | CustomError, context?: string): AppError {
    const appError: AppError = {
      code: error instanceof CustomError ? error.code : ERROR_CODES.UNKNOWN_ERROR,
      message: error.message,
      details: error instanceof CustomError ? error.details : undefined,
      context: context || (error instanceof CustomError ? error.context : undefined),
      timestamp: new Date(),
      severity: error instanceof CustomError ? error.severity : 'medium',
    };

    this.errorLog.unshift(appError);
    
    // Keep only the most recent errors
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', appError);
    }

    return appError;
  }

  // Get user-friendly error message
  public getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case ERROR_CODES.NETWORK_ERROR:
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      
      case ERROR_CODES.API_TIMEOUT:
        return 'The request is taking longer than expected. Please try again.';
      
      case ERROR_CODES.API_UNAVAILABLE:
        return 'The service is temporarily unavailable. Please try again later.';
      
      case ERROR_CODES.AUTH_REQUIRED:
        return 'Please log in to continue.';
      
      case ERROR_CODES.AUTH_EXPIRED:
        return 'Your session has expired. Please log in again.';
      
      case ERROR_CODES.AUTH_INVALID:
        return 'Invalid credentials. Please check your login information.';
      
      case ERROR_CODES.DATA_VALIDATION_ERROR:
        return 'Please check your input and try again.';
      
      case ERROR_CODES.DATA_NOT_FOUND:
        return 'The requested information could not be found.';
      
      case ERROR_CODES.DATA_CONFLICT:
        return 'This information conflicts with existing data. Please review and try again.';
      
      case ERROR_CODES.AI_SERVICE_ERROR:
        return 'AI service is temporarily unavailable. Please try again later.';
      
      case ERROR_CODES.AI_RESPONSE_INVALID:
        return 'AI response was invalid. Please try again.';
      
      case ERROR_CODES.AI_QUOTA_EXCEEDED:
        return 'AI service quota exceeded. Please try again later.';
      
      case ERROR_CODES.OKR_VALIDATION_ERROR:
        return 'Please check your OKR information and try again.';
      
      case ERROR_CODES.TASK_VALIDATION_ERROR:
        return 'Please check your task information and try again.';
      
      case ERROR_CODES.PERMISSION_DENIED:
        return 'You do not have permission to perform this action.';
      
      case ERROR_CODES.STORAGE_ERROR:
        return 'Unable to save data. Please try again.';
      
      case ERROR_CODES.CONFIGURATION_ERROR:
        return 'Application configuration error. Please contact support.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Get error severity color
  public getSeverityColor(severity: AppError['severity']): string {
    switch (severity) {
      case 'low':
        return 'text-blue-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  // Get recent errors
  public getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(0, limit);
  }

  // Clear error log
  public clearLog(): void {
    this.errorLog = [];
  }

  // Handle API errors
  public handleApiError(error: any, context?: string): AppError {
    let appError: AppError;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          appError = new CustomError(
            data?.message || 'Bad request',
            ERROR_CODES.DATA_VALIDATION_ERROR,
            data,
            context,
            'medium'
          );
          break;
        case 401:
          appError = new CustomError(
            'Authentication required',
            ERROR_CODES.AUTH_REQUIRED,
            data,
            context,
            'high'
          );
          break;
        case 403:
          appError = new CustomError(
            'Permission denied',
            ERROR_CODES.PERMISSION_DENIED,
            data,
            context,
            'high'
          );
          break;
        case 404:
          appError = new CustomError(
            'Resource not found',
            ERROR_CODES.DATA_NOT_FOUND,
            data,
            context,
            'medium'
          );
          break;
        case 409:
          appError = new CustomError(
            'Data conflict',
            ERROR_CODES.DATA_CONFLICT,
            data,
            context,
            'medium'
          );
          break;
        case 429:
          appError = new CustomError(
            'Rate limit exceeded',
            ERROR_CODES.AI_QUOTA_EXCEEDED,
            data,
            context,
            'medium'
          );
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          appError = new CustomError(
            'Server error',
            ERROR_CODES.API_UNAVAILABLE,
            data,
            context,
            'high'
          );
          break;
        default:
          appError = new CustomError(
            `HTTP ${status} error`,
            ERROR_CODES.API_UNAVAILABLE,
            data,
            context,
            'medium'
          );
      }
    } else if (error.request) {
      // Network error
      appError = new CustomError(
        'Network error',
        ERROR_CODES.NETWORK_ERROR,
        error.request,
        context,
        'high'
      );
    } else {
      // Other error
      appError = new CustomError(
        error.message || 'Unknown error',
        ERROR_CODES.UNKNOWN_ERROR,
        error,
        context,
        'medium'
      );
    }

    return this.logError(appError, context);
  }

  // Handle AI service errors
  public handleAiError(error: any, context?: string): AppError {
    let appError: AppError;

    if (error.code === 'QUOTA_EXCEEDED') {
      appError = new CustomError(
        'AI service quota exceeded',
        ERROR_CODES.AI_QUOTA_EXCEEDED,
        error,
        context,
        'medium'
      );
    } else if (error.code === 'INVALID_RESPONSE') {
      appError = new CustomError(
        'Invalid AI response',
        ERROR_CODES.AI_RESPONSE_INVALID,
        error,
        context,
        'medium'
      );
    } else {
      appError = new CustomError(
        'AI service error',
        ERROR_CODES.AI_SERVICE_ERROR,
        error,
        context,
        'medium'
      );
    }

    return this.logError(appError, context);
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions
export const createError = (
  message: string,
  code: string = ERROR_CODES.UNKNOWN_ERROR,
  details?: any,
  context?: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): CustomError => {
  return new CustomError(message, code, details, context, severity);
};

export const handleError = (error: Error | CustomError, context?: string): AppError => {
  return errorHandler.logError(error, context);
};

export const getUserFriendlyMessage = (error: AppError): string => {
  return errorHandler.getUserFriendlyMessage(error);
};
