/** Masks a payment method token for safe on-screen display. */
export function maskedToken(token: string): string {
  const minMaskedChars = 4;
  const revealedCount = 8;
  if (token.length < revealedCount + minMaskedChars) {
    return '[REDACTED]';
  }
  return `${token.slice(0, 4)}****${token.slice(-4)}`;
}
