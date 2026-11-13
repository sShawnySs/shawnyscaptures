// The opening. Two parts:
//   mountHero   one full-screen photograph from each album marked `selected` in data/site.json, cross-fading on a
//               timer. A small caption names the couple and links to their album; the ticks show which photograph
//               is up and how long it has left, and jump to another when pressed.
//   mountIntro  the way in: the page starts as a page of a photobook, one per landing album, each in its own
//               layout, turning to the next on the same timer. Scrolling grows the page's main photograph
//               until it fills the screen.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const PAUSE = '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const PLAY = '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.5 8z" fill="currentColor"/></svg>';
const HOLD = 6500;        // ms each full-screen photograph stays up
const HOLD_PAGE = 12000;  // ms each opening page stays up before any scrolling (about 4 s of that is the fade)

// the three opening photographs of an album: left, middle, right
export const trio = (a) => a.trio?.length === 3 ? a.trio : [a.cover, a.hero || a.featured[0] || a.cover, a.featured[1] || a.cover];

export function mountHero(el, albums, onChange = () => {}) {
  const list = albums.filter((a) => a.selected && (a.hero || a.featured[0] || a.cover));
  if (!list.length) { el.hidden = true; return { setActive() {}, list }; }
  const meta = (a) => [a.type, a.venue].filter(Boolean).join(' · ');
  const src = (a) => trio(a)[1];
  el.insertAdjacentHTML('beforeend', `
    <div class="slides">${list.map((a, i) => `<a class="slide${i ? '' : ' on'}" href="#/album/${esc(a.slug)}" ${i ? 'tabindex="-1" aria-hidden="true"' : ''}
      aria-label="${esc(a.title)}, ${esc(meta(a))}: open the album">
      <img alt="" ${i ? `data-src="${esc(src(a))}"` : `src="${esc(src(a))}" fetchpriority="high"`} decoding="async" style="object-position:${esc(a.focus || '50% 40%')}"></a>`).join('')}</div>
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="hero-foot">
      <p class="hero-caption"><a href="#/album/${esc(list[0].slug)}"><b></b><span></span></a></p>
      ${list.length > 1 ? `<div class="hero-ctrl">
        <button type="button" class="hero-pause" aria-label="Pause the slideshow">${PAUSE}</button>
        <ol class="ticks">${list.map((a, i) => `<li><button type="button" class="tick${i ? '' : ' on'}" aria-label="Show ${esc(a.title)}"${i ? '' : ' aria-current="true"'}><i></i></button></li>`).join('')}</ol>
      </div>` : ''}
    </div>`);
  const slides = [...el.querySelectorAll('.slide')], ticks = [...el.querySelectorAll('.tick')];
  const cap = el.querySelector('.hero-caption a'), pauseBtn = el.querySelector('.hero-pause');
  let i = 0, userPaused = false, onScreen = true, tabShown = !document.hidden, active = true, held = false, hold = HOLD, elapsed = 0, last = 0;

  const write = () => { cap.href = '#/album/' + list[i].slug; cap.querySelector('b').textContent = list[i].title; cap.querySelector('span').textContent = meta(list[i]); };
  write();
  // the other photographs wait until the first has arrived
  const first = slides[0].querySelector('img');
  const loadRest = () => slides.slice(1).forEach((s) => { const im = s.querySelector('img'); if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } });
  first.complete ? loadRest() : first.addEventListener('load', loadRest, { once: true }); setTimeout(loadRest, 2500);

  function go(n) {
    n = (n + list.length) % list.length; elapsed = 0; if (n === i) return;
    slides[i].classList.remove('on'); slides[i].tabIndex = -1; slides[i].setAttribute('aria-hidden', 'true');
    ticks[i].classList.remove('on'); ticks[i].removeAttribute('aria-current'); ticks[i].firstElementChild.style.transform = '';
    i = n;
    slides[i].classList.add('on'); slides[i].removeAttribute('tabindex'); slides[i].removeAttribute('aria-hidden');
    ticks[i].classList.add('on'); ticks[i].setAttribute('aria-current', 'true');
    cap.classList.add('swap'); setTimeout(() => { write(); cap.classList.remove('swap'); }, reduce.matches ? 0 : 260);
    onChange(i);
  }
  // One clock: it runs whenever the photograph is on screen and nobody has paused it, and the tick shows it.
  const running = () => list.length > 1 && !userPaused && onScreen && tabShown && active && !held;
  function frame(now) {
    const dt = Math.min(now - last, 1000); last = now;
    if (running()) { elapsed += dt; if (elapsed >= hold) go(i + 1);
      ticks[i].firstElementChild.style.transform = `scaleX(${Math.min(1, elapsed / hold).toFixed(4)})`; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(frame); });
  ticks.forEach((t, n) => t.addEventListener('click', () => go(n)));
  pauseBtn?.addEventListener('click', () => { userPaused = !userPaused;
    pauseBtn.innerHTML = userPaused ? PLAY : PAUSE; pauseBtn.setAttribute('aria-label', userPaused ? 'Play the slideshow' : 'Pause the slideshow'); });
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.1 }).observe(el);
  document.addEventListener('visibilitychange', () => { tabShown = !document.hidden; });
  return { setActive(on) { active = on; }, setHold(on) { held = on; }, setPace(page) { hold = page ? HOLD_PAGE : HOLD; }, list };
}

