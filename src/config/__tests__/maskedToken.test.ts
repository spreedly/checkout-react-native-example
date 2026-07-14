import { maskedToken } from '../../utils/maskedToken';

describe('maskedToken', () => {
  it('masks a token with first 4 and last 4 visible', () => {
    expect(maskedToken('abcd1234567890efgh')).toBe('abcd****efgh');
  });

  it('returns [REDACTED] when token is too short', () => {
    expect(maskedToken('short')).toBe('[REDACTED]');
    expect(maskedToken('12345678901')).toBe('[REDACTED]');
  });

  it('masks at minimum valid length', () => {
    expect(maskedToken('123456789012')).toBe('1234****9012');
  });
});
