// A basic filter for names everyone can see: it catches the obvious slurs and swearing (English and Swedish), also
// spelled with digits or dots (f.u.c.k, sh1t). It won't catch everything; remove the rest by hand (README).
// Most words only count as whole words, so "Scunthorpe", "Torpedo", "Therapist" or "Dickens" are fine.

// Rude anywhere in a name, even run together with other letters (none of these hide inside ordinary names).
const ANYWHERE = ['fuck', 'nigg', 'faggot', 'retard', 'whore', 'bitch', 'asshole', 'shit', 'hitler', 'porn',
  'fitta', 'kuksug', 'knull', 'horunge'];
// Rude only as a whole word.
const WHOLE = new Set(['ass', 'cunt', 'cunts', 'dick', 'cock', 'cum', 'fag', 'fags', 'nazi', 'sex', 'tits', 'twat',
  'piss', 'wank', 'wanker', 'slut', 'rape', 'rapist', 'pedo', 'kkk', 'nig', 'kuk', 'hora', 'neger', 'bög', 'jävel',
  'jävla', 'javla']);

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i' };
const fold = s => s.toLocaleLowerCase('sv').replace(/[0134578@$!]/g, c => LEET[c]);

export function nameAllowed(name) {
  const folded = fold(name);
  const squashed = folded.replace(/[^\p{L}]/gu, ''); // "f.u.c.k" → "fuck"
  if (ANYWHERE.some(w => squashed.includes(w))) return false;
  return !folded.split(/[^\p{L}]+/u).some(word => WHOLE.has(word));
}
