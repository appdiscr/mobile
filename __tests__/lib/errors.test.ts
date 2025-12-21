import {
  ErrorCategory,
  categorizeError,
  getErrorMessage,
  getUserFriendlyMessage,
  requiresReauth,
} from '../../lib/errors';

describe('errors', () => {
  describe('getErrorMessage', () => {
    it('extracts message from Error instance', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('returns string directly if error is a string', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('extracts message from object with message property', () => {
      const error = { message: 'Object error message' };
      expect(getErrorMessage(error)).toBe('Object error message');
    });

    it('returns default message for null', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
    });

    it('returns default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    });

    it('returns default message for object without message', () => {
      expect(getErrorMessage({ code: 500 })).toBe('An unknown error occurred');
    });

    it('returns default message for number', () => {
      expect(getErrorMessage(404)).toBe('An unknown error occurred');
    });
  });

  describe('categorizeError', () => {
    describe('NETWORK errors', () => {
      it('categorizes "network request failed"', () => {
        expect(categorizeError(new Error('Network request failed'))).toBe(ErrorCategory.NETWORK);
      });

      it('categorizes "failed to fetch"', () => {
        expect(categorizeError(new Error('Failed to fetch'))).toBe(ErrorCategory.NETWORK);
      });

      it('categorizes timeout errors', () => {
        expect(categorizeError(new Error('Request timeout'))).toBe(ErrorCategory.NETWORK);
      });

      it('categorizes connection errors', () => {
        expect(categorizeError(new Error('Connection refused'))).toBe(ErrorCategory.NETWORK);
      });
    });

    describe('AUTH errors', () => {
      it('categorizes JWT expired', () => {
        expect(categorizeError(new Error('JWT expired'))).toBe(ErrorCategory.AUTH);
      });

      it('categorizes token errors', () => {
        expect(categorizeError(new Error('Invalid token'))).toBe(ErrorCategory.AUTH);
      });

      it('categorizes login errors', () => {
        expect(categorizeError(new Error('Login failed'))).toBe(ErrorCategory.AUTH);
      });

      it('categorizes credential errors', () => {
        expect(categorizeError(new Error('Invalid credentials'))).toBe(ErrorCategory.AUTH);
      });

      it('categorizes password errors', () => {
        expect(categorizeError(new Error('Incorrect password'))).toBe(ErrorCategory.AUTH);
      });

      it('categorizes email errors', () => {
        expect(categorizeError(new Error('Email not verified'))).toBe(ErrorCategory.AUTH);
      });

      it('categorizes session errors', () => {
        expect(categorizeError(new Error('Session expired'))).toBe(ErrorCategory.AUTH);
      });

      it('categorizes sign in errors', () => {
        expect(categorizeError(new Error('Please sign in'))).toBe(ErrorCategory.AUTH);
      });

      it('categorizes authenticated errors', () => {
        expect(categorizeError(new Error('Not authenticated'))).toBe(ErrorCategory.AUTH);
      });
    });

    describe('VALIDATION errors', () => {
      it('categorizes invalid input', () => {
        expect(categorizeError(new Error('Invalid input'))).toBe(ErrorCategory.VALIDATION);
      });

      it('categorizes required field errors', () => {
        expect(categorizeError(new Error('Field is required'))).toBe(ErrorCategory.VALIDATION);
      });

      it('categorizes validation errors', () => {
        expect(categorizeError(new Error('Validation failed'))).toBe(ErrorCategory.VALIDATION);
      });
    });

    describe('CRITICAL errors', () => {
      it('categorizes memory errors', () => {
        expect(categorizeError(new Error('Out of memory'))).toBe(ErrorCategory.CRITICAL);
      });

      it('categorizes crash errors', () => {
        expect(categorizeError(new Error('App crash detected'))).toBe(ErrorCategory.CRITICAL);
      });

      it('categorizes fatal errors', () => {
        expect(categorizeError(new Error('Fatal error'))).toBe(ErrorCategory.CRITICAL);
      });
    });

    describe('API errors', () => {
      it('categorizes row not found', () => {
        expect(categorizeError(new Error('Row not found'))).toBe(ErrorCategory.API);
      });

      it('categorizes permission denied', () => {
        expect(categorizeError(new Error('Permission denied'))).toBe(ErrorCategory.API);
      });

      it('categorizes foreign key violations', () => {
        expect(categorizeError(new Error('Foreign key violation'))).toBe(ErrorCategory.API);
      });

      it('categorizes unique violations', () => {
        expect(categorizeError(new Error('Unique constraint violation'))).toBe(ErrorCategory.API);
      });
    });

    describe('UNKNOWN errors', () => {
      it('categorizes unrecognized errors as UNKNOWN', () => {
        expect(categorizeError(new Error('Something happened'))).toBe(ErrorCategory.UNKNOWN);
      });

      it('categorizes empty errors as UNKNOWN', () => {
        expect(categorizeError(new Error(''))).toBe(ErrorCategory.UNKNOWN);
      });
    });
  });

  describe('getUserFriendlyMessage', () => {
    describe('specific error patterns', () => {
      it('returns friendly message for network request failed', () => {
        expect(getUserFriendlyMessage(new Error('Network request failed'))).toBe(
          'Unable to connect. Please check your internet.'
        );
      });

      it('returns friendly message for failed to fetch', () => {
        expect(getUserFriendlyMessage(new Error('Failed to fetch'))).toBe(
          'Unable to connect. Please check your internet.'
        );
      });

      it('returns friendly message for invalid login credentials', () => {
        expect(getUserFriendlyMessage(new Error('Invalid login credentials'))).toBe(
          'Incorrect email or password.'
        );
      });

      it('returns friendly message for JWT expired', () => {
        expect(getUserFriendlyMessage(new Error('JWT expired'))).toBe(
          'Your session has expired. Please sign in again.'
        );
      });

      it('returns friendly message for email not confirmed', () => {
        expect(getUserFriendlyMessage(new Error('Email not confirmed'))).toBe(
          'Please verify your email before signing in.'
        );
      });

      it('returns friendly message for row not found', () => {
        expect(getUserFriendlyMessage(new Error('Row not found'))).toBe(
          'The requested item was not found.'
        );
      });

      it('returns friendly message for permission denied', () => {
        expect(getUserFriendlyMessage(new Error('Permission denied'))).toBe(
          'You do not have permission to perform this action.'
        );
      });

      it('returns friendly message for timeout', () => {
        expect(getUserFriendlyMessage(new Error('Request timeout'))).toBe(
          'Request timed out. Please try again.'
        );
      });
    });

    describe('fallback messages by category', () => {
      it('returns network fallback for unrecognized network error', () => {
        expect(getUserFriendlyMessage(new Error('Connection lost suddenly'))).toBe(
          'Unable to connect. Please check your internet.'
        );
      });

      it('returns auth fallback for unrecognized auth error', () => {
        expect(getUserFriendlyMessage(new Error('Token verification failed'))).toBe(
          'Authentication failed. Please try again.'
        );
      });

      it('returns validation fallback for unrecognized validation error', () => {
        expect(getUserFriendlyMessage(new Error('Invalid format provided'))).toBe(
          'Please check your input and try again.'
        );
      });

      it('returns critical fallback for unrecognized critical error', () => {
        expect(getUserFriendlyMessage(new Error('Memory allocation failed'))).toBe(
          'A critical error occurred. Please restart the app.'
        );
      });

      it('returns API fallback for unrecognized API error', () => {
        expect(getUserFriendlyMessage(new Error('Constraint check failed'))).toBe(
          'Unable to complete request. Please try again.'
        );
      });

      it('returns default fallback for unknown errors', () => {
        expect(getUserFriendlyMessage(new Error('Something weird happened'))).toBe(
          'Something went wrong. Please try again.'
        );
      });
    });
  });

  describe('requiresReauth', () => {
    it('returns true for JWT expired', () => {
      expect(requiresReauth(new Error('JWT expired'))).toBe(true);
    });

    it('returns true for JWT malformed', () => {
      expect(requiresReauth(new Error('JWT malformed'))).toBe(true);
    });

    it('returns true for refresh_token_not_found', () => {
      expect(requiresReauth(new Error('refresh_token_not_found'))).toBe(true);
    });

    it('returns true for session expired', () => {
      expect(requiresReauth(new Error('Session expired'))).toBe(true);
    });

    it('returns true for not authenticated', () => {
      expect(requiresReauth(new Error('User is not authenticated'))).toBe(true);
    });

    it('returns false for regular errors', () => {
      expect(requiresReauth(new Error('Network failed'))).toBe(false);
    });

    it('returns false for invalid credentials', () => {
      expect(requiresReauth(new Error('Invalid credentials'))).toBe(false);
    });
  });
});
