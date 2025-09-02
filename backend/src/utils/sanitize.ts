export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .trim();
}

