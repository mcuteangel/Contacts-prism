import { ErrorManager, ErrorType } from '../error-manager';

describe('ErrorManager', () => {
  beforeEach(() => {
    // Clear any existing error queue
    ErrorManager.clearErrorQueue();
  });

  describe('getErrorType', () => {
    it('should identify network errors', () => {
      const error = new Error('NetworkError: Failed to fetch');
      error.name = 'NetworkError';
      
      const type = ErrorManager.getErrorType(error);
      expect(type).toBe(ErrorType.NETWORK);
    });

    it('should identify auth errors', () => {
      const error = new Error('JWT token expired');
      error.name = 'AuthError';
      
      const type = ErrorManager.getErrorType(error);
      expect(type).toBe(ErrorType.AUTH);
    });

    it('should identify validation errors', () => {
      const error = new Error('Invalid input data');
      error.name = 'ValidationError';
      
      const type = ErrorManager.getErrorType(error);
      expect(type).toBe(ErrorType.VALIDATION);
    });

    it('should default to unknown for unrecognized errors', () => {
      const error = new Error('Some random error');
      
      const type = ErrorManager.getErrorType(error);
      expect(type).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for network errors', () => {
      const error = new Error('NetworkError: Connection failed');
      error.name = 'NetworkError';
      
      const message = ErrorManager.getUserFriendlyMessage(error);
      expect(message).toBe('خطای شبکه: اتصال اینترنت خود را بررسی کنید');
    });

    it('should return user-friendly message for auth errors', () => {
      const error = new Error('Unauthorized access');
      error.name = 'AuthError';
      
      const message = ErrorManager.getUserFriendlyMessage(error);
      expect(message).toBe('خطای احراز هویت: لطفاً دوباره وارد شوید');
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Unknown error');
      
      const message = ErrorManager.getUserFriendlyMessage(error);
      expect(message).toBe('خطای ناشناخته: لطفاً دوباره تلاش کنید');
    });
  });

  describe('createCustomError', () => {
    it('should create error with specified type', () => {
      const error = ErrorManager.createCustomError('Test error', ErrorType.NETWORK);
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe(ErrorType.NETWORK);
    });

    it('should default to unknown type', () => {
      const error = ErrorManager.createCustomError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      
      ErrorManager.logError(error, {
        component: 'TestComponent',
        action: 'testAction'
      });
      
      // Verify that logging occurred (implementation may vary)
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle string context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      
      ErrorManager.logError(error, 'test context');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await ErrorManager.retryOperation(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const result = await ErrorManager.retryOperation(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(
        ErrorManager.retryOperation(operation, 2, 10)
      ).rejects.toThrow('Persistent failure');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('getErrorStats', () => {
    it('should return empty stats initially', () => {
      const stats = ErrorManager.getErrorStats();
      
      expect(stats.total).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byComponent).toEqual({});
      expect(stats.recentErrors).toEqual([]);
    });

    it('should track error statistics', () => {
      const error1 = new Error('Network error');
      error1.name = 'NetworkError';
      const error2 = new Error('Auth error');
      error2.name = 'AuthError';
      
      ErrorManager.reportError(error1, { component: 'TestComponent1' });
      ErrorManager.reportError(error2, { component: 'TestComponent2' });
      
      const stats = ErrorManager.getErrorStats();
      
      expect(stats.total).toBe(2);
      expect(stats.byType[ErrorType.NETWORK]).toBe(1);
      expect(stats.byType[ErrorType.AUTH]).toBe(1);
      expect(stats.byComponent['TestComponent1']).toBe(1);
      expect(stats.byComponent['TestComponent2']).toBe(1);
    });
  });
});