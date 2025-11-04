import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryHandler {
  private options: Required<RetryOptions>;

  constructor(options: RetryOptions) {
    this.options = {
      backoffMultiplier: 2,
      maxDelayMs: 30000,
      retryableErrors: [],
      onRetry: () => {},
      ...options
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.options.maxAttempts) {
          break;
        }

        if (!this.shouldRetry(error as Error)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        this.options.onRetry(attempt, error as Error);
        
        logger.warn(`Retry attempt ${attempt}/${this.options.maxAttempts} after ${delay}ms`, {
          error: (error as Error).message
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private shouldRetry(error: Error): boolean {
    if (this.options.retryableErrors.length === 0) {
      return true;
    }

    return this.options.retryableErrors.some(retryableError =>
      error.message.includes(retryableError) || error.name === retryableError
    );
  }

  private calculateDelay(attempt: number): number {
    const delay = this.options.delayMs * Math.pow(this.options.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.options.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  const handler = new RetryHandler(options);
  return handler.execute(fn);
};
