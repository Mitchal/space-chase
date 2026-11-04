// Where a phone's screen is really usable: notches, camera holes and rounded corners eat into its edges, so UI stays
// inside these insets (his ask, 2026-11-04: "Move all UI in from the edges to avoid the notches and curves of the phone").
// Sources, largest wins: CSS env(safe-area-inset-*) from the browser; window.__lureSafeArea, which the Android app sets
// from the real cutout and corner sizes (then fires 'lure-safearea'); and a small minimum on touch screens.
// All values in CSS pixels. Also published as CSS variables --safe-top/right/bottom/left for HTML UI.
export const safe = { top: 0, right: 0, bottom: 0, left: 0 };

const TOUCH_MIN = 12;
const touch = matchMedia('(pointer: coarse)').matches;
const SIDES = ['top', 'right', 'bottom', 'left'];

const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;'
  + SIDES.map(s => `padding-${s}:env(safe-area-inset-${s},0px)`).join(';');
document.documentElement.appendChild(probe);

export function measureSafeArea() {
  const css = getComputedStyle(probe), native = window.__lureSafeArea || {};
  for (const s of SIDES) {
    safe[s] = Math.max(parseFloat(css.getPropertyValue(`padding-${s}`)) || 0,native[s] || 0, touch ? TOUCH_MIN : 0);
    document.documentElement.style.setProperty(`--safe-${s}`, `${safe[s]}px`);
  }
  return safe;
}

// The app's measurements can arrive after the page has laid out: re-fit everything when they do.
addEventListener('lure-safearea', () => dispatchEvent(new Event('resize')));
