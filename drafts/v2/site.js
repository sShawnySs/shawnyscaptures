// Shawnys Captures draft v0.3. One page, hash routes, everything drawn from data/site.json.
//   #/                       the opening photograph, then the tab bar with the first tab open
//   #/weddings · #/family · #/events · #/others · #/rates · #/faq     the tabs (the page stays put, the tab changes)
//   #/album/<slug>           an album              #/enquire     the enquiry form
import { mountHero, mountIntro, trio } from './landing.js';
import { mountLight } from './light.js';

const $ = (s, el = document) => el.querySelector(s);
const content = $('#content'), main = $('main'), bar = $('#bar');
let DATA;
// no-cache: always the latest albums and prices, never a copy the browser kept
try { const r = await fetch('../../data/site.json', { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status); DATA = await r.json(); }
catch (e) {
  document.body.dataset.view = 'notice';
  content.innerHTML = '<div class="container bleed notice"><h1>The albums did not load.</h1><p class="quiet">Refresh the page. If it keeps happening, write to me at <a class="link" href="mailto:shawnys.sim@gmail.com">shawnys.sim@gmail.com</a>.</p></div>';
  throw e;
}
const { albums, categories, pricing, site } = DATA; const about = DATA.about || {};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => '$' + n.toLocaleString('en-SG');
const hours = (h) => `${h} ${h === 1 ? 'hour' : 'hours'}`;
const photoCount = (a) => a.photos.length || a.count;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const ARROW = '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BACK = '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3M7 4 3 8l4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PRINTS = ['foliage', 'meadow', 'dusk', 'water'];
const printFor = (slug) => PRINTS[Math.max(0, TABS.findIndex((t) => t.slug === slug)) % PRINTS.length];

// ---------------------------------------------------------------- tabs
// The tab links are in index.html (they work before any data arrives). Categories added to site.json later join them.
const TABS = [...categories.map((c) => ({ slug: c.slug, label: c.label, cat: c })), { slug: 'rates', label: 'Rates' }, { slug: 'faq', label: 'FAQ' }];
for (const c of categories) if (!$(`#tabs a[href="#/${c.slug}"]`))
  $('#tabs a[href="#/faq"]').parentElement.insertAdjacentHTML('beforebegin', `<li><a class="tab" href="#/${esc(c.slug)}">${esc(c.label)}</a></li>`);
mountLight($('#light'), '../../public/textures/print-glow.webp');
let intro = null;
const hero = mountHero($('#hero'), albums, (i) => intro?.show(i));
intro = mountIntro($('#intro'), hero);
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const count = (n) => WORDS[n] || String(n);

// ---------------------------------------------------------------- about: set like a review
// Shawn's portrait beside a greeting and the tab's words, in the display face the Kind words section uses. Each entry in
// a tab's `messages` is a paragraph; `[words](address)` in one becomes a link (outside addresses open in a new tab).
// The words follow the open tab, with a short fade between.
let aboutFor = null;
{ const pic = $('#aboutPic');
  if (about.image) pic.innerHTML = `<img src="${esc(about.image)}" alt="Shawn Sim">`; else pic.classList.add('print', printFor(TABS[0].slug)); }
function drawAbout(slug) {
  if (aboutFor === slug) return; const first = aboutFor === null; aboutFor = slug;
  const link = (t) => esc(t).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, words, href) => /^https?:/.test(href)
    ? `<a class="link" href="${href}" target="_blank" rel="noopener">${words}<span class="visually-hidden"> (opens in a new tab)</span></a>`
    : `<a class="link" href="${href}">${words}</a>`);
  const html = ((about[slug] || about[TABS[0].slug] || {}).messages || []).map((m) => `<p>${link(m)}</p>`).join('');
  const put = () => { $('#aboutText').innerHTML = html; $('#about').classList.remove('swap'); };
  if (first || reduce.matches) return put();
  $('#about').classList.add('swap'); setTimeout(put, 220);
}

