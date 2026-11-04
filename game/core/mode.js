// Playtest mode: the taste experiment's tools (the reaction form, the on-disk log, blind A/B variants).
// Off for players. Turn it on with ?playtest=1 (it sticks in this browser) and off with ?playtest=0.
const KEY = 'lure.playtest';
const asked = new URLSearchParams(location.search).get('playtest');
try { if (asked !== null) asked === '0' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, '1'); } catch {}

let on = asked !== null ? asked !== '0' : false;
try { if (asked === null) on = localStorage.getItem(KEY) === '1'; } catch {}

export const playtest = on;
