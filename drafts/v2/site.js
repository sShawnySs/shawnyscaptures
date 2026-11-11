// Shawnys Captures draft v0.3. One page, hash routes, everything drawn from data/site.json.
//   #/                       the opening photograph, then the tab bar with the first tab open
//   #/weddings · #/family · #/events · #/others · #/rates · #/faq     the tabs (the page stays put, the tab changes)
//   #/album/<slug>           an album              #/enquire     the enquiry form
import { mountHero, mountIntro } from './landing.js';

const $ = (s, el = document) => el.querySelector(s);
const content = $('#content'), main = $('main'), bar = $('#bar');
let DATA;
try { const r = await fetch('../../data/site.json'); if (!r.ok) throw new Error(r.status); DATA = await r.json(); }
catch (e) {
  document.body.dataset.view = 'notice';
  content.innerHTML = '<div class="container notice"><h1>The albums did not load.</h1><p class="quiet">Refresh the page. If it keeps happening, write to me at <a class="link" href="mailto:shawnys.sim@gmail.com">shawnys.sim@gmail.com</a>.</p></div>';
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
  $('#tabs a[href="#/rates"]').parentElement.insertAdjacentHTML('beforebegin', `<li><a class="tab" href="#/${esc(c.slug)}">${esc(c.label)}</a></li>`);
let intro = null;
const hero = mountHero($('#hero'), albums, (i) => intro?.show(i));
intro = mountIntro($('#intro'), hero);
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const count = (n) => WORDS[n] || String(n);

// ---------------------------------------------------------------- about: the same small section, retold for each tab
let aboutFor = null;
function drawAbout(slug) {
  if (aboutFor === slug) return; const first = aboutFor === null; aboutFor = slug;
  const a = about[slug] || about[TABS[0].slug] || {}; const pic = $('#aboutPic'), text = $('#aboutText');
  const put = () => {
    text.textContent = a.text || '';
    pic.className = 'about-pic box' + (a.image ? '' : ' print ' + printFor(slug));
    pic.innerHTML = a.image ? `<img src="${esc(a.image)}" alt="Shawn Sim">` : '';
    $('#about').classList.remove('swap');
  };
  if (first || reduce.matches) return put();
  $('#about').classList.add('swap'); setTimeout(put, 220);
}

// ---------------------------------------------------------------- a category: its albums, as a wall of boxes
function drawCategory(cat) {
  const list = albums.filter((a) => a.category === cat.slug);
  const types = [...new Set(list.map((a) => a.type))];
  const tile = (a) => `<a class="tile box" href="#/album/${esc(a.slug)}">
      <img src="${esc(a.hero || a.cover)}" alt="" loading="lazy" decoding="async">
      <span class="tile-cap"><b>${esc(a.title)}</b><span>${esc([types.length > 1 ? null : a.type, a.venue].filter(Boolean).join(' · '))}</span></span></a>`;
  if (!list.length) return `<section class="container tab-body"><div class="empty">
      <div class="box print ${printFor(cat.slug)}" aria-hidden="true"></div>
      <div><h1>No ${esc(cat.label.toLowerCase())} albums up yet.</h1>
        <p class="quiet">Planning one? Tell me about it and I'll send recent work.</p>
        <a class="pill primary large" href="#/enquire">Ask about ${esc(cat.label.toLowerCase())} ${ARROW}</a></div></div></section>`;
  const plural = (t) => (t === 'Wedding' ? 'Wedding days' : t + 's');
  const id = (t) => 'k-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `<section class="container tab-body">
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
  const low = (l) => money(Math.min(...l.map((p) => p.price)));
  return `<section class="container tab-body rates">
    <h1>Wedding days from ${low(pricing.wedding)}, pre‑weddings from ${low(pw.packages)}.</h1>
    <div class="rate box"><h2>Wedding day</h2><table>${rows(pricing.wedding)}</table>
      <p class="small quiet">A split day (morning and evening, with a break) adds ${money(pricing.weddingExtras.splitDay)}. Each extra hour is ${money(pricing.weddingExtras.extraHour)}.</p></div>
    <div class="rate box"><h2>${esc(pw.label)}</h2><table>${rows(pw.packages, (q) => `, ${q.locations} ${q.locations === '1' ? 'location' : 'locations'}`)}</table>
      <p class="small quiet">Each extra hour is ${money(pw.extraHour)}. Family sessions and events are quoted to fit: <a class="link" href="#/enquire">ask me</a>.</p></div>
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
const drawFaq = () => `<section class="container tab-body"><h1>${count(FAQ.length)} questions, answered plainly.</h1>
  <div class="faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}<i aria-hidden="true"></i></summary><p class="quiet">${esc(a)}</p></details>`).join('')}</div></section>`;

// ---------------------------------------------------------------- album
function drawAlbum(a) {
  const full = a.photos.length > 0;
  const photos = full ? a.photos : [...new Set([a.cover, ...a.featured].filter(Boolean))];
  const chapters = a.chapters.length ? a.chapters : [{ start: 0, end: photos.length, title: null }];
  const siblings = albums.filter((x) => x.category === a.category);
  const next = siblings[(siblings.indexOf(a) + 1) % siblings.length];
  const cat = categories.find((c) => c.slug === a.category);
  content.innerHTML = `<article class="container album">
    <a class="back" href="#/${esc(cat.slug)}">${BACK} ${esc(cat.label)}</a>
    <header class="cover box"><img src="${esc(a.hero || a.cover)}" alt="" style="object-position:${esc(a.focus || '50% 50%')}">
      <div class="cover-cap"><h1>${esc(a.title)}</h1>
        <p>${esc([a.type, a.venue, a.date, photoCount(a) + ' photographs'].filter(Boolean).join(' · '))}</p></div></header>
    ${a.story ? `<p class="story">${esc(a.story)}</p>` : ''}
    ${full ? '' : `<p class="note small quiet">Draft: only ${photos.length} of this album's ${a.count} photographs are in so far.</p>`}
    ${chapters.map((c) => `<section class="scene">${c.title ? `<h2 class="group-head"><span>${esc(c.title)}</span></h2>` : ''}
      <div class="rows">${photos.slice(c.start, c.end).map((p, k) => `<button type="button" class="ph" data-i="${c.start + k}" aria-label="Open photograph ${c.start + k + 1} of ${photos.length}">
        <img src="${esc(p)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div></section>`).join('')}
    ${next && next !== a ? `<a class="next box" href="#/album/${esc(next.slug)}"><img src="${esc(next.cover)}" alt="" loading="lazy">
      <span><span class="small quiet">Next album</span><b>${esc(next.title)}</b></span>${ARROW}</a>` : ''}
  </article>`;
  // each photograph keeps its own shape; rows are filled edge to edge (the widths follow --ar)
  content.querySelectorAll('.ph img').forEach((img) => {
    const fit = () => { img.parentElement.style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(3)); img.classList.add('ok'); };
    img.complete && img.naturalWidth ? fit() : img.addEventListener('load', fit, { once: true });
  });
  content.querySelectorAll('.ph').forEach((el) => el.onclick = () => openViewer(photos, +el.dataset.i, a, el));
}

// ---------------------------------------------------------------- enquire
function drawEnquire() {
  const field = (name, label, hint, attrs = '') => `<label class="half">${label}${hint ? ` <span>${hint}</span>` : ''}<input name="${name}" ${attrs}><small class="err" aria-live="polite"></small></label>`;
  content.innerHTML = `<section class="container enquire">
    <div><h1>The date, the place, and a little about you two.</h1>
      <p class="quiet">I read every message myself. Rather write directly? <a class="link" href="mailto:${esc(site.email)}">${esc(site.email)}</a></p></div>
    <form class="enquiry" id="enquiry" novalidate>
      ${field('name', 'Your name', '', 'autocomplete="name" required data-miss="Add your name so I know who is writing."')}
      ${field('partner', "Your partner's name", 'if there is one')}
      ${field('email', 'Email', '', 'type="email" autocomplete="email" required data-miss="Add an email address so I can reply." data-bad="That email address looks incomplete."')}
      ${field('phone', 'Phone or Telegram', 'optional', 'autocomplete="tel"')}
      <fieldset><legend>What is it for?</legend><div class="choices">${['Wedding day', 'Pre-wedding', 'Both', 'Family', 'Event', 'Something else'].map((t, i) =>
        `<label><input type="radio" name="kind" value="${t}"${i ? '' : ' checked'}><span class="pill">${t}</span></label>`).join('')}</div></fieldset>
      ${field('date', 'Date', 'a rough one is fine', 'placeholder="14 June 2027"')}
      ${field('found', 'How did you find me?', 'optional')}
      <label>About the day, and about you<textarea name="message" required data-miss="Write a line or two about the day."></textarea><small class="err" aria-live="polite"></small></label>
      <div class="send"><button class="pill primary large" type="submit">Send enquiry</button>
        <p class="small quiet" id="sendNote" aria-live="polite">Draft: sending opens your email app with this message written out.</p></div>
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
let tx = null; viewer.addEventListener('touchstart', (e) => tx = e.touches[0].clientX, { passive: true });
viewer.addEventListener('touchend', (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; });
addEventListener('keydown', (e) => {
  if (!viewer.classList.contains('open')) return;
  if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'Tab') { const b = [...viewer.querySelectorAll('button')].filter((x) => x.offsetParent); const i = b.indexOf(document.activeElement);
    e.preventDefault(); b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus(); }
});

// ---------------------------------------------------------------- footer + router
$('#footLinks').innerHTML = [...TABS.map((t) => [t.label, '#/' + t.slug]), ['Enquire', '#/enquire']].map((n) => `<a href="${n[1]}">${esc(n[0])}</a>`).join('')
  + `<a href="mailto:${esc(site.email)}">Email</a><a href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram<span class="visually-hidden"> (opens in a new tab)</span></a>`;
content.addEventListener('click', (e) => { const j = e.target.closest('[data-jump]'); if (!j) return;
  document.getElementById(j.dataset.jump)?.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); });
// the bar draws its bottom rule only once it is stuck
new IntersectionObserver(([e]) => bar.classList.toggle('stuck', e.intersectionRatio < 1), { threshold: 1, rootMargin: '-1px 0px 0px 0px' }).observe(bar);

let prevView = null;
function route() {
  const [, a = '', b = ''] = location.hash.match(/^#\/([^/]*)\/?(.*)$/) || [];
  const tab = TABS.find((t) => t.slug === a) || (!a || a === 'about' ? TABS[0] : null);
  const album = a === 'album' && albums.find((x) => x.slug === decodeURIComponent(b));
  let view = 'notice', title = 'Not found';
  if (tab) { view = 'home'; title = tab.label; drawAbout(tab.slug);
    content.innerHTML = tab.cat ? drawCategory(tab.cat) : tab.slug === 'rates' ? drawRates() : drawFaq(); }
  else if (album) { view = 'album'; title = album.title; drawAlbum(album); }
  else if (a === 'enquire') { view = 'enquire'; title = 'Enquire'; drawEnquire(); }
  else content.innerHTML = `<div class="container notice"><h1>That page isn't here.</h1>
    <p class="quiet">Renamed or taken down, most likely. The albums are all still here.</p><a class="pill primary large" href="#/${esc(TABS[0].slug)}">See the albums ${ARROW}</a></div>`;
  document.body.dataset.view = view; hero.setActive(view === 'home'); if (view === 'home') intro.refresh();
  document.title = !a ? 'Shawnys Captures · Wedding photography in Singapore' : `${title} · Shawnys Captures`;
  const current = '#/' + (tab ? tab.slug : album ? album.category : a);
  document.querySelectorAll('#tabs a').forEach((l) => l.getAttribute('href') === current ? l.setAttribute('aria-current', 'page') : l.removeAttribute('aria-current'));
  const cur = $('#tabs [aria-current]'), strip = $('.bar nav'); // keep the open tab in view in the strip, without moving the page
  if (cur) strip.scrollLeft = Math.max(0, cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2);
  $('#closing').hidden = view === 'enquire' || view === 'notice';
  viewer.classList.remove('open'); document.body.classList.remove('locked');
  content.classList.remove('in'); void content.offsetWidth; content.classList.add('in');
  // Where the page sits: a tab opened from the bar keeps the bar in place; a tab opened from elsewhere lands on
  // the bar; the bare address shows the opening photograph; albums and the form start at the top.
  if (view !== 'home') scrollTo(0, 0);
  else if (!a) { if (prevView !== null) scrollTo(0, 0); }
  else { const top = $('#intro').offsetHeight; scrollTo({ top, behavior: prevView === 'home' && scrollY < top && !reduce.matches ? 'smooth' : 'auto' }); }
  prevView = view;
}
addEventListener('hashchange', () => { route(); main.focus({ preventScroll: true }); });
route();
