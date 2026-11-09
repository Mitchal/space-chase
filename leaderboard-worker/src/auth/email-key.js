// Email addresses are never stored. An account is found by its email key: HMAC-SHA256 of the address (trimmed and
// lower-cased, email-address.js) with EMAIL_PEPPER, a Worker secret. Keyed, because addresses are easy to guess: a plain
// hash could be reversed by hashing a list of them. The address itself only lives in memory long enough to send the
// code, and is never logged.
// The pepper must never change or be lost: every account would become unreachable (README, "The email pepper").
const keys = new Map(); // pepper → its imported HMAC key, so it's imported once per Worker instance

async function hmacKey(pepper) {
  if (!keys.has(pepper)) {
    keys.set(pepper, crypto.subtle.importKey('raw', new TextEncoder().encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']));
  }
  return keys.get(pepper);
}

// Too short a pepper could be guessed; `openssl rand -base64 32` gives one of 44 characters.
export const PEPPER_MIN = 32;
export const pepperSet = env => typeof env.EMAIL_PEPPER === 'string' && env.EMAIL_PEPPER.length >= PEPPER_MIN;

// The key of a cleaned address (hex, 64 characters).
export async function emailKey(pepper, email) {
  const mac = await crypto.subtle.sign('HMAC', await hmacKey(pepper), new TextEncoder().encode(email));
  return [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// An address as it may appear in a log line: "mika@example.com" → "m***@e***.com".
export function maskEmail(email) {
  const [local = '', domain = ''] = String(email).split('@');
  const dot = domain.lastIndexOf('.');
  const host = dot > 0 ? domain.slice(0, dot) : domain, tld = dot > 0 ? domain.slice(dot) : '';
  return `${local.slice(0, 1)}***@${host.slice(0, 1)}***${tld}`;
}
