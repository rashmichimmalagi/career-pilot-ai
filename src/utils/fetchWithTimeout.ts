/**
 * Safe fetch wrapper with guaranteed timeout, AbortController linkage, and error normalization.
 * Prevents requests from hanging indefinitely.
 */

export interface FetchTimeoutOptions extends RequestInit {
  timeoutMs?: number;
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out. Please try again.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Executes a fetch request with an enforced timeout.
 * @param url Request URL
 * @param options Fetch options including optional timeoutMs (default: 15000ms)
 * @returns Promise<Response>
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = 15000, signal: externalSignal, ...fetchOptions } = options;

  const controller = new AbortController();
  let isTimedOut = false;

  const timeoutId = setTimeout(() => {
    isTimedOut = true;
    controller.abort();
  }, timeoutMs);

  // Link external signal if provided
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      externalSignal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId);
          controller.abort();
        },
        { once: true }
      );
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (isTimedOut) {
      throw new TimeoutError(`Request to ${url.split('?')[0]} timed out after ${timeoutMs / 1000}s. Please try again.`);
    }
    if (err?.name === 'AbortError' && !isTimedOut) {
      // User or component aborted the request
      throw err;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
