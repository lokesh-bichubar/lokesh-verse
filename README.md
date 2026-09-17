# LOKESHVERSE

> **Notes, but make them brutal.**
> A personal digital notebook that accidentally became a public library.

Student. Builder. Notes hoarder. — **Lokesh**

LOKESHVERSE is a public notes website where notes are written **directly in HTML** —
no PDFs, no uploads, no logins. One university → course → semester → subject →
chapter hierarchy, a Neo-Brutalist design system, full-text search, a real live
visitor counter and a Spotify embed in every footer.

---

## What's inside

```
/
├── index.html                        Homepage (hero, explore, note types, about builder)
├── about.html                        About Lokesh
├── search.html                       Full-text search + filters
│
├── subjects/
│   ├── data-structures/              SUBJECT PAGE (index.html)
│   │   ├── chapter-01.html … 06.html CHAPTER PAGES (the actual notes)
│   ├── engineering-mathematics-i/
│   │   ├── index.html
│   │   └── chapter-01.html … 04.html
│   └── _template/                    Copy-paste templates for new chapters
│
├── css/style.css                     The whole Neo-Brutalist design system
├── js/
│   ├── config.js                     ⚙️ Spotify embed URL + site settings
│   ├── main.js                       Nav, progress bar, TOC, code copy, highlighter
│   ├── visitors.js                   ⚙️ LIVE VISITORS (Firebase config goes here)
│   ├── search.js                     Search engine (runs in the browser)
│   └── search-data.js                Auto-generated search index
│
├── tools/
│   ├── build-search.py               Regenerates js/search-data.js
│   └── new-chapter.py                Scaffolds a new chapter page
│
├── assets/                           favicon.svg, og-image.png
├── firebase-rules.json               Security rules for the visitors counter
├── GUIDE.md                          📓 How to write & add notes (component cookbook)
└── README.md                         You are here
```

---

## Run it locally

No build step, no dependencies. Either:

- **Double-click `index.html`** — everything works (search uses a JS index, not fetch), or
- Serve it (nicer URLs, closer to production):

```bash
cd lokeshverse
python3 -m http.server 8080
# open http://localhost:8080
```

---

## ⚙️ Configuration — the 2 things to set up

### 1. Spotify embed ("🎧 LISTENING WHILE BUILDING THIS")

Open **`js/config.js`** and replace `SPOTIFY_EMBED_URL` with your own playlist/track:

1. In Spotify: **Share → Embed playlist/track/album**.
2. Copy the iframe **src** URL (`https://open.spotify.com/embed/playlist/…`).
3. Paste it into `SPOTIFY_EMBED_URL`. Done — it updates on every page at once.

It never autoplays, and it's labelled as *what was listened to while building*,
not "now playing".

### 2. Live visitors counter (real, not fake)

The counter uses **Firebase Realtime Database** (free tier). Until configured,
the footer honestly shows **"—"** instead of inventing a number.

**Setup (5 minutes):**

1. Go to <https://console.firebase.google.com> → **Add project** (e.g. `lokeshverse`).
2. In the project: **Build → Realtime Database → Create Database**
   (choose a region; start in *locked mode* is fine).
3. **Rules tab** → paste the rules from `firebase-rules.json` in this repo → Publish.
4. **Project Settings (⚙️) → Your apps → Web (</>)** → register the app →
   copy the `firebaseConfig` object.
5. Open **`js/visitors.js`** and replace the `PASTE_…` placeholders with your values.
   ⚠️ The `databaseURL` must be a Realtime Database URL
   (ends in `.firebaseio.com` or `.firebasedatabase.app`) — **not** Firestore.
6. Redeploy. Every page's footer now shows a real, live count.

**How it counts honestly:**
- Each open tab = one session (stored in `sessionStorage`, so refreshing doesn't double count).
- A heartbeat refreshes the session every 30 s; sessions silent for 90 s are ignored.
- `onDisconnect()` removes the session the moment a tab closes.

---

## Adding notes

Everything about writing and publishing new chapters is in **[GUIDE.md](GUIDE.md)** —
the 5-minute version:

```bash
# create chapter 07 of Data Structures, pre-filled:
python tools/new-chapter.py data-structures 07 "Sorting Algorithms"

# …write the notes in the generated HTML file…

# refresh the search index when you're done:
python tools/build-search.py
```

`new-chapter.py` auto-runs the search builder, so usually you only need the first command.

The builder regenerates **both** generated files: the search index
(`js/search-data.js`) and the **ALL CHAPTERS** lists shown at the bottom of
every chapter page (`js/chapters.js`). Their source of truth is each subject
page's chapter list — edit the subject page, rerun the builder, and the
chapter lists update on every page of that subject at once.

---

## Deploying

It's a fully static site — host it anywhere:

| Host | How |
|---|---|
| **GitHub Pages** | Push to a repo → Settings → Pages → deploy from branch |
| **Netlify** | Drag-and-drop the folder |
| **Vercel** | `vercel` in the project root |
| **Cloudflare Pages** | Connect repo, no build command needed |

After deploying, optionally:
- Add `<meta property="og:url" content="https://your-domain/">` to pages,
- Point `og:image` to the absolute URL of `assets/og-image.png`.

---

## Design system (quick reference)

| Token | Value |
|---|---|
| Background | `#F6EFE3` cream |
| Ink | `#101010` |
| Accent | `#7B2FFF` electric purple |
| Highlighter | `#FFD84D` (used sparingly: REMEMBER boxes, marks, live dot) |
| Border | `3px solid #101010` |
| Shadow | `6px 6px 0 #101010` (hard, never blurred) |
| Type | System heavy stack (`Arial Black`-class) + mono (`Courier New`-class) |

Change the accent in one place: the `:root` variables at the top of `css/style.css`.

---

## Tech notes

- **Zero frameworks, zero dependencies.** Plain HTML/CSS/vanilla JS (~10 KB of scripts).
- Search runs **client-side** over a generated JS index — works on `file://`, GitHub Pages,
  anywhere.
- Code blocks have a tiny built-in syntax highlighter (C/C++/Python/JS) + COPY button.
- Chapter pages get an **auto-generated table of contents** and reading time from their `h2`s.
- Semantic HTML, per-page titles/descriptions/Open Graph, JSON-LD breadcrumbs.
- Mobile-first responsive: collapsing nav, stacking cards, horizontally scrollable
  code/tables, print stylesheet for physical revision.

Built by Lokesh — [About the builder](about.html)
