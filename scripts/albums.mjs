#!/usr/bin/env node
// Add, remove and reorder albums in data/site.json. No dependencies.
//
//   node scripts/albums.mjs                 open the album manager in the browser (http://localhost:4342)
//   node scripts/albums.mjs list
//   node scripts/albums.mjs add --title "Ana & Ben" --category weddings --type Wedding \
//        --venue "Fort Canning Park" --photos public/photos/ana-ben        (a folder, or a .txt of URLs)
//   node scripts/albums.mjs remove <slug>
//   node scripts/albums.mjs landing <slug> on|off     show or hide it on the landing page
//   node scripts/albums.mjs move <slug> <position>    1 = first
//
// Every change first copies the current file to data/site.backup.json, so the last change can be undone
// with: cp data/site.backup.json data/site.json
import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'data', 'site.json');
const BACKUP = join(ROOT, 'data', 'site.backup.json');
const IMG = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const load = () => JSON.parse(readFileSync(FILE, 'utf8'));
const save = (d) => { copyFileSync(FILE, BACKUP); writeFileSync(FILE, JSON.stringify(d, null, 2) + '\n'); };
const slugify = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fail = (m) => { throw new Error(m); };

/** A folder inside the project (photos sorted by name), a .txt of URLs, or a list of URLs/paths. */
function readPhotos(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src.map((s) => s.trim()).filter(Boolean);
  const abs = join(ROOT, src);
  if (existsSync(abs) && statSync(abs).isDirectory()) {
    return readdirSync(abs).filter((f) => IMG.has(extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => '/' + relative(ROOT, join(abs, f)).split('\\').join('/'));
  }
  if (existsSync(abs)) return readPhotos(readFileSync(abs, 'utf8').split('\n'));
  return readPhotos(String(src).split(/[\n,]/));
}

function add(d, o) {
  const title = (o.title || '').trim() || fail('An album needs a title.');
  const category = o.category || 'weddings';
  d.categories.some((c) => c.slug === category)
    || fail(`Unknown category "${category}". Use one of: ${d.categories.map((c) => c.slug).join(', ')}.`);
  let slug = slugify(o.slug || title) || fail('Could not make a web address from that title.');
  if (d.albums.some((a) => a.slug === slug)) slug += '-' + slugify(o.type || category);
  d.albums.some((a) => a.slug === slug) && fail(`An album called "${slug}" already exists.`);
  const photos = readPhotos(o.photos);
  const venues = (o.venue || '').split(/\s*[;,]\s*/).filter(Boolean);
  const cover = o.cover || photos[0] || null;
  const album = {
    slug, title, category,
    type: o.type || d.categories.find((c) => c.slug === category).label.replace(/s$/, ''),
    hero: o.hero || cover, focus: o.focus || '50% 40%',
    venue: venues.join(', ') || null, venues,
    date: o.date || null, count: photos.length,
    selected: o.landing === true || o.landing === 'on' || o.landing === 'true',
    story: o.story || null, accentFallback: null,
    cover, featured: photos.filter((p) => p !== cover).slice(0, 2),
    photos, chapters: [],
  };
  d.albums.unshift(album); // newest first
  return album;
}
const find = (d, slug) => d.albums.find((a) => a.slug === slug) || fail(`No album called "${slug}".`);
const remove = (d, slug) => { const a = find(d, slug); d.albums = d.albums.filter((x) => x !== a); return a; };
const landing = (d, slug, on) => { const a = find(d, slug); a.selected = on; return a; };
function move(d, slug, pos) {
  const a = find(d, slug);
  d.albums = d.albums.filter((x) => x !== a);
  d.albums.splice(Math.max(0, Math.min(d.albums.length, pos - 1)), 0, a);
  return a;
}

// ---------------------------------------------------------------- command line
const [cmd, ...rest] = process.argv.slice(2);
const flags = {}; const args = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[i + 1]?.startsWith('--') || rest[i + 1] === undefined ? true : rest[++i];
  else args.push(rest[i]);
}
try {
  const d = load();
  if (cmd === 'list') {
    for (const [i, a] of d.albums.entries()) {
      console.log(`${String(i + 1).padStart(2)}  ${a.selected ? '●' : '○'}  ${a.slug.padEnd(28)} ${a.category.padEnd(9)} ${a.type.padEnd(14)} ${a.photos.length || a.count} photos`);
    }
    console.log('\n● = on the landing page');
  } else if (cmd === 'add') { const a = add(d, flags); save(d); console.log(`Added "${a.title}" as ${a.slug} (${a.photos.length} photos).`); }
  else if (cmd === 'remove') { const a = remove(d, args[0]); save(d); console.log(`Removed "${a.title}". Undo: cp data/site.backup.json data/site.json`); }
  else if (cmd === 'landing') { const a = landing(d, args[0], args[1] !== 'off'); save(d); console.log(`${a.title}: ${a.selected ? 'on' : 'off'} the landing page.`); }
  else if (cmd === 'move') { const a = move(d, args[0], Number(args[1]) || 1); save(d); console.log(`Moved "${a.title}" to position ${d.albums.indexOf(a) + 1}.`); }
  else if (!cmd || cmd === 'admin') serve();
  else fail(`Unknown command "${cmd}". Open this file to see the commands.`);
} catch (e) { console.error(e.message); process.exit(1); }

