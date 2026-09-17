# 📓 GUIDE — Writing Notes in LOKESHVERSE

Notes are written **directly in HTML**. This guide is the entire workflow:
how to add a chapter, how to use the components, and how search works.

---

## The 10,000-foot view

```
University → Course → Semester → Subject → Chapter → Topic
```

- **One subject = one folder** in `subjects/`, with an `index.html` (the subject page).
- **One chapter = one HTML file** in that folder: `chapter-01.html`, `chapter-02.html`, …
- Notes live inside `<article class="notes" data-toc="true" id="notes">`.
  The table of contents and the "≈ X MIN READ" chip are generated automatically
  from your `h2` headings — no maintenance needed.
- Every chapter page also shows the subject's **ALL CHAPTERS list** below the
  notes — rendered automatically by `main.js` from `js/chapters.js` with the
  *exact same* `.chapter-row` style as the subject page, with the chapter
  you're reading highlighted. You never write this list by hand.

---

## Adding a new chapter (the fast way)

```bash
python tools/new-chapter.py data-structures 07 "Sorting Algorithms"
```

This creates `subjects/data-structures/chapter-07.html` from the template with all
metadata filled in, and refreshes the search index automatically. Then:

1. **Write the notes** in the new file (components below).
2. **Add a chapter card** to `subjects/data-structures/index.html` (the script
   prints the exact snippet to paste).
3. **Fix PREVIOUS/NEXT links** in the new chapter and its neighbour.

### Adding a chapter (the manual way)

1. Duplicate `subjects/_template/chapter-template.html` into your subject folder
   as `chapter-XX.html`.
2. Replace the `{{TOKENS}}` (title, subject, university, course, semester).
3. Edit the `<meta name="lv-…">` tags — these power the search index and SEO.
4. Run `python tools/build-search.py`.

---

## Adding a new subject

1. Create `subjects/<your-slug>/index.html` **from the template**
   `subjects/_template/index-template.html` (copy it and replace the `{{TOKENS}}`).
   It ships the exact same chapter-list markup as every other subject page —
   same classes → same Neo-Brutalist styling everywhere.
2. Set the `lv-university`, `lv-course`, `lv-semester`, `lv-subject` meta tags.
3. Add chapter files (`python tools/new-chapter.py <your-slug> <num> "<Title>"`).
4. Add a subject card to the homepage's **EXPLORE NOTES** section (`index.html`)
   and, if it's a new course/semester, a row in the university card.
5. Run `python tools/build-search.py`.

> **Keeping chapter lists identical:** every subject page uses the same
> `.chapter-row` structure (`.chapter-num` → `.chapter-info` with
> `.chapter-title` / `.chapter-desc` / `.note-tags` → `.chapter-cta`), styled by
> the shared rules in `css/style.css`. Copy the block from any existing subject
> page or the template and it will match automatically — don't invent new
> classes for chapter lists.

---

## The meta tags that matter

Every subject & chapter page carries these — the search index builder reads them:

```html
<meta name="lv-university" content="Quantum University">
<meta name="lv-course"     content="B.Tech CSE">
<meta name="lv-semester"   content="Semester 1">
<meta name="lv-subject"    content="Data Structures">
<meta name="lv-chapter-num" content="03">                      <!-- chapters only -->
<meta name="lv-chapter-title" content="Linked Lists">          <!-- chapters only -->
<meta name="lv-note-types"  content="FULL NOTES, IMPORTANT QUESTIONS">
<meta name="lv-keywords"    content="linked list, node, pointer, malloc">
```

Valid note types: `FULL NOTES`, `SHORT NOTES`, `ONE-SHOT REVISION`,
`FORMULA SHEET`, `IMPORTANT QUESTIONS`.

---

# Component cookbook

Copy-paste these inside `<article class="notes">`. Each renders as a distinct
Neo-Brutalist block. **Always escape `<`, `>`, `&` inside code samples**
(`&lt;` `&gt;` `&amp;`).

## Normal notes

```html
<section class="notes-section">
  <h2>3.1 Section Heading</h2>
  <p>Plain paragraph. <strong>Bold</strong>, <em>emphasis</em>,
     <code>inline code</code>, and <a href="#">links</a> just work.</p>
  <ul>
    <li>Bullet points get purple square markers.</li>
  </ul>
</section>
```

