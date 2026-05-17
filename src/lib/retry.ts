/**
 * Retry utility with exponential backoff
 * Useful for transient failures (network, timeouts)
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number  // ms
  maxDelay?: number      // ms
  backoffMultiplier?: number
  onRetry?: (attempt: number, error: unknown) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffMultiplier = 2,
    onRetry,
  } = options

  let lastError: unknown
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts) break
      
      onRetry?.(attempt, error)
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.1 * delay
      const waitTime = Math.min(delay + jitter, maxDelay)
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
      delay = Math.min(delay * backoffMultiplier, maxDelay)
    }
  }

  throw lastError
}

/**
 * Timeout wrapper for promises
 * @param promise The promise to timeout
 * @param ms Timeout in milliseconds
 * @param message Custom error message
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 10000,
  message: string = `Operation timed out after ${ms}ms`
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ])
}
