#!/usr/bin/env python3
"""
LOKESHVERSE — new chapter scaffolder
====================================
Creates a new chapter page from the template, fills in the metadata,
and refreshes the search index.

USAGE:
    python tools/new-chapter.py <subject-folder> <number> "<Chapter Title>"

EXAMPLE:
    python tools/new-chapter.py data-structures 07 "Sorting Algorithms"
      -> subjects/data-structures/chapter-07.html
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = os.path.join(ROOT, "subjects", "_template", "chapter-template.html")
META_RE = re.compile(r'<meta\s+name\s*=\s*"lv-([a-z-]+)"\s+content\s*=\s*"([^"]*)"')


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def main():
    args = sys.argv[1:]
    if len(args) != 3:
        sys.exit('Usage: python tools/new-chapter.py <subject-folder> <number> "<Chapter Title>"\n'
                 'Example: python tools/new-chapter.py data-structures 07 "Sorting Algorithms"')

    slug, num, title = args
    try:
        num = int(num)
    except ValueError:
        sys.exit("Chapter number must be an integer, e.g. 07")

    sdir = os.path.join(ROOT, "subjects", slug)
    index_path = os.path.join(sdir, "index.html")
    if not os.path.isfile(index_path):
        sys.exit("No subject found at subjects/%s/ (missing index.html)" % slug)

    chapter_num = "%02d" % num
    out_path = os.path.join(sdir, "chapter-%s.html" % chapter_num)
    if os.path.exists(out_path):
        sys.exit("Already exists: %s" % out_path)

    # pull subject metadata from the subject's index page
    metas = dict(("lv-" + k, v) for k, v in META_RE.findall(read(index_path)))
    missing = [k for k in ("lv-university", "lv-course", "lv-semester", "lv-subject") if k not in metas]
    if missing:
        sys.exit("subjects/%s/index.html is missing %s — add the lv-* meta tags first."
                 % (slug, ", ".join(missing)))

    html_out = read(TEMPLATE)
    replacements = {
        "{{CHAPTER_NUM}}": chapter_num,
        "{{CHAPTER_TITLE}}": title,
        "{{SUBJECT}}": metas["lv-subject"],
        "{{UNIVERSITY}}": metas["lv-university"],
        "{{COURSE}}": metas["lv-course"],
        "{{SEMESTER}}": metas["lv-semester"],
        "{{SUBJECT_SLUG}}": slug,
    }
    for token, value in replacements.items():
        html_out = html_out.replace(token, value)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html_out)

    print("✓ Created subjects/%s/chapter-%s.html — “%s”" % (slug, chapter_num, title))
    print("  (Keywords meta is a placeholder — edit the <meta name=\"lv-keywords\"> line.)")

    # refresh the search index
    builder = os.path.join(ROOT, "tools", "build-search.py")
    try:
        subprocess.run([sys.executable, builder], check=True)
    except Exception as e:
        print("! Could not auto-run build-search.py (%s)" % e)
        print("  Run it manually: python tools/build-search.py")

    print("""
NEXT STEPS (2 minutes):
  1. Write your notes inside <article class="notes"> in the new file.
     Component cookbook: GUIDE.md
  2. Add a chapter card to subjects/%s/index.html:

       <a class="chapter-row" href="chapter-%s.html">
         <span class="chapter-num">%s</span>
         <span class="chapter-info">
           <span class="chapter-title">%s</span>
           <span class="chapter-desc">One-line description.</span>
           <span class="note-tags"><span class="tag tag-full">FULL NOTES</span></span>
         </span>
         <span class="chapter-cta">READ CHAPTER →</span>
       </a>

  3. Update PREVIOUS/NEXT links in this chapter and the neighbouring one.
  4. After adding the chapter card (step 2), run the builder once more so the
     search index AND the ALL CHAPTERS lists on every chapter page include it:

       python tools/build-search.py
""" % (slug, chapter_num, chapter_num, title.upper()))


if __name__ == "__main__":
    main()
