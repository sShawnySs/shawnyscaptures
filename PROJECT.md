# Shawnys Captures: photography site project

Owner: project manager · Last updated: 2026-11-11 · Sources: `CLAUDE.md`, `brand/BRAND.md`, `docs/SITE-AUDIT.md`, `data/site.json`, `drafts/v2/base.css`

## 1. Status (2026-11-11)

Draft v0.2 is in progress. Shawn asked today for a clean site on the design portfolio's type ladder, sizing and padding, with handcrafted paper texture, light leaks and slight off-white and orange tones; a landing of full-screen photos that lead to albums; nav by Weddings / Family / Events / Others; and a way to add and remove albums himself. Done so far: `drafts/v2/base.css` (tokens), `public/textures/` (paper grain, three leaks and their washes), `data/site.json` with the four categories. In progress: three landing concepts (`drafts/v2/concepts/a.html`, `b.html`, `c.html`) by separate designers, then a critique. Not started: `drafts/v2/index.html` and `scripts/albums.mjs`. Nothing is deployed; the old Adobe Portfolio site is still the live one. `drafts/home.html` (v0.1) is superseded.

## 2. Scope of draft v0.2

In scope
- Three landing concepts, critiqued; the lead builds the chosen direction.
- `drafts/v2/index.html`: one no-build, hash-routed draft with landing, four category pages, album page, rates, about, enquire. Reads `data/site.json`; uses `base.css` tokens only. Copy is carried from the audit (prices, FAQ, about themes) and rewritten in the brand voice.
- `scripts/albums.mjs`: zero-dependency Node tool to list, add, remove and reorder albums in `data/site.json`, with usage documented.

Out of scope today
- The production build (expected: Astro on Vercel, like the design portfolio), domain, analytics, SEO meta and share images.
- Re-exporting photos to Cloudinary (URLs stay as stand-ins on the old CDN) and 301 redirects from the old URLs (`oldUrl` is kept in the data for later).
- A working enquiry form backend; the draft form does not send.
- Ringside webfonts (Libre Franklin stands in), new hand-lettering, album stories, dates and chapter titles (all `null`). Editing `brand/BRAND.md`, which waits for Shawn's approval (see 5).

## 3. IA

Fixed nav on every route: logo (to landing) · Weddings · Family · Events · Others · Rates · About · Enquire (primary pill). Phone: a menu button opening the same links.