// Two shapes only in every gallery: a landscape picture takes one cell, an upright one is two cells tall.
// Each starts as landscape and is corrected once its own shape is known.
function shape() {
  content.querySelectorAll('.ph img, .tile img').forEach((img) => {
    const fit = () => { img.parentElement.classList.toggle('wide', img.naturalWidth >= img.naturalHeight); img.classList.add('ok'); };
    img.parentElement.classList.add('wide');
    img.complete && img.naturalWidth ? fit() : img.addEventListener('load', fit, { once: true });
  });
}

// ---------------------------------------------------------------- a category: its albums, as a wall of boxes
function drawCategory(cat) {
  const list = albums.filter((a) => a.category === cat.slug);
  const types = [...new Set(list.map((a) => a.type))];
  const tile = (a) => `<a class="tile wide" href="#/album/${esc(a.slug)}" data-slug="${esc(a.slug)}">
      <img src="${esc(a.hero || a.cover)}" alt="" loading="lazy" decoding="async">
      <span class="tile-cap"><b>${esc(a.title)}</b></span></a>`;
  if (!list.length) return `<section class="container bleed tab-body"><div class="empty">
      <div class="box print ${printFor(cat.slug)}" aria-hidden="true"></div>
      <div><h1>No ${esc(cat.label.toLowerCase())} albums up yet.</h1>
        <p class="quiet">Planning one? Tell me about it and I'll send recent work.</p>
        <a class="pill primary large" href="#/enquire">Ask about ${esc(cat.label.toLowerCase())} ${ARROW}</a></div></div></section>`;
  const plural = (t) => (t === 'Wedding' ? 'Wedding day' : t + 's');
  const id = (t) => 'k-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `<section class="container bleed tab-body">
    <h1 class="visually-hidden">${esc(cat.label)}</h1>
    ${types.length > 1 ? `<nav class="jump" aria-label="Kinds of album">${types.map((t) => `<button type="button" data-jump="${id(t)}">${esc(plural(t))}</button>`).join('')}</nav>` : ''}
    ${types.map((t) => `<section class="group" id="${id(t)}">
      ${types.length > 1 ? `<h2 class="group-head"><span>${esc(plural(t))}</span></h2>` : ''}
      <div class="wall">${list.filter((a) => a.type === t).map(tile).join('')}</div></section>`).join('')}
  </section>`;
}

// ---------------------------------------------------------------- rates, faq
function drawRates() {
  const pw = pricing.preWedding;
  const rows = (list, extra) => list.map((p) => `<tr><th scope="row">${hours(p.hours)}</th>
    <td>At least ${p.minImages} photographs${extra ? extra(p) : ''}<span class="quiet"> · one-week delivery, add ${money(p.expedited)}</span></td><td class="price">${money(p.price)}</td></tr>`).join('');
  const ev = pricing.events;
  return `<section class="container bleed tab-body rates">
    <h1 class="visually-hidden">Rates</h1>
    <div class="rate"><h2>Wedding day</h2><table>${rows(pricing.wedding)}</table>
      <p class="small quiet">A split day (morning and evening, with a break) adds ${money(pricing.weddingExtras.splitDay)}. Each extra hour is ${money(pricing.weddingExtras.extraHour)}.</p></div>
    <div class="rate"><h2>${esc(pw.label)}</h2><table>${rows(pw.packages, (q) => `, ${q.locations} ${q.locations === '1' ? 'location' : 'locations'}`)}</table>
      <p class="small quiet">Each extra hour is ${money(pw.extraHour)}.</p></div>
    ${ev ? `<div class="rate"><h2>${esc(ev.label)}</h2><table>${rows(ev.packages)}</table>
      <p class="small quiet">Each extra hour is ${money(ev.extraHour)}. Family sessions are quoted to fit: <a class="link" href="#/enquire">ask me</a>.</p></div>` : ''}
    <p class="small quiet">${esc(pricing.delivery.replace('; expedited is', ' for delivery. Expedited delivery is').replace('–', ' to '))}. ${esc(pricing.payment.replace('50% on', 'Half on').replace(', 50%', ', and half'))}.</p>
  </section>`;
}
const FAQ = [
  ['Is there a limit on how many photographs we get?', 'No. The number on each package is the least you will receive. I keep every photograph that is worth keeping.'],
  ['When do we get them?', `${pricing.delivery.replace('; expedited is', '. Expedited delivery is').replace('–', ' to ')}.`],
  ['Are they all edited?', 'Yes. Every photograph is edited and delivered as a high-resolution JPEG.'],
  ['Do you retouch in Photoshop?', 'Not as a rule. I edit for light and colour and leave people looking like themselves. If there is something specific you would like retouched, we can talk about it.'],
  ['Can we meet before we book?', 'I would like that. It helps to know who will be quietly following you around all day. I am happy to come to the rehearsal too.'],
  ['When do you arrive on the day?', 'About halfway through the bridal makeup, so the getting ready is part of the story.'],
  ['Our day does not fit these packages.', 'Tell me what you have in mind and I will put together something that does.'],
  ['How does payment work?', `${pricing.payment.replace('50% on', 'Half on').replace(', 50%', ', and half')}.`],
];
const drawFaq = () => `<section class="container bleed tab-body"><h1 class="visually-hidden">${count(FAQ.length)} questions, answered plainly</h1>
  <div class="faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}<i aria-hidden="true"></i></summary><p class="quiet">${esc(a)}</p></details>`).join('')}</div></section>`;

// ---------------------------------------------------------------- reviews: clients' own words (Weddings and Rates)
// A short pull-out from each, with the whole review a click away when there is more. Kept exactly as written.
function drawReviews() {
  const list = DATA.reviews?.items || []; if (!list.length) return '';
  const para = (t) => t.split(/\n\n+/).map((x) => `<p>${esc(x)}</p>`).join('');
  return `<section class="container bleed reviews" aria-labelledby="reviewsHead">
    <h2 class="group-head" id="reviewsHead"><span>Kind words</span></h2>
    <div class="review-list">${list.map((r, i) => `<figure class="review">
      <blockquote><p>“${esc(r.quote)}”</p></blockquote>
      <figcaption><span class="review-pic box${r.image ? '' : ' print ' + PRINTS[i % PRINTS.length]}">${r.image ? `<img src="${esc(r.image)}" alt="" loading="lazy">` : ''}</span>
        <span><b>${esc(r.who || '')}</b>${r.context ? `<span>${esc(r.context)}</span>` : ''}</span></figcaption>
      ${r.full ? `<details><summary>Read the whole review</summary><div class="review-full">${para(r.full)}</div></details>` : ''}
    </figure>`).join('')}</div></section>`;
}

// ---------------------------------------------------------------- album
function drawAlbum(a) {
  const full = a.photos.length > 0;
  const photos = full ? a.photos : [...new Set([a.cover, ...a.featured].filter(Boolean))];
  const chapters = a.chapters.length ? a.chapters : [{ start: 0, end: photos.length, title: null }];
  const siblings = albums.filter((x) => x.category === a.category);
  const next = siblings[(siblings.indexOf(a) + 1) % siblings.length];
  const cat = categories.find((c) => c.slug === a.category);
  content.innerHTML = `<article class="container bleed album">
    <a class="back" href="#/${esc(cat.slug)}" data-cursor="back">${BACK} ${esc(cat.label)}</a>
    <header class="cover box"><img src="${esc(a.hero || a.cover)}" alt="" style="object-position:${esc(a.focus || '50% 50%')}">
      <div class="cover-cap"><h1>${esc(a.title)}</h1>
        <p>${esc([a.type, a.venue, a.date, photoCount(a) + ' photographs'].filter(Boolean).join(' · '))}</p></div></header>
    ${a.story ? `<p class="story">${esc(a.story)}</p>` : ''}
    ${full ? '' : `<p class="note small quiet">Draft: only ${photos.length} of this album's ${a.count} photographs are in so far.</p>`}
    ${chapters.map((c) => `<section class="scene">${c.title ? `<h2 class="group-head"><span>${esc(c.title)}</span></h2>` : ''}
      <div class="rows">${photos.slice(c.start, c.end).map((p, k) => `<button type="button" class="ph" data-cursor="view" data-i="${c.start + k}" aria-label="Open photograph ${c.start + k + 1} of ${photos.length}">
        <img src="${esc(p)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div></section>`).join('')}
    ${next && next !== a ? `<a class="next box" href="#/album/${esc(next.slug)}"><img src="${esc(next.cover)}" alt="" loading="lazy">
      <span><span class="small quiet">Next album</span><b>${esc(next.title)}</b></span>${ARROW}</a>` : ''}
  </article>`;
  shape();
  content.querySelectorAll('.ph').forEach((el) => el.onclick = () => openViewer(photos, +el.dataset.i, a, el));
}

// ---------------------------------------------------------------- enquire
function drawEnquire() {
  // the label and its hint share one line, so the inputs in a row line up
  const field = (name, label, hint, attrs = '') => `<label class="half"><span class="lab">${label}${hint ? ` <span>${hint}</span>` : ''}</span><input name="${name}" ${attrs}><small class="err" aria-live="polite"></small></label>`;
  content.innerHTML = `<section class="container bleed enquire">
    <div><h1>The date, the place, and who’s in the picture.</h1>
      <p class="quiet">I read every message myself.</p>
      <p class="quiet">Rather write directly? Email <a class="link" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
        or message me on <a class="link" href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram<span class="visually-hidden"> (opens in a new tab)</span></a>.</p></div>
    <form class="enquiry" id="enquiry" novalidate>
      ${field('name', 'Your name', '', 'autocomplete="name" required data-miss="Add your name so I know who is writing."')}
      ${field('partner', "Partner's name", 'if there is one')}
      ${field('email', 'Email', '', 'type="email" autocomplete="email" required data-miss="Add an email address so I can reply." data-bad="That email address looks incomplete."')}
      ${field('phone', 'Phone or Telegram', 'optional', 'autocomplete="tel"')}
      <fieldset><legend>What is it for?</legend><div class="choices">${['Wedding day', 'Pre-wedding', 'Both', 'Family', 'Event', 'Something else'].map((t, i) =>
        `<label><input type="radio" name="kind" value="${t}"${i ? '' : ' checked'}><span class="pill">${t}</span></label>`).join('')}</div></fieldset>
      ${field('date', 'Date', 'a rough one is fine', 'placeholder="14 June 2027"')}
      ${field('found', 'How did you find me?', 'optional')}
      <label><span class="lab">About the day, and the people in it</span><textarea name="message" required data-miss="Write a line or two about the day."></textarea><small class="err" aria-live="polite"></small></label>
      <div class="send"><button class="pill primary large" type="submit">Send enquiry</button>
        <p class="small quiet" id="sendNote" aria-live="polite">Sending opens your email app with this message written out, ready to send.</p></div>
    </form></section>`;
  const form = $('#enquiry');
  const check = (el) => { const bad = !el.validity.valid; const msg = bad ? (el.validity.valueMissing ? el.dataset.miss : el.dataset.bad) || 'Check this field.' : '';
    el.setAttribute('aria-invalid', String(bad)); el.parentElement.querySelector('.err').textContent = msg; return !bad; };
  form.addEventListener('focusout', (e) => { if (e.target.matches('input[required], textarea[required]') && e.target.value) check(e.target); });
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') check(e.target); });
  form.onsubmit = (e) => {
    e.preventDefault();
    const bad = [...form.querySelectorAll('[required]')].filter((el) => el.type !== 'radio' && !check(el));
    if (bad.length) { bad[0].focus(); return; }
    const f = Object.fromEntries(new FormData(form));
    const body = [`Name: ${f.name}`, f.partner && `Partner: ${f.partner}`, `Email: ${f.email}`, f.phone && `Phone / Telegram: ${f.phone}`, `For: ${f.kind}`,
      f.date && `Date: ${f.date}`, f.found && `Found you through: ${f.found}`, '', f.message].filter((l) => l !== undefined && l !== false && l !== null).join('\n');
    $('#sendNote').textContent = `Opening your email app. If nothing opens, write to ${site.email}.`; $('#sendNote').classList.add('sent');
    location.href = `mailto:${site.email}?subject=${encodeURIComponent(`${f.kind} enquiry from ${f.name}`)}&body=${encodeURIComponent(body)}`;
  };
}

// ---------------------------------------------------------------- viewer
const viewer = $('#viewer'), vImg = $('#vImg'); let vList = [], vI = 0, vAlbum = null, vFrom = null;
function openViewer(list, i, a, from) { vList = list; vI = i; vAlbum = a; vFrom = from; show(); viewer.classList.add('open'); document.body.classList.add('locked'); $('#vClose').focus(); }
function show() {
  viewer.classList.add('wait'); vImg.style.opacity = 0; const src = vList[vI]; const tmp = new Image();
  tmp.onload = () => { if (vList[vI] === src) { vImg.src = src; vImg.style.opacity = 1; viewer.classList.remove('wait'); } };
  tmp.onerror = () => { if (vList[vI] === src) { viewer.classList.remove('wait'); $('#vCount').textContent = `${vI + 1} / ${vList.length} · this photograph did not load`; } }; tmp.src = src;
  vImg.alt = `${vAlbum.title}, photograph ${vI + 1} of ${vList.length}`; $('#vTitle').textContent = vAlbum.title; $('#vCount').textContent = `${vI + 1} / ${vList.length}`;
  [vList[vI + 1], vList[vI - 1]].forEach((s) => { if (s) new Image().src = s; });
}
const step = (d) => { vI = (vI + d + vList.length) % vList.length; show(); };
const closeViewer = () => { viewer.classList.remove('open'); document.body.classList.remove('locked'); vFrom?.focus?.(); };
$('#vPrev').onclick = () => step(-1); $('#vNext').onclick = () => step(1); $('#vClose').onclick = closeViewer;
viewer.querySelectorAll('.v-zone').forEach((z) => z.onclick = () => step(z.dataset.cursor === 'next' ? 1 : -1));
let tx = null; viewer.addEventListener('touchstart', (e) => tx = e.touches[0].clientX, { passive: true });
viewer.addEventListener('touchend', (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; });
addEventListener('keydown', (e) => {
  if (!viewer.classList.contains('open')) return;
  if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'Tab') { const b = [...viewer.querySelectorAll('button')].filter((x) => x.offsetParent); const i = b.indexOf(document.activeElement);
    e.preventDefault(); b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus(); }
});

// ---------------------------------------------------------------- footer + router
// The footer, as the design portfolio's: lower-case text links, ↗ on those that leave the site.
const DESIGN = 'https://shawn-sim-designs.vercel.app/';
$('#footLinks').innerHTML = [['rates', '#/rates'], ['faq', '#/faq'], ['enquire', '#/enquire'],
  ['email', 'mailto:' + site.email, 'mail'], ['instagram', site.instagram, 'out'], ['design work', DESIGN, 'out']]
  .map(([label, href, kind]) => `<li><a href="${esc(href)}"${kind === 'out' ? ' target="_blank" rel="noopener"' : ''}>${kind ? '<span aria-hidden="true">↗︎&#8239;</span>' : ''}${esc(label)}${kind === 'out' ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ''}</a></li>`).join('');
// "let's ...": types each phrase, holds it, takes it back and types the next; pauses while the footer is off screen.
// Under reduced motion the first phrase stands still. Timings are the design portfolio's.
{
  const typed = $('[data-phrases]'), out = typed?.querySelector('[data-type]');
  let phrases = []; try { phrases = JSON.parse(typed.dataset.phrases); } catch { /* keeps the first */ }
  if (out && !reduce.matches && phrases.length > 1) {
    let i = 0, n = phrases[0].length, deleting = true, timer = 0, visible = false;
    const schedule = (ms) => { clearTimeout(timer); if (visible) timer = setTimeout(step, ms); };
    function step() {
      if (deleting) {
        n--; if (n <= 0) { deleting = false; i = (i + 1) % phrases.length; n = 0; }
        out.textContent = phrases[deleting ? i : (i - 1 + phrases.length) % phrases.length].slice(0, n);
        return schedule(deleting ? 38 : 300);
      }
      n++; out.textContent = phrases[i].slice(0, n);
      if (n >= phrases[i].length) { deleting = true; return schedule(2600); }
      schedule(75);
    }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) schedule(1800); else clearTimeout(timer); }).observe(typed);
  }
}
content.addEventListener('click', (e) => { const j = e.target.closest('[data-jump]'); if (!j) return;
  document.getElementById(j.dataset.jump)?.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); });
// ---------------------------------------------------------------- the bar
// On the opening it is the strip on the full-screen photograph; as the photograph scrolls away it fills in to the
// tab bar (--bar 0 to 1). Everywhere else it is the tab bar from the start.
const introEl = $('#intro'), pinEl = $('.intro-pin'), tabsWrap = $('.tabs-wrap'), strip = $('.bar nav');
const clamp = (v) => Math.min(1, Math.max(0, v));
let barT = -1, barTick = false, peeked = false;
[...$('#tabs').children].forEach((li, i) => li.style.setProperty('--i', i));
// --tabs-w: how wide the categories are when open; --lead, --trail: on a phone, how far they start and end inside
// the top layer (the logo, and Rates with Enquire) that they slide under
const measureTabs = () => { tabsWrap.style.setProperty('--tabs-w', $('#tabs').scrollWidth + 'px');
  bar.style.setProperty('--lead', $('.bar-logo').offsetWidth + 'px'); bar.style.setProperty('--trail', $('.bar-end').offsetWidth + 'px'); };
// which sides have categories out of sight (the fade on a desktop, the shade on a phone)
function edges() {
  const max = strip.scrollWidth - strip.clientWidth;
  tabsWrap.classList.toggle('more-l', strip.scrollLeft > 2);
  tabsWrap.classList.toggle('more-r', strip.scrollLeft < max - 2);
}
function paintBar() {
  barTick = false; let t = 1;
  if (document.body.dataset.view === 'home') {
    const pin = pinEl.offsetHeight, run = introEl.offsetHeight - pin;
    const x = clamp((scrollY - run) / Math.max(1, pin - bar.offsetHeight)); t = x * x * (3 - 2 * x);
  }
  t = +t.toFixed(3); if (t === barT) return; barT = t;
  bar.style.setProperty('--bar', t);
  tabsWrap.inert = t < 0.5;
  edges();
  // the first time the categories have room to scroll, they slide a little way and back, to show they can
  if (t === 1 && !peeked && strip.scrollWidth > strip.clientWidth + 2 && !reduce.matches) {
    peeked = true;
    setTimeout(() => { if (strip.scrollLeft) return; strip.scrollTo({ left: 56 }); setTimeout(() => strip.scrollTo({ left: 0 }), 650); }, 500);
  }
}
// The soft edges (index.html) wait until the page has moved: on the opening, until the photograph starts to leave.
const edges2 = () => document.documentElement.classList.toggle('edges', document.body.dataset.view === 'home' ? barT > 0 : scrollY >= 1);
const queueBar = () => { if (!barTick) { barTick = true; requestAnimationFrame(() => { paintBar(); edges2(); }); } };
addEventListener('scroll', queueBar, { passive: true });
addEventListener('resize', () => { measureTabs(); barT = -1; queueBar(); });
document.fonts?.ready.then(() => { measureTabs(); barT = -1; queueBar(); });
measureTabs();
strip.addEventListener('scroll', edges, { passive: true });

// ---------------------------------------------------------------- album boxes: a short slideshow while the pointer rests
function slideshow(tile) {
  const a = albums.find((x) => x.slug === tile.dataset.slug);
  const srcs = [...new Set([a.hero || a.cover, ...trio(a), ...a.featured, ...a.photos].filter(Boolean))].slice(0, 8);
  if (srcs.length < 2) return;
  let layer = null, ticks = [], i = 0, timer = 0;
  const build = () => {
    tile.insertAdjacentHTML('beforeend', `<span class="tile-slides" aria-hidden="true">${srcs.slice(1).map((src) => `<img alt="" src="${esc(src)}" decoding="async">`).join('')}</span>
      <span class="tile-ticks" aria-hidden="true">${srcs.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</span>`);
    layer = [null, ...tile.querySelectorAll('.tile-slides img')]; ticks = [...tile.querySelectorAll('.tile-ticks i')];
  };
  const go = (n) => { layer[i]?.classList.remove('on'); ticks[i].classList.remove('on'); i = n; layer[i]?.classList.add('on'); ticks[i].classList.add('on'); };
  const next = () => { const n = (i + 1) % srcs.length;   // waits on a photograph that has not arrived yet
    if (!layer[n] || layer[n].complete) go(n); timer = setTimeout(next, layer[n] && !layer[n].complete ? 200 : 1300); };
  tile.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch' || reduce.matches) return;
    if (!layer) build(); tile.classList.add('playing'); clearTimeout(timer); timer = setTimeout(next, 600);
  });
  tile.addEventListener('pointerleave', () => { if (!layer) return; clearTimeout(timer); tile.classList.remove('playing'); go(0); });
}

let prevView = null;
function route() {
  const [, a = '', b = ''] = location.hash.match(/^#\/([^/]*)\/?(.*)$/) || [];
  const tab = TABS.find((t) => t.slug === a) || (!a || a === 'about' ? TABS[0] : null);
  const album = a === 'album' && albums.find((x) => x.slug === decodeURIComponent(b));
  let view = 'notice', title = 'Not found';
  if (tab) { view = 'home'; title = tab.label; drawAbout(tab.slug);
    content.innerHTML = (tab.cat ? drawCategory(tab.cat) : tab.slug === 'rates' ? drawRates() : drawFaq())
      + (['weddings', 'rates'].includes(tab.slug) ? drawReviews() : ''); shape();
    content.querySelectorAll('.tile[data-slug]').forEach(slideshow); }
  else if (album) { view = 'album'; title = album.title; drawAlbum(album); }
  else if (a === 'enquire') { view = 'enquire'; title = 'Enquire'; drawEnquire(); }
  else content.innerHTML = `<div class="container bleed notice"><h1>That page isn't here.</h1>
    <p class="quiet">Renamed or taken down, most likely. The albums are all still here.</p><a class="pill primary large" href="#/${esc(TABS[0].slug)}">See the albums ${ARROW}</a></div>`;
  document.body.dataset.view = view; hero.setActive(view === 'home'); if (view === 'home') intro.refresh();
  document.title = !a ? 'Shawnys Captures · Wedding photography in Singapore' : `${title} · Shawnys Captures`;
  const current = '#/' + (tab ? tab.slug : album ? album.category : a);
  document.querySelectorAll('.bar .tab').forEach((l) => l.getAttribute('href') === current ? l.setAttribute('aria-current', 'page') : l.removeAttribute('aria-current'));
  const cur = $('#tabs [aria-current]'), strip = $('.bar nav'); // keep the open tab in view in the strip, without moving the page
  if (cur) { strip.style.scrollBehavior = 'auto'; strip.scrollLeft = Math.max(0, cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2); strip.style.scrollBehavior = ''; }
  $('#closing').hidden = view === 'enquire' || view === 'notice';
  const cl = DATA.closing || {};   // the dark card: one heading, a line that fits the page
  const own = cl[tab ? tab.slug : album ? 'album' : ''];   // a line, or { heading, text } for both
  $('#closingHead').textContent = own?.heading || cl.heading || '';
  $('#closingText').textContent = (typeof own === 'string' ? own : own?.text) || cl.default || '';
  viewer.classList.remove('open'); document.body.classList.remove('locked');
  content.classList.remove('in'); void content.offsetWidth; content.classList.add('in');
  // Where the page sits: a tab opened from the bar keeps the bar in place; a tab opened from elsewhere lands on
  // the bar; the bare address shows the opening photograph; albums and the form start at the top.
  if (view !== 'home') scrollTo(0, 0);
  else if (!a) { if (prevView !== null) scrollTo(0, 0); }
  else { const top = $('#intro').offsetHeight; scrollTo({ top, behavior: prevView === 'home' && scrollY < top && !reduce.matches ? 'smooth' : 'auto' }); }
  prevView = view; barT = -1; paintBar(); edges2();
}
addEventListener('hashchange', () => { route(); main.focus({ preventScroll: true }); });
route();
