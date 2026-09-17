#!/usr/bin/env python3
"""
LOKESHVERSE — search index builder
==================================
Scans subjects/*/index.html and subjects/*/chapter-*.html and regenerates
js/search-data.js (the client-side search index).

RUN THIS after adding or editing any subject/chapter:

    python tools/build-search.py

Requirements: Python 3 standard library only. Works from any folder
(paths are resolved relative to this file).
"""
import html as htmlmod
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUBJECTS_DIR = os.path.join(ROOT, "subjects")
OUT_PATH = os.path.join(ROOT, "js", "search-data.js")
MAX_TEXT = 2400  # characters of body text indexed per page

META_RE = re.compile(
    r'<meta\s+name\s*=\s*"(lv-[a-z-]+|description)"\s+content\s*=\s*"([^"]*)"',
    re.IGNORECASE,
)


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def get_metas(raw):
    metas = {}
    for name, content in META_RE.findall(raw):
        metas[name] = htmlmod.unescape(content).strip()
    return metas


class MainTextExtractor(HTMLParser):
    """Collects visible text inside <main> (skipping script/style/svg)
    and remembers h2/h3 headings as searchable topics."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_main = False
        self.skip_depth = 0
        self.heading = None
        self.parts = []
        self.topics = []

    def handle_starttag(self, tag, attrs):
        if tag == "main":
            self.in_main = True
        elif tag in ("script", "style", "svg"):
            self.skip_depth += 1
        elif tag in ("h2", "h3"):
            self.heading = []
        elif tag in ("p", "li", "tr", "div", "section", "figcaption", "pre", "table"):
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag == "main":
            self.in_main = False
        elif tag in ("script", "style", "svg"):
            self.skip_depth = max(0, self.skip_depth - 1)
        elif tag in ("h2", "h3") and self.heading is not None:
            text = " ".join("".join(self.heading).split())
            if text:
                self.topics.append(text)
            self.heading = None

    def handle_data(self, data):
        if not self.in_main or self.skip_depth:
            return
        self.parts.append(data)
        if self.heading is not None:
            self.heading.append(data)


def extract_text(raw):
    p = MainTextExtractor()
    try:
        p.feed(raw)
        p.close()
    except Exception as e:  # never let one bad page kill the build
        print("  ! parse warning:", e)
    text = " ".join("".join(p.parts).split())
    return text[:MAX_TEXT], p.topics


def split_list(value):
    return [v.strip() for v in value.split(",") if v.strip()]


CHAPTER_ROW_RE = re.compile(
    r'<a class="chapter-row" href="(chapter-\d+\.html)">(.*?)</a>', re.S)


def extract_chapter_rows(raw):
    """Extract the chapter list from a subject page. This is the single
    source of truth for the ALL CHAPTERS list rendered on chapter pages —
    edit the subject page, rerun the builder, every chapter page updates."""
    rows = []
    for href, body in CHAPTER_ROW_RE.findall(raw):
        num_m = re.search(r'chapter-num">([^<]+)<', body)
        title_m = re.search(r'chapter-title">([^<]+)<', body)
        desc_m = re.search(r'chapter-desc">(.*?)</span>', body, re.S)
        tags = re.findall(r'tag tag-[a-z]+">([^<]+)</span>', body)
        rows.append({
            "num": htmlmod.unescape(num_m.group(1)).strip() if num_m else "",
            "title": htmlmod.unescape(title_m.group(1)).strip() if title_m else "",
            "href": href,
            "desc": " ".join(htmlmod.unescape(desc_m.group(1)).split()) if desc_m else "",
            "tags": [htmlmod.unescape(t).strip() for t in tags],
        })
    return rows


def build_subject_entry(slug, raw):
    metas = get_metas(raw)
    text, topics = extract_text(raw)
    url = "subjects/%s/" % slug
    return {
        "url": url,
        "kind": "subject",
        "title": metas.get("lv-subject", slug.replace("-", " ").title()),
        "chapterNum": "",
        "label": "Subject page",
        "subject": metas.get("lv-subject", slug),
        "subjectUrl": url,
        "university": metas.get("lv-university", ""),
        "course": metas.get("lv-course", ""),
        "semester": metas.get("lv-semester", ""),
        "noteTypes": split_list(metas.get("lv-note-types", "")),
        "keywords": split_list(metas.get("lv-keywords", "")),
        "topics": topics,
        "text": text,
    }


def build_chapter_entry(slug, fname, raw):
    metas = get_metas(raw)
    text, topics = extract_text(raw)
    m = re.search(r"chapter-(\d+)", fname)
    num = m.group(1) if m else "?"
    return {
        "url": "subjects/%s/%s" % (slug, fname),
        "kind": "chapter",
        "title": metas.get("lv-chapter-title", fname),
        "chapterNum": num,
        "label": "Chapter %s — %s" % (num, metas.get("lv-chapter-title", "")),
        "subject": metas.get("lv-subject", slug),
        "subjectUrl": "subjects/%s/" % slug,
        "university": metas.get("lv-university", ""),
        "course": metas.get("lv-course", ""),
        "semester": metas.get("lv-semester", ""),
        "noteTypes": split_list(metas.get("lv-note-types", "")),
        "keywords": split_list(metas.get("lv-keywords", "")),
        "topics": topics,
        "text": text,
    }


def main():
    if not os.path.isdir(SUBJECTS_DIR):
        sys.exit("No subjects/ folder found at %s" % SUBJECTS_DIR)

    entries = []
    chapters_data = {}
    subjects = sorted(
        d for d in os.listdir(SUBJECTS_DIR)
        if os.path.isdir(os.path.join(SUBJECTS_DIR, d)) and not d.startswith(("_", "."))
    )

    for slug in subjects:
        sdir = os.path.join(SUBJECTS_DIR, slug)
        index_path = os.path.join(sdir, "index.html")
        if not os.path.isfile(index_path):
            print("! skipping %s (no index.html)" % slug)
            continue

        raw = read(index_path)
        subj_entry = build_subject_entry(slug, raw)
        entries.append(subj_entry)
        chapters_data[slug] = {
            "subject": subj_entry["title"],
            "subjectUrl": subj_entry["url"],
            "chapters": extract_chapter_rows(raw),
        }
        n_chapters = 0

        chapters = sorted(
            f for f in os.listdir(sdir)
            if re.fullmatch(r"chapter-\d+\.html", f)
        )
        for fname in chapters:
            craw = read(os.path.join(sdir, fname))
            entries.append(build_chapter_entry(slug, fname, craw))
            n_chapters += 1

        print("✓ %-28s %d chapter(s)" % (slug, n_chapters))

    header = (
        "/* AUTO-GENERATED by tools/build-search.py — DO NOT EDIT BY HAND.\n"
        "   Regenerate with:  python tools/build-search.py  */\n"
    )
    payload = "window.SEARCH_INDEX = " + json.dumps(entries, ensure_ascii=False, indent=1) + ";\n"
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(header + payload)

    # ---- js/chapters.js : the ALL CHAPTERS list on chapter pages ----
    chapters_header = (
        "/* AUTO-GENERATED by tools/build-search.py \u2014 DO NOT EDIT BY HAND.\n"
        "   This is the ALL CHAPTERS list shown on chapter pages (rendered by\n"
        "   main.js with the same .chapter-row classes as the subject pages).\n"
        "   Source of truth: each subject page's chapter list.\n"
        "   Regenerate with:  python tools/build-search.py  */\n"
    )
    chapters_path = os.path.join(ROOT, "js", "chapters.js")
    with open(chapters_path, "w", encoding="utf-8") as f:
        f.write(chapters_header + "window.LV_CHAPTERS = " +
                json.dumps(chapters_data, ensure_ascii=False, indent=1) + ";\n")

    total_rows = sum(len(v["chapters"]) for v in chapters_data.values())
    print("\nWrote %s (%d entries: %d subjects, %d chapters)"
          % (os.path.relpath(OUT_PATH, ROOT), len(entries),
             sum(1 for e in entries if e["kind"] == "subject"),
             sum(1 for e in entries if e["kind"] == "chapter")))
    print("Wrote %s (chapter lists for %d subjects, %d rows total)"
          % (os.path.relpath(chapters_path, ROOT), len(chapters_data), total_rows))


if __name__ == "__main__":
    main()
