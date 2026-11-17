/**
 * User-facing handling for failed calls to the demo backend.
 *
 * The raw response body (often an HTML error page from the hosting provider)
 * must never be rendered on screen. Callers throw an {@link HttpRequestError}
 * whose `message` is a short, friendly sentence; the raw status and a trimmed
 * body excerpt are kept on the error for logging only.
 */

/** Max characters of a response body kept for diagnostics. */
const MAX_BODY_EXCERPT = 500;

export class HttpRequestError extends Error {
  readonly status: number;
  /** Trimmed response body, for logs only. Never show this to users. */
  readonly bodyExcerpt: string;

  constructor(message: string, status: number, bodyExcerpt = '') {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
    this.bodyExcerpt = bodyExcerpt;
  }
}

/**
 * Maps an HTTP status code to a short, user-facing explanation.
 * The status code is appended so developers can still diagnose the failure.
 */
export function describeHttpStatus(status: number): string {
  let reason: string;
  if (status === 502 || status === 503 || status === 504) {
    reason =
      'The server is temporarily unavailable, possibly for maintenance. Please try again in a few minutes.';
  } else if (status >= 500) {
    reason = 'The server ran into a problem. Please try again.';
  } else if (status === 429) {
    reason = 'Too many requests. Please wait a moment and try again.';
  } else if (status === 401 || status === 403) {
    reason =
      'The server rejected the request. Please check the app configuration.';
  } else if (status === 404) {
    reason =
      'The server endpoint could not be found. Please check the app configuration.';
  } else if (status === 408) {
    reason = 'The server took too long to respond. Please try again.';
  } else {
    reason = 'The request could not be completed. Please try again.';
  }
  return `${reason} (HTTP ${status})`;
}

/** Collapses whitespace and trims a response body for safe logging. */
export function toBodyExcerpt(body: string): string {
  const compact = body.replace(/\s+/g, ' ').trim();
  return compact.length > MAX_BODY_EXCERPT
    ? `${compact.slice(0, MAX_BODY_EXCERPT)}…`
    : compact;
}

/**
 * Builds an {@link HttpRequestError} for a non-OK response.
 * `action` describes what failed, e.g. "load payment details".
 */
export async function httpErrorFromResponse(
  response: Response,
  action: string
): Promise<HttpRequestError> {
  const body = await response.text().catch(() => '');
  return new HttpRequestError(
    `Couldn't ${action}. ${describeHttpStatus(response.status)}`,
    response.status,
    toBodyExcerpt(body)
  );
}
