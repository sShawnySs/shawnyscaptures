# Shawnys Captures: current site audit (2026-11-10)

Crawled from https://shawnyscaptures.myportfolio.com/ (Adobe Portfolio). 14 pages, all 200.
This is the content and IA to carry into the new site.

## 1. Current IA

```
Nav: Photography · Rate Card · About · Contact     [logo centre]     Instagram · Email

/                          Home: hero gallery (Cincopa embed) + intro + "More about me" + album grid (8)
/home-1                    Duplicate of Home (logo links here; different album order)
/weddings-and-preweddings  "Photography": album grid (8), no filters, no intro
  /vincent-amanda              Wedding · CHIJMES · 56 photos
  /brinston-chrestella-wedding Wedding · Church of St Ignatius + Swissôtel The Stamford · 105 photos
  /reuben-tricia-wedding       Wedding · InterContinental Singapore · 18 photos
  /portraits                   Solemnisation (signing of wedding certificate) · Goodwood Park Hotel · 33 photos
  /daniel-and-dawn             Pre-wedding · Gardens by the Bay, Botanic Gardens, their new house · 78 photos
  /clarence-daraelle           Pre-wedding · Tampines Eco Park · 32 photos
  /ming-charmaine-1            Pre-wedding · Fort Canning Park · 51 photos
  /reuben-and-tricia-prewedding Pre-wedding · Changi Sailing Club · 22 photos
/ratecard                  Packages + FAQ + "Let's Connect"
/about                     Style, personality (INFP), documentary approach, "Full Album" link
/contact                   Enquiry form (10 fields)
```

About 395 photos across 8 albums. Each album page is: title, venue(s) with GPS coordinates, the photo
stream, "Back to Albums".

## 2. Content to carry over

**Services and prices (SGD)**
- Wedding Day: 10 h, min 500 images, $1,850 (+$450 expedited, 1-week delivery) · 8 h, min 400, $1,600
  (+$350) · 6 h, min 300, $1,320 (+$300) · split day +$80 · extra hour $250
- Pre-wedding / Maternity: 5 h, 3–4 locations, min 150, $880 (+$200) · 3 h, 2 locations, min 100, $550
  (+$150) · 1.5 h, 1 location, min 50, $320 (+$100) · extra hour $250
- Note: **Maternity** is a service on the rate card but not in BRAND.md (which lists Portraits "confirm").

**FAQ (8):** no photo cap · 4–6 weeks delivery · all edited, high-res JPEG only · no Photoshop retouching
(can discuss) · meet before booking, rehearsals welcome · arrives halfway through bridal makeup · custom
packages · 50% on confirmation, 50% one week after the shoot.

**Enquiry form fields:** your name*, partner's name*, phone/Telegram*, email*, pre-wedding / wedding /
both*, date*, about the wedding and yourselves*, why me*, how did you find me, message.

**About themes worth keeping:** sneakers not suit-and-tie, blends into the background, documents moments
not poses, INFP who likes small groups, "a friend, not a vendor", celebrates imperfection, wants to meet
couples first.

**Contact:** shawnys.sim@gmail.com · instagram.com/shawnyssim

## 3. Problems found

1. **The home hero is broken.** The Cincopa gallery shows "Gallery is offline (suspended)". It's the
   first thing visitors see.
2. Two home pages (`/` and `/home-1`) with different album orders; the logo goes to the duplicate.
3. Slugs and titles disagree: `/portraits` is a solemnisation, `/reuben-tricia-wedding` has the page
   title "Pre-wedding", `/ming-charmaine-1` has a stray `-1`. "Vincent & Amanda" in the grid, "Vincent and
   Amadea" on the page: **confirm the bride's name**.
4. Ming & Charmaine has no "Back to Albums"; no album links to the next one.
5. One flat grid of 8: weddings and pre-weddings mixed, no counts, dates or filter.
6. Every page shares the same meta description; no per-album descriptions or share images.
7. Footer says "© 2024 Shawn Captures" (not Shawnys Captures, and the year is stale).
8. Voice is off-brand against BRAND.md §7: exclamation marks, "Let's make some magic together!", "in a
   jiffy", "awesome day", emoji in the intro.
9. Albums are long single streams (up to 105 photos) with nothing to break or pace them.

## 4. Proposed IA (draft for discussion)

```
Home       one strong photo, a two-line intro, 4–6 selected albums, enquire
Stories    all albums, filter: Weddings · Pre-weddings · Solemnisations (· Maternity)
  /stories/<couple-slug>   cover, venue + date, 3–4 short "chapters" of photos, next story
Pricing    the packages + FAQ (merged with "how it works": meet, shoot, deliver)
About      Shawn, the documentary approach, Instax prints of him working
Enquire    the form, shorter (keep the 4 required essentials + date + type + message)
```

Old URLs should 301 to the new ones when the domain moves.
