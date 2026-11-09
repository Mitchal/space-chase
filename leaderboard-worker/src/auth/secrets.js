// The random parts of a login, and how they're kept: login codes and session tokens are stored only as SHA-256 hashes,
// so a copy of the database can't be used to log in as anyone.
export const CODE_DIGITS = 6;

// A login code: 6 digits, each one equally likely (no modulo bias).
export function randomCode() {
  const max = 10 ** CODE_DIGITS, limit = Math.floor(2 ** 32 / max) * max, n = new Uint32Array(1);
  do crypto.getRandomValues(n); while (n[0] >= limit);
  return String(n[0] % max).padStart(CODE_DIGITS, '0');
}

// A session token: 32 random bytes, base64url (43 characters).
export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// What a login code is kept as: tied to its email key, so the same code for two people hashes differently.
export const codeHash = (key, code) => sha256Hex(`${key}:${code}`);