// ---------------------------------------------------------------- album manager (local only)
function serve() {
  const PORT = 4342;
  const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  createServer((req, res) => {
    // Local tool: only this machine may talk to it, and only from its own page.
    if (req.headers.host !== `localhost:${PORT}` && req.headers.host !== `127.0.0.1:${PORT}`) return json(res, 403, { error: 'Local only.' });
    if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(PAGE); }
    if (req.method === 'GET' && req.url === '/api') return json(res, 200, load());
    if (req.method === 'POST' && req.url === '/api') {
      if (req.headers['content-type'] !== 'application/json') return json(res, 415, { error: 'JSON only.' });
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 2e6) req.destroy(); });
      req.on('end', () => {
        try {
          const { action, slug, ...o } = JSON.parse(body); const d = load();
          if (action === 'add') add(d, o);
          else if (action === 'remove') remove(d, slug);
          else if (action === 'landing') landing(d, slug, !!o.on);
          else if (action === 'move') move(d, slug, o.position);
          else fail('Unknown action.');
          save(d); json(res, 200, d);
        } catch (e) { json(res, 400, { error: e.message }); }
      });
      return;
    }
    json(res, 404, { error: 'Not found.' });
  }).listen(PORT, '127.0.0.1', () => {
    console.log(`Album manager: http://localhost:${PORT}  (Ctrl+C to stop)`);
    if (process.platform === 'darwin' && !flags['no-open']) exec(`open http://localhost:${PORT}`);
  });
}

