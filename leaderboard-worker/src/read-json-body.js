// A small JSON request body: → {body} or {error: Response} (413 when it's too big, 400 when it isn't JSON).
import { json } from './json-response.js';

const MAX_BODY = 1024; // bytes; every request the game sends is far smaller

export async function readJsonBody(request, cors) {
  const text = await request.text();
  if (text.length > MAX_BODY) return { error: json({ error: 'too big' }, 413, cors) };
  try { return { body: JSON.parse(text) ?? {} }; } catch { return { error: json({ error: 'expected JSON' }, 400, cors) }; }
}
