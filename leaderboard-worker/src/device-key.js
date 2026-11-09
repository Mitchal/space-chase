// Who is posting: each copy of the game makes a random 32-byte secret the first time it joins the board and sends it
// with every score as `Authorization: Bearer <64 hex digits>`. Only its SHA-256 is ever stored (name_owners.owner).
// A plain hash is enough because the secret is random and long: there is nothing to guess or look up.
const KEY = /^Bearer ([0-9a-f]{64})$/;

const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');

// → the device's owner hash (64 hex digits), or null when the request has no well-formed key.
export async function deviceOwner(request) {
  const m = KEY.exec(request.headers.get('authorization') ?? '');
  if (!m) return null;
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(m[1])));
}
