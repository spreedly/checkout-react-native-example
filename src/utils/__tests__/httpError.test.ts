import {
  HttpRequestError,
  describeHttpStatus,
  httpErrorFromResponse,
  toBodyExcerpt,
} from '../httpError';

const fakeResponse = (status: number, body: string | Error): Response =>
  ({
    status,
    ok: status >= 200 && status < 300,
    text: () =>
      body instanceof Error ? Promise.reject(body) : Promise.resolve(body),
  }) as unknown as Response;

const MAINTENANCE_PAGE = `<!DOCTYPE html>
<html>
  <head><title>Offline for Maintenance</title></head>
  <body><iframe src="https://www.herokucdn.com/error-pages/maintenance-mode.html"></iframe></body>
</html>`;

describe('describeHttpStatus', () => {
  it.each([502, 503, 504])('describes %i as temporarily unavailable', (s) => {
    expect(describeHttpStatus(s)).toBe(
      `The server is temporarily unavailable, possibly for maintenance. Please try again in a few minutes. (HTTP ${s})`
    );
  });

  it('describes other 5xx as a server problem', () => {
    expect(describeHttpStatus(500)).toContain('The server ran into a problem');
  });

  it.each([
    [429, 'Too many requests'],
    [401, 'rejected the request'],
    [403, 'rejected the request'],
    [404, 'could not be found'],
    [408, 'took too long'],
    [418, 'could not be completed'],
  ])('describes %i', (status, text) => {
    const message = describeHttpStatus(status);
    expect(message).toContain(text);
    expect(message).toContain(`(HTTP ${status})`);
  });
});

describe('toBodyExcerpt', () => {
  it('collapses whitespace', () => {
    expect(toBodyExcerpt('  a\n\n  b\tc  ')).toBe('a b c');
  });

  it('truncates long bodies to 500 characters plus an ellipsis', () => {
    const excerpt = toBodyExcerpt('x'.repeat(2000));
    expect(excerpt).toHaveLength(501);
    expect(excerpt.endsWith('…')).toBe(true);
  });
});

describe('httpErrorFromResponse', () => {
  it('keeps the HTML body out of the user-facing message', async () => {
    const error = await httpErrorFromResponse(
      fakeResponse(503, MAINTENANCE_PAGE),
      'connect to the checkout server'
    );

    expect(error).toBeInstanceOf(HttpRequestError);
    expect(error.status).toBe(503);
    expect(error.message).toBe(
      "Couldn't connect to the checkout server. The server is temporarily unavailable, possibly for maintenance. Please try again in a few minutes. (HTTP 503)"
    );
    expect(error.message).not.toContain('<');
    expect(error.bodyExcerpt).toContain('Offline for Maintenance');
  });

  it('still builds an error when the body cannot be read', async () => {
    const error = await httpErrorFromResponse(
      fakeResponse(500, new Error('stream closed')),
      'load saved payment methods'
    );

    expect(error.status).toBe(500);
    expect(error.bodyExcerpt).toBe('');
    expect(error.message).toContain("Couldn't load saved payment methods.");
  });
});
