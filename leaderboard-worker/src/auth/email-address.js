// One spelling per address: trimmed and lower-cased, so "Anna@Example.com " and "anna@example.com" are one account.
// Only a light shape check; whether the address works shows when the code arrives (or doesn't).
export const EMAIL_MAX = 254; // the longest address mail servers accept

export function cleanEmail(e) {
  if (typeof e !== 'string') return null;
  const s = e.trim().toLowerCase();
  return s.length <= EMAIL_MAX && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s) ? s : null;
}

// A code as the player typed it: digits only, so "123 456" or "123-456" still work.
export function cleanCode(c, digits) {
  if (typeof c !== 'string' && typeof c !== 'number') return null;
  const s = String(c).replace(/[\s-]/g, '');
  return new RegExp(`^\\d{${digits}}$`).test(s) ? s : null;
}
