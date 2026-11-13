// The cursor, after the design portfolio's (src/components/Cursor.astro, after claire.io). With a mouse or trackpad the
// system pointer gives way to a small grey square that follows it:
//   - over `data-cursor="back"` (an album's way back) it becomes a back arrow;
//   - over `data-cursor="view"` (a photograph that opens in the viewer) an expand arrow;
//   - over `data-cursor="prev"` / `"next"` (the viewer's two halves) an arrow each way;
// and it shrinks while the button is down. Text fields keep the system's I-beam. Touch screens, keyboards and pages
// without JS never see any of it: `has-cursor` goes on <html> only once a mouse actually moves.
const el = document.querySelector('[data-cursor-el]');
if (el && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const root = document.documentElement;
  const TEXT = 'input:not([type=checkbox],[type=radio],[type=button],[type=submit]), textarea, select, [contenteditable]';
  let state = '';
  const set = (s) => { if (s !== state) { state = s; el.dataset.state = s; } };
  const read = (t) => {
    if (t?.closest?.(TEXT)) return set('text');
    const special = t?.closest?.('[data-cursor]');
    set(special ? special.dataset.cursor : 'dot');
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    root.classList.add('has-cursor');
    el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    read(e.target);
  }, { passive: true });
  // scrolling moves the page under a still pointer: read again what it is over
  addEventListener('scroll', () => {
    if (!root.classList.contains('has-cursor')) return;
    const r = el.getBoundingClientRect(); read(document.elementFromPoint(r.left, r.top));
  }, { passive: true, capture: true });
  document.addEventListener('pointerleave', () => set('away'));
  addEventListener('pointerdown', (e) => { el.classList.add('down'); if (e.pointerType !== 'mouse') root.classList.remove('has-cursor'); });
  addEventListener('pointerup', () => el.classList.remove('down'));
}