## Definition

```html
<div class="component def">
  <span class="component-label">DEFINITION</span>
  <p><strong>Linked list.</strong> A dynamic linear structure where nodes are
     connected by pointers.</p>
</div>
```

## Important (loudest callout)

```html
<div class="component important">
  <span class="component-label">IMPORTANT</span>
  <p>BFS uses a QUEUE. DFS uses a STACK. Guaranteed exam question.</p>
</div>
```

## Example (problem/solution card)

```html
<div class="component example">
  <span class="component-label">EXAMPLE</span>
  <h4>Problem</h4>
  <p>Find the address of A[6]…</p>
  <h4>Solution</h4>
  <p>Base + 6 × 4 = 2024.</p>
</div>
```

## Code (with COPY button + syntax highlighting)

```html
<figure class="code-block">
  <div class="code-head">
    <span class="code-lang">C</span>
    <button class="copy-btn" type="button">COPY</button>
  </div>
  <pre><code data-lang="c">int x = 42;  /* data-lang: c, cpp, python, js */</code></pre>
</figure>
```

## Formula

```html
<div class="component formula">
  <span class="component-label">FORMULA</span>
  <div class="formula-body">Addr(A[i]) = Base + (i − LB) × w</div>
  <div class="formula-note">where w = bytes per element</div>
</div>
```

Use `<sub>` / `<sup>` for subscripts/superscripts inside `formula-body`.

## Key points (revision cards — use a grid of them)

```html
<div class="keypoints">
  <div class="component keypoint">
    <span class="component-label">KEY POINT</span>
    <p>Stack = LIFO. Queue = FIFO.</p>
  </div>
  <div class="component keypoint">
    <span class="component-label">KEY POINT</span>
    <p>push/pop/peek are all O(1).</p>
  </div>
</div>
```

## Remember (commonly forgotten things)

```html
<div class="component remember">
  <span class="component-label">REMEMBER</span>
  <p><strong>Never drop the +C</strong> in an indefinite integral.</p>
</div>
```

## Table (scrolls horizontally on mobile)

```html
<div class="table-scroll">
  <table class="notes-table">
    <caption>Table caption</caption>
    <thead><tr><th>Operation</th><th>Complexity</th></tr></thead>
    <tbody><tr><td>Access</td><td>O(1)</td></tr></tbody>
  </table>
</div>
```

## Diagram (inline SVG)

```html
<figure class="diagram">
  <svg viewBox="0 0 640 130" role="img" aria-label="Describe the diagram">
    <!-- rects, circles, lines with stroke="#101010" stroke-width="4" -->
  </svg>
  <figcaption>Fig 3.1 — Caption</figcaption>
</figure>
```

## Important questions

```html
<div class="component exam">
  <span class="component-label">IMPORTANT QUESTIONS</span>
  <ol>
    <li>Define a stack. Explain push and pop.</li>
  </ol>
</div>
```

## Note-type tags (shown under the chapter title)

```html
<div class="note-tags">
  <span class="tag tag-full">FULL NOTES</span>
  <span class="tag tag-short">SHORT NOTES</span>
  <span class="tag tag-oneshot">ONE-SHOT REVISION</span>
  <span class="tag tag-formula">FORMULA SHEET</span>
  <span class="tag tag-questions">IMPORTANT QUESTIONS</span>
</div>
```

---

## How search works (so you never wonder)

- `tools/build-search.py` scans every subject & chapter page:
  meta tags, `h2`/`h3` topics, keywords and the visible text of the notes.
- It writes `js/search-data.js`, which `search.html` loads and searches
  instantly in the visitor's browser — including text **inside** the notes.
- **After adding or editing any chapter, run:**

```bash
python tools/build-search.py
```

(`tools/new-chapter.py` runs it for you automatically.)

---

## Small print

- Relative links only (`../../index.html`) — the site works from `file://`,
  any subfolder, GitHub Pages, Netlify, everywhere.
- Body classes that unlock behaviour:
  `data-page="chapter"` → reading progress bar; `data-toc="true"` → auto TOC;
  `data-readtime` → reading-time chip; `data-root="../../"` → correct paths
  for the "/" search shortcut.
- Sticky header height and the 74ch reading measure live in `css/style.css` `:root`.
