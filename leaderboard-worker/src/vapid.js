// Signs a push to a browser's push service the standard way (VAPID, RFC 8292): a short-lived token signed with this
// server's private key, which the push service checks against the public key the browser subscribed with.
// Keys: VAPID_PUBLIC_KEY in wrangler.toml [vars] (the game fetches it from GET /reminder/key) and the secret
// VAPID_PRIVATE_KEY (README, "Turn on daily reminders"). Both are base64url, the format web-push tools print.
// The contact the push services ask for is the game's own address, not an email.
const CONTACT = 'https://spacechase.mikaelbrandt.com/';
const TOKEN_LIFE_S = 12 * 3600; // push services accept up to 24 hours

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const text = obj => b64url(new TextEncoder().encode(JSON.stringify(obj)));

const keys = new Map(); // one imported key per isolate

function signingKey(publicKey, privateKey) {
  if (!keys.has(privateKey)) {
    const pub = fromB64url(publicKey); // 0x04, then x and y (32 bytes each)
    const jwk = { kty: 'EC', crv: 'P-256', d: privateKey, x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33, 65)), ext: true };
    keys.set(privateKey, crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']));
  }
  return keys.get(privateKey);
}

// The Authorization header for a push to `endpoint`, or null when the keys aren't set.
export async function vapidAuth(env, endpoint, now = Date.now()) {
  const publicKey = env.VAPID_PUBLIC_KEY, privateKey = env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  const unsigned = `${text({ typ: 'JWT', alg: 'ES256' })}.${text({
    aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + TOKEN_LIFE_S, sub: CONTACT,
  })}`;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await signingKey(publicKey, privateKey),
    new TextEncoder().encode(unsigned)); // WebCrypto gives r‖s, which is what a JWT wants
  return `vapid t=${unsigned}.${b64url(sig)}, k=${publicKey}`;
}
