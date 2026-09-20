# LOKESHVERSE ⚡

> Notes, but make them brutal.

A student-built public notes library. Pure HTML + ONE shared CSS file + a sprinkle of vanilla JS. No frameworks, no PDFs, no uploads.

---

## Run it locally

```bash
cd lokeshverse
python -m http.server 8080
# open http://localhost:8080
```

(Or just double-click `index.html` — everything works from the file system too.)
Deploy anywhere static: GitHub Pages, Netlify, Vercel, Cloudflare Pages.

---

## File structure

```
/
├── index.html                     ← homepage (hero, explore, about)
├── about.html
├── search.html
├── css/style.css                  ← ⭐ ONE stylesheet controls EVERYTHING
├── js/main.js                     ← nav, copy-code, progress bar, back-to-top
├── js/search.js                   ← ⚙️ search index (add entries when you add notes)
├── js/visitors.js                 ← ⚙️ live visitor counter (add Firebase config)
├── assets/                        ← favicon + OG image
└── subjects/
    └── data-structures/
        ├── index.html             ← subject page template
        └── chapter-01.html        ← chapter page template
```

---

## ➕ Add Chapter 02 (2 minutes)

1. Duplicate `subjects/data-structures/chapter-01.html` → `chapter-02.html`
2. Edit only the marked blocks:
   - `CHAPTER SEO` (title/description)
   - `CHAPTER HEADER` (number, title, meta)
   - `NOTES CONTENT` (write your notes — copy any box you like)
   - `CHAPTER NAVIGATION` (point prev/next at the right files)
3. On `subjects/data-structures/index.html`, copy the `<article class="chapter-card">`
   block inside `CHAPTER LIST`, bump the number, change title/description/href.
4. Add a search entry in `js/search.js` → `SEARCH_INDEX`.

The design stays identical automatically — it all comes from `css/style.css`.

### Note boxes you can copy inside a chapter

| Class            | Looks like        |
|------------------|-------------------|
| `.definition-box`| cyan DEFINITION   |
| `.important-box` | pink IMPORTANT    |
| `.example-box`   | yellow EXAMPLE    |
| `.keypoint-box`  | lime KEY POINT    |
| `.remember-box`  | orange REMEMBER   |
| `.formula-block` | purple FORMULA    |
| `.code-block`    | black code + COPY |
| `.brutal-table`  | bold table        |

Each callout starts with `<span class="callout-label">YOUR LABEL</span>`.

## ➕ Add a new subject

1. Duplicate the `subjects/data-structures/` folder → rename (e.g. `subjects/physics/`).
2. In its `index.html` edit the `SUBJECT INFORMATION` block + SEO lines.
3. Add it to the homepage card in `index.html` (a new `.subject-line`) and to
   `SEARCH_INDEX` in `js/search.js`.

## ➕ Add a new university/course/semester

Copy the `.brutal-card.uni-card` block in `index.html` → `EXPLORE NOTES`.

---

## ⚙️ Configuration points (all clearly marked in code)

### 1. Live visitor counter — `js/visitors.js`
Real presence counter using Firebase Realtime Database (free tier is plenty):
1. https://console.firebase.google.com → new project
2. Realtime Database → Create (test mode)
3. Project settings → Your apps → Web → copy config
4. Paste into `VISITOR_CONFIG.firebase` in `js/visitors.js`

Until then the footer honestly shows "—" — it never fakes a number.

### 2. Spotify — every footer
Swap the playlist/track URL inside the `SPOTIFY CONFIG` comment in any footer
(copy the change to each page's footer, or find & replace the URL project-wide).

### 3. Search index — `js/search.js`
Add an entry per subject/chapter/topic to `SEARCH_INDEX`.

---

## 🎨 Change the whole design?

Edit `css/style.css` — every page updates. Colours live in `:root` at the top.