const PAGE = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Albums · Shawnys Captures</title>
<style>
:root{--paper:#FAF6EE;--deep:#F2ECDF;--line:#E3DACA;--ink:#211C17;--quiet:#645A4F;--terracotta:#B0452A}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:400 16px/1.5 'Libre Franklin',system-ui,sans-serif}
main{max-width:1080px;margin:0 auto;padding:48px 24px 96px}h1{font:400 40px/1.1 Georgia,serif;margin:0 0 8px}h2{font:400 24px/1.2 Georgia,serif;margin:48px 0 16px}
p{margin:0;color:var(--quiet)}ul{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
li{display:grid;grid-template-columns:72px 1fr auto;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
li img{width:72px;height:54px;object-fit:cover;border-radius:6px;background:var(--deep)}li small{color:var(--quiet);display:block}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
button,.b{font:500 14px/1 inherit;min-height:36px;padding:0 14px;border-radius:999px;border:1px solid #cfc5b4;background:var(--paper);color:var(--ink);cursor:pointer}
button:hover{background:var(--deep)}button.on{background:var(--ink);border-color:var(--ink);color:var(--paper)}
button.primary{background:var(--terracotta);border-color:var(--terracotta);color:var(--paper);min-height:44px;padding:0 20px}
button.danger{color:var(--terracotta)}:focus-visible{outline:2px solid var(--terracotta);outline-offset:2px}
form{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:var(--deep);padding:24px;border-radius:16px}
label{display:grid;gap:6px;font-weight:500;font-size:14px}label.wide{grid-column:1/-1}label span{font-weight:400;color:var(--quiet)}
input,select,textarea{font:400 16px/1.4 inherit;padding:10px 12px;border:1px solid #cfc5b4;border-radius:8px;background:var(--paper);color:var(--ink);width:100%}
textarea{min-height:120px;font-size:14px}#msg{min-height:24px;margin-top:16px;color:var(--terracotta)}
@media(max-width:640px){form{grid-template-columns:1fr}li{grid-template-columns:56px 1fr}li .row{grid-column:1/-1}}
</style>
<main>
<h1>Albums</h1>
<p>Changes save straight to data/site.json. The filled dot means the album shows full-screen on the landing page.</p>
<p id="msg" role="status"></p>
<ul id="list"></ul>
<h2>Add an album</h2>
<form id="f">
  <label>Title<input name="title" required placeholder="Ana &amp; Ben"></label>
  <label>Category<select name="category" id="cat"></select></label>
  <label>Type <span>the small label, e.g. Wedding, Pre-wedding, Maternity</span><input name="type"></label>
  <label>Venue <span>separate several with commas</span><input name="venue"></label>
  <label class="wide">Photos <span>a folder inside the project (e.g. public/photos/ana-ben), or one photo address per line. The first is the cover.</span><textarea name="photos"></textarea></label>
  <label class="row" style="display:flex"><input type="checkbox" name="landing" style="width:auto"> Show on the landing page</label>
  <div style="text-align:right"><button class="primary">Add album</button></div>
</form>
</main>
<script type="module">
const $=s=>document.querySelector(s),msg=$('#msg');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function post(body){const r=await fetch('/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();if(!r.ok){msg.textContent=d.error;return null}return d}
function draw(d){
  $('#cat').innerHTML=d.categories.map(c=>'<option value="'+c.slug+'">'+esc(c.label)+'</option>').join('');
  $('#list').innerHTML=d.albums.map((a,i)=>'<li><img src="'+esc(a.cover||'')+'" alt=""><div><strong>'+esc(a.title)+'</strong><small>'+esc(a.category)+' · '+esc(a.type)+' · '+(a.photos.length||a.count)+' photos'+(a.venue?' · '+esc(a.venue):'')+'</small></div><div class="row">'
    +'<button data-a="landing" data-s="'+a.slug+'" class="'+(a.selected?'on':'')+'" aria-pressed="'+a.selected+'">'+(a.selected?'● On landing':'○ Landing')+'</button>'
    +'<button data-a="up" data-s="'+a.slug+'" data-p="'+i+'" aria-label="Move '+esc(a.title)+' up"'+(i?'':' disabled')+'>↑</button>'
    +'<button data-a="down" data-s="'+a.slug+'" data-p="'+(i+2)+'" aria-label="Move '+esc(a.title)+' down"'+(i<d.albums.length-1?'':' disabled')+'>↓</button>'
    +'<button data-a="remove" data-s="'+a.slug+'" data-t="'+esc(a.title)+'" class="danger">Remove</button></div></li>').join('')||'<li>No albums yet.</li>';
}
$('#list').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const {a,s,p,t}=b.dataset;let d;
  if(a==='remove'){if(!confirm('Remove "'+t+'" from the site? The photo files are not deleted.'))return;d=await post({action:'remove',slug:s});if(d)msg.textContent='Removed '+t+'.'}
  else if(a==='landing')d=await post({action:'landing',slug:s,on:!b.classList.contains('on')});
  else d=await post({action:'move',slug:s,position:+p});
  if(d)draw(d)};
$('#f').onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));o.landing=!!o.landing;
  const d=await post({action:'add',...o});if(d){draw(d);e.target.reset();msg.textContent='Added '+o.title+'.'}};
draw(await (await fetch('/api')).json());
</script></html>`;