const LINE = '<p class="intro-title"><em>Quiet, honest</em> photographs of loud, happy days.</p>';
const logo = (ink) => `<img class="intro-logo" src="../../public/assets/shawnys-logo-${ink}.png" width="1000" height="747" alt="Shawnys Captures">`;
// One page per landing album, laid out like a page of a photobook: the logo, three photographs, one line.
// `.cell.mid` is the photograph that grows. The layout class is added once the photographs' shapes are known.
function page(a) {
  const t = trio(a), img = (src) => `<img alt="" src="${esc(src)}" decoding="async">`;
  // A hairline frame round the photographs: the logo sits in the gap of its top edge, the line in the gap of its foot.
  return `<div class="page"><div class="spread"><div class="frame">
      <div class="fr-edge top"><i></i>${logo('darkroom')}<i></i></div>
      <div class="fr-mid"><div class="trio"><div class="cell">${img(t[0])}</div><div class="cell mid">${img(t[1])}</div><div class="cell">${img(t[2])}</div></div></div>
      <div class="fr-edge foot"><i></i>${LINE}<i></i></div></div></div></div>`;
}

export function mountIntro(section, hero) {
  const list = hero.list, pin = section.querySelector('.intro-pin'), heroEl = section.querySelector('.hero'), paper = section.querySelector('.intro-paper');
  const slides = heroEl.querySelector('.slides'), book = section.querySelector('.pages');
  if (!list.length || !slides) return { refresh() {}, show() {} };
  book.innerHTML = list.map(page).join('');
  const pages = [...book.children]; let at = 0;
  pages.forEach((pg, i) => { pg.classList.toggle('on', !i); pg.inert = !!i; });
  const SETTLE = 0.84, SMOOTH = 0.14, REST = 0.02;   // below REST the page counts as not yet scrolled
  let cur = -1, target = 0, g = null, ticking = false, finishFlip = null;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function measure() {
    const P = pin.getBoundingClientRect(), S = pages[at].querySelector('.cell.mid').getBoundingClientRect();
    if (!P.width || !S.width) { g = null; return; }
    const t = S.top - P.top, l = S.left - P.left;
    g = { h: P.height, t, l, r: P.width - l - S.width, b: P.height - t - S.height };
  }
  function paint(p) {
    cur = p; if (!g) return; const c = 1 - ease(p);            // c: 1 = a print in its place, 0 = the whole screen
    // the frame itself changes size, so the photograph is always cropped to fit what is showing
    slides.style.inset = `${(g.t * c).toFixed(1)}px ${(g.r * c).toFixed(1)}px ${(g.b * c).toFixed(1)}px ${(g.l * c).toFixed(1)}px`;
    document.documentElement.style.setProperty('--ui', clamp((p - 0.8) / 0.2).toFixed(3));   // the caption and the bar arrive last
    section.style.setProperty('--ink', (1 - clamp(p / 0.4)).toFixed(3));    // the page around the photograph leaves first
    section.classList.toggle('rest', p < REST);   // at rest the page shows its own photograph; the moving frame stays out of the way
    section.classList.toggle('open', p > 0.9);
    paper.inert = p > 0.4;
    hero.setHold(p >= REST && p <= 0.9);
    hero.setPace(p < REST);                        // and they change more slowly before any scrolling           // the photographs do not change while one is growing
  }
  function aim() { const run = section.offsetHeight - g.h; target = run > 1 ? clamp(scrollY / run / SETTLE) : 1; }
  function loop() {
    const k = reduce.matches ? 1 : SMOOTH;
    const next = Math.abs(target - cur) < 0.0006 ? target : cur + (target - cur) * k;
    paint(next);
    if (next !== target) requestAnimationFrame(loop); else ticking = false;
  }
  function update() {
    if (!g) return; aim();
    if (finishFlip && target >= REST) finishFlip();
    if (cur < 0) { paint(target); return; }
    if (!ticking) { ticking = true; requestAnimationFrame(loop); }
  }
  // The next album: at rest the page fades away to white and the next one, in its own layout, fades up slowly.
  // Anywhere else the pages just change places.
  function show(i) {
    if (i === at || !pages[i]) return; if (finishFlip) finishFlip();
    const from = pages[at], to = pages[i]; at = i;
    const settle = () => { finishFlip = null; from.removeEventListener('animationend', onOut); to.removeEventListener('animationend', onIn);
      from.classList.remove('on', 'out'); to.classList.remove('in'); to.classList.add('on'); from.inert = true; to.inert = false;
      measure(); if (cur >= 0) paint(cur); };
    const onOut = (e) => { if (e.target !== from) return; from.classList.remove('on', 'out'); to.classList.add('on', 'in'); measure(); };
    const onIn = (e) => { if (e.target === to) settle(); };
    if (cur >= REST || reduce.matches || !section.offsetParent) return settle();
    finishFlip = settle; from.addEventListener('animationend', onOut); to.addEventListener('animationend', onIn);
    from.classList.add('out');
  }
  const refresh = () => { if (!section.offsetParent) return; measure(); cur = -1; update(); };
  // Mostly landscape photographs stack in a column; mostly upright ones sit side by side in a row. On a phone every
  // page takes the tall column, whatever its photographs or its album's `layout` (Shawn, 2026-11-12): three upright
  // photographs side by side are too small there. Crossing the breakpoint lays the pages out again.
  const phone = matchMedia('(max-width: 599px)');
  const layouts = [];
  pages.forEach((pg, i) => {
    const imgs = [...pg.querySelectorAll('.cell img')]; let left = imgs.length, wide = 0;
    const decide = () => { const forced = ['column', 'row'].includes(list[i].layout) ? list[i].layout : null;
      const col = phone.matches || (forced || (wide * 2 > imgs.length ? 'column' : 'row')) === 'column';
      pg.classList.toggle('lay-col', col); pg.classList.toggle('lay-row', !col); pg.classList.add('ready');
      if (i === at) refresh(); };
    layouts[i] = () => { if (pg.classList.contains('ready')) decide(); };
    imgs.forEach((im) => { const done = () => { if (im.naturalWidth > im.naturalHeight) wide++; if (!--left) decide(); };
      im.complete ? done() : (im.addEventListener('load', done, { once: true }), im.addEventListener('error', done, { once: true })); });
  });
  phone.addEventListener?.('change', () => layouts.forEach((f) => f()));
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', refresh);
  document.fonts?.ready.then(refresh);
  refresh();
  return { refresh, show };
}
