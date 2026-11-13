// Upload album photos to Cloudinary (free plan). No dependencies: Node's own fetch, FormData and crypto.
//
// Setup, once: copy .env.example to .env and paste your CLOUDINARY_URL into it. The URL is on the Cloudinary
// dashboard ("API environment variable"): cloudinary://<api key>:<api secret>@<cloud name>. .env never leaves this
// Mac (it's in .gitignore and .vercelignore); the site itself needs no key, only the public photo addresses.
//
// Every photo goes into the folder shawnys/<album slug>, named after its file. Uploading the same name twice keeps
// the first copy (overwrite off), so running an upload again is safe and costs nothing extra.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename, extname } from 'node:path';

export function cloudConfig(root) {
  let url = process.env.CLOUDINARY_URL;
  const env = join(root, '.env');
  if (!url && existsSync(env)) {
    const line = readFileSync(env, 'utf8').split('\n').find((l) => /^\s*CLOUDINARY_URL\s*=/.test(l));
    url = line?.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
  const m = url?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  return m ? { key: m[1], secret: m[2], cloud: m[3] } : null;
}

export const isCloud = (p) => /^https:\/\/res\.cloudinary\.com\//.test(p);
const nameOf = (p) => basename(new URL(p, 'http://x').pathname, extname(new URL(p, 'http://x').pathname))
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'photo';

/** Upload one photo (a project path such as /public/photos/x.jpg, or a web address) and return its address. */
async function uploadOne(cfg, root, src, folder) {
  const params = { folder, overwrite: 'false', public_id: nameOf(src), timestamp: String(Math.floor(Date.now() / 1000)), unique_filename: 'false' };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append('api_key', cfg.key);
  form.append('signature', createHash('sha1').update(toSign + cfg.secret).digest('hex'));
  // a web address is fetched by Cloudinary itself; a project file is sent from here
  if (/^https?:\/\//.test(src)) form.append('file', src);
  else form.append('file', new Blob([readFileSync(join(root, src))]), basename(src));
  const r = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, { method: 'POST', body: form });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.secure_url) throw new Error(`Cloudinary refused ${basename(src)}: ${out.error?.message || r.status}`);
  return out.secure_url;
}

/** Move a list of photos to Cloudinary, three at a time. Ones already there are left as they are. */
export async function toCloud(cfg, root, list, slug, log = () => {}) {
  const out = [...list]; let next = 0, done = 0;
  const todo = list.map((p, i) => [p, i]).filter(([p]) => p && !isCloud(p));
  const worker = async () => {
    while (next < todo.length) {
      const [p, i] = todo[next++];
      out[i] = await uploadOne(cfg, root, p, `shawnys/${slug}`);
      log(`  ${++done}/${todo.length}  ${basename(p)}`);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return out;
}
