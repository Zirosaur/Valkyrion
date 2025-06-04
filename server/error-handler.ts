// Enhanced error handling utility for Discord bot
export class BotErrorHandler {
  static handleAsync<T>(promise: Promise<T>): Promise<[T | null, Error | null]> {
    return promise
      .then<[T, null]>((data: T) => [data, null])
      .catch<[null, Error]>((error: Error) => [null, error]);
  }

  static safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    fallback?: T
  ): Promise<T | undefined> {
    return operation().catch((error) => {
      console.error(`${errorMessage}:`, error instanceof Error ? error.message : String(error));
      return fallback;
    });
  }

  static logError(context: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(`[${context}] Error:`, errorMessage);
    if (stack) {
      console.error(`[${context}] Stack:`, stack);
    }
  }

  static isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return error.message.includes('ECONNRESET') || 
           error.message.includes('ENOTFOUND') ||
           error.message.includes('ETIMEDOUT') ||
           error.message.includes('network');
  }

  static isDiscordAPIError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return error.message.includes('DiscordAPIError') ||
           error.message.includes('RateLimitError') ||
           error.message.includes('HTTPError');
  }
}