| Route | Must contain |
|---|---|
| `#/` landing | Full-screen plates for albums with `selected: true`, in file order (`hero`, else `featured[0]`, else `cover`; `object-position: focus`). Each plate is a link to its album showing title, type and venue. Then the first-person intro, rates teaser (Wedding day from $1,320 · Pre-wedding from $320 · Delivery 4 to 6 weeks), enquire invitation, footer (email, Instagram, © 2026 Shawnys Captures · Singapore). |
| `#/weddings`, `#/family`, `#/events`, `#/others` | Category label, the albums in that category (cover, title, `type`, venue, photo count), each one click to the album. Enquire link. |
| `#/album/<slug>` | Title, type, venue(s), photo count; the photos, in chapters where `chapters` exist; a photo viewer; link to the next album and back to the category; enquire link. No date or story while they are `null`. |
| `#/rates` | Wedding Day and Pre-wedding / Maternity packages, extras, delivery and payment from `pricing`; the 8 FAQ answers from the audit; enquire link. |
| `#/about` | Shawn in first person, from the audit's about themes (sneakers, in the background, moments not poses, meets couples first). |
| `#/enquire` | The shorter form proposed in the audit (name, partner's name, phone/Telegram, email, type, date, message) plus email and Instagram as direct fallbacks. |

Category mapping (all 8 albums have `category: "weddings"`; `type` is the finer label)

| Category | Albums |
|---|---|
| Weddings | Wedding: Vincent & Amanda, Brinston & Chrestella, Reuben & Tricia (`reuben-tricia-wedding`). Pre-wedding: Clarence & Daraelle, Daniel & Dawn, Ming & Charmaine, Reuben & Tricia (`reuben-tricia-prewedding`). Solemnisation: John & Xin Yi. |
| Family, Events, Others | None yet. |

On `#/weddings`, group or filter by `type` so 8 albums are not one flat grid (audit problem 5), and show the type on both Reuben & Tricia albums since their titles are identical.

Empty categories, recommendation: keep all four in the nav, because Shawn asked for that structure, but never show an empty grid or placeholder albums. An empty category page shows one honest line (for example "Nothing here yet. If you have a family shoot or an event in mind, tell me about it.") and the Enquire pill. The page fills itself as soon as an album with that category is added. Alternative for Shawn to choose: hide empty categories from the nav automatically until they have an album.

## 4. Acceptance criteria for v0.2

Photos and paths
- [ ] The first photograph is the first thing seen: no splash, loader or intro animation delays it; first plate has `fetchpriority="high"`, the rest lazy-load.
- [ ] Every landing plate is a real link that opens its album in one click or tap.
- [ ] Rates and Enquire are reachable in one action from every route, including inside an album and the photo viewer's parent page.
- [ ] All 8 albums are reachable from `#/weddings`; an album with no `photos` list shows what it has (`featured`, `cover`) without errors or broken images. Empty categories behave as in section 3; unknown routes and album slugs fall back to a clear page, not a blank one.
- [ ] No filter, tint or overlay on a photo; leaks only graze photo edges and never sit on faces; paper grain never over a photo.

Layout and type
- [ ] Only `base.css` tokens for size, space, colour and radius; no invented sizes. Logo at least 120 px wide, unaltered: Darkroom ink on paper, Linen ink over photos or dark.
- [ ] 375 px wide: no horizontal scroll, tap targets at least 44 px, menu button opens the same links.

Accessibility
- [ ] Everything works by keyboard: visible focus, menu and viewer close on Esc, focus returns to the trigger, focus moves sensibly on route change.
- [ ] Text meets WCAG AA (4.5:1); text over photos sits on a scrim or paper tab; `--ember` is never text on paper.
- [ ] `prefers-reduced-motion` removes scroll-driven and entrance motion; content is still all there.
- [ ] No hover-only content; plates have accessible names ("<Title>, <type> at <venue>"); photos have alt text.

Content
- [ ] Voice: first person, warm, plain, no exclamation marks, no scarcity lines, no emoji.
- [ ] No invented facts: every price, hour count, venue, name and FAQ answer matches `data/site.json` or `docs/SITE-AUDIT.md`; `null` fields are left out, not filled.

Build and tooling
- [ ] Served from the project root (`python3 -m http.server 4341`), `/drafts/v2/index.html` loads with no console errors, no dependencies, no build step, no authored SVG.
- [ ] `node scripts/albums.mjs` lists, adds, removes and reorders; the file stays valid JSON with other fields untouched; it refuses duplicate slugs and unknown categories; removal asks or needs an explicit flag.
- [ ] Adding then removing a test album leaves `data/site.json` identical to before, and the draft shows the change on reload. How to do it is written where Shawn will find it (tool `--help` and `CLAUDE.md`).

## 5. Decisions made today (2026-11-11)

| Decision | Reason | By |
|---|---|---|
| The website moves from BRAND.md v2 (neutral frames, no texture) to warm textured paper: off-white `#FAF6EE` ground, paper grain, light leaks, a little orange. Treated as brand **v3, pending**: BRAND.md is not edited until Shawn approves the draft, then both copies change together (`brand/BRAND.md` and `/Users/shawnys/Portfolio/Brand/shawnys-captures/`). | Shawn's request today overrides v2. Holding the edit keeps the brand file from describing something he has not yet seen. v2's protections for photographs stay (no tint, filter or texture on a photo; leaks at edges only) because its reason still holds: a tinted ground or overlay shifts skin and white dresses. | Shawn (request), PM (sequencing) |
| Type ladder, spacing, page padding and pills are the design portfolio's, encoded in `drafts/v2/base.css`. | Shawn asked for the same ladder, sizing and padding; one token file stops concepts drifting. | Shawn |
| The landing follows nordicaphotography.com in spirit (stacked full-bleed photos, fixed logo and menu, album tags, short intro) with modern interaction. Three concepts are critiqued before the lead builds one. | Shawn's reference, which he finds dated. Concepts are compared first because the landing is the part that has to wow. | Shawn; PM (process) |
| Nav categories are Weddings / Family / Events / Others. Each album has one `category`; Wedding, Pre-wedding and Solemnisation stay as `type`. | Shawn's nav; `type` keeps the finer distinction the old flat grid lacked. | Shawn |
| v0.2 is a no-build, hash-routed single file reading `data/site.json`. | Fastest way for Shawn to click through the whole IA; the data file carries over to the production build unchanged. | PM |
| Albums are managed through `scripts/albums.mjs` (zero-dependency Node) editing `data/site.json`. | Shawn wants to add and remove albums himself; a CLI over one JSON file needs no CMS or account and survives the move to Astro. The file is in git; the tool must validate before writing, since a bad write breaks every page. | PM |
| Textures are generated by `scripts/make-textures.py` (seeded; paper fibre and leaks as PNG/WebP). | Organic, not digital dithering; reproducible and adjustable without hand-editing image files. | PM |
| No SVG is authored (no inline SVG, .svg files or SVG filters). The existing `public/assets/rays-golden-hour.svg` may be used as an image as it is. | Keeps the logo and rays as supplied, and keeps texture raster and hand-made rather than filter-generated. | PM |

## 6. Open questions for Shawn

1. Bride's name: the old grid says "Vincent & Amanda", the album page says "Vincent and Amadea". Which is right? (It sets the title and the slug.)
2. What goes in Family, Events and Others? No albums exist for them. Should empty categories show the one-line page or stay hidden until filled?
3. Maternity is on the rate card ("Pre-wedding / Maternity") but not in BRAND.md. Does it belong under Family? Is Portraits (BRAND.md: "confirm") still a service?
4. Should Pre-weddings be their own nav item? Four of the eight albums are pre-weddings and they have their own price list.
5. Where should enquiries go: email to shawnys.sim@gmail.com, a form service, Telegram? And is the shorter form (the audit's cut from 10 fields) acceptable, or do you want "why me" and "how did you find me" kept?
6. Album dates and stories are all `null`, and chapter titles are unwritten. Will you supply them, or should albums launch without?
7. Which four to six albums lead the landing, and which photo for each? Four are `selected` now; the other four have no `hero`.
8. Rates: are the prices in `data/site.json` (crawled 2026-11-10) current? Are there rates for family and event work?
9. Ringside: is there a licence and webfont files, or does Libre Franklin stay for launch? What is the domain, and are shawnys.sim@gmail.com and instagram.com/shawnyssim the public contacts?
10. Do you approve the brand change in section 5 as v3, so both BRAND.md copies can be updated?

## 7. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| All photo URLs are stand-ins on `cdn.myportfolio.com`. | Hotlinked images may be blocked, resized or removed, and disappear if the Adobe Portfolio site is closed. | Draft only; nobody has opened the concepts in a browser yet, so the lead and critics check that the stand-ins load and test against section 4 before Shawn sees it. Re-export to Cloudinary before launch; keep the old site up until then. |
| Only Clarence & Daraelle has its full `photos` list (32) and chapters; the others have two `featured` photos or a cover only. | Album pages look thin; the album design is proven on one album. | Label the draft as such; fill photo lists before judging album pacing. |
| Four albums have no `hero`, their `cover` is a grid crop of unverified size, and every `focus` is the default `50% 40%`. | Soft or badly cropped full screen; faces cut on phone portrait plates. | Use covers at grid size only until Shawn picks heroes; set `focus` per album; test at 375 px. |
| Light leaks and warm paper beside photos. | Skin and white dresses read warmer or washed. | Rules in section 4; review on real photos with Shawn. |
| The brand change is unapproved while work proceeds on it. | Rework if Shawn prefers v2's neutral frames. | Tokens live in `base.css`; a change of grounds is a token edit. |

## 8. Next steps after approval, in order

1. Shawn picks a landing concept and answers section 6 (questions 1, 2, 5 and 10 first).
2. Update both BRAND.md copies to v3 and bring `CLAUDE.md` in line.
3. Fix the data: names, heroes and `focus` per album, dates, stories, chapter titles, categories for any new albums.
4. Re-export the photos to Cloudinary and replace every stand-in URL; fill the full `photos` lists.
5. Production build in Astro on Vercel, reusing `base.css` tokens and `data/site.json`; keep `scripts/albums.mjs` working against it.
6. Wire the enquiry form to the chosen destination and test a real submission; install Ringside if licensed.
7. QA against section 4 plus performance, per-album meta descriptions and share images (audit problem 6).
8. Domain, then 301 redirects from every `oldUrl` and from `/home-1`, `/weddings-and-preweddings`, `/ratecard`, `/about`, `/contact`. Launch, then retire the Adobe Portfolio site once the redirects are confirmed.

## 9. Outcome of the concept round (2026-11-11)

- Three landing concepts were built by separate designers: A "the roll" (stacked full-screen plates, a leak on the
  moving seam), B "developing" (one pinned stage, a flood of warm light between photos), C "the window" (full-screen
  photo that closes to a matted print on paper). All three are kept in `drafts/v2/concepts/`.
- Two critics reviewed them. Visual craft: C, then A, then B. UX: A, then C, then B (C's scroll was too long and its
  phone print cropped heads). Both put B last: the flood hides the photograph.
- Built: C, with the fixes from both reviews (plates 1.8 screens instead of 2.3, prints in the photo's own shape, one
  name tag with a 01 / 04 counter, leaks quieter and off the photo at rest, Rates and Enquire always in the bar on
  phones, a not-found view, a message if the data fails to load). A is the alternative if Shawn wants photographs
  full-screen the whole way down.
- Not done from the reviews: storing photo dimensions in `site.json` (album grids still settle as images load),
  restoring scroll position on Back, the split-colour logo at the paper edge, per-album `focus` values (every album is
  still `50% 40%`, which crops the first photo's bride on phones).

## 10. Draft v0.3 (2026-11-11), after Shawn's review of v0.2

Shawn asked for a layout after a Pic-Time client gallery. What changed:

- Landing: one full-screen photograph that cross-fades between the landing albums on a timer (caption with the
  couple, ticks, pause). The scroll-driven "window" landing is retired; concepts a/b/c stay as studies.
- Below it, a tab bar that sticks to the top: the categories, Rates and FAQ. There is no separate About page:
  a small about section sits between the bar and the tab's content, and its copy and picture change per tab
  (`about` in `data/site.json`; `image: null` shows a print until Shawn supplies a photo of himself).
- Albums are listed as a wall of boxes (cover, name and venue on a gradient), grouped by kind.
- Album pages: boxed cover with the title on it, then rows of photographs at their own shapes.
- Look: bright neutral white, Wittgenstein, a smaller type ladder, minimal paper grain, and grainy
  long-exposure landscape prints in place of light leaks. `brand/BRAND.md` is still not updated.

Open: a photo of Shawn for the about section; whether Events stays as a tab (his latest note listed
wedding, family, other, rates, FAQ); the questions in section 8.
