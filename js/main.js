/* ============================================================
   LOKESHVERSE — main.js
   Nav, progress bar, back-to-top, code copy + highlight,
   reading time, auto TOC, Spotify embed. No frameworks.
   ============================================================ */
(function () {
  "use strict";

  var d = document;
  function $(sel, ctx) { return (ctx || d).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }

  /* ---------- Root path (pages live in nested folders) ---------- */
  var ROOT = d.body.getAttribute("data-root") || "";

  /* ---------- Mobile navigation ---------- */
  var header = $(".site-header");
  var toggle = $(".nav-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".site-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- "/" jumps to search (when not typing) ---------- */
  d.addEventListener("keydown", function (e) {
    var tag = d.activeElement ? d.activeElement.tagName : "";
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag)) {
      e.preventDefault();
      window.location.href = ROOT + "search.html";
    }
  });

  /* ---------- Reading progress bar (chapter pages) ---------- */
  if (d.body.getAttribute("data-page") === "chapter") {
    var bar = d.createElement("div");
    bar.className = "reading-progress";
    bar.setAttribute("aria-hidden", "true");
    d.body.appendChild(bar);
    var ticking = false;
    function updateProgress() {
      var h = d.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop || d.body.scrollTop) / max * 100 : 0;
      bar.style.width = pct.toFixed(2) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(updateProgress); ticking = true; }
    }, { passive: true });
    updateProgress();
  }

  /* ---------- Back to top ---------- */
  var toTop = d.createElement("button");
  toTop.type = "button";
  toTop.className = "back-to-top";
  toTop.setAttribute("aria-label", "Back to top");
  toTop.innerHTML = "&uarr;";
  d.body.appendChild(toTop);
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  var topTicking = false;
  function updateToTop() {
    toTop.classList.toggle("show", (window.pageYOffset || 0) > 480);
    topTicking = false;
  }
  window.addEventListener("scroll", function () {
    if (!topTicking) { window.requestAnimationFrame(updateToTop); topTicking = true; }
  }, { passive: true });
  updateToTop();

  /* ---------- Tiny syntax highlighter ---------- */
  var KEYWORDS = {
    c: "auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|include|define|NULL|stdio\\.h|stdlib\\.h",
    cpp: "auto|break|case|catch|char|class|const|continue|default|delete|do|double|else|enum|extern|float|for|friend|goto|if|inline|int|long|new|namespace|operator|private|protected|public|return|short|signed|sizeof|static|struct|switch|template|this|throw|try|typedef|union|unsigned|using|virtual|void|volatile|while|include|define|std|cout|cin|endl|vector|NULL|nullptr",
    python: "and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield|print|len|range|self",
    js: "await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|true|false|null|undefined"
  };

  function escHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(escaped, lang) {
    var kw = KEYWORDS[lang];
    if (!kw) return escaped;
    var commentRe = (lang === "python") ? "#[^\\n]*" : "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";
    var re = new RegExp(
      "(" + commentRe + ")" +
      "|(\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*')" +
      "|\\b(" + kw + ")\\b" +
      "|\\b(\\d+(?:\\.\\d+)?)\\b",
      "g"
    );
    return escaped.replace(re, function (m, c, s, k, n) {
      if (c) return '<span class="tok-c">' + c + "</span>";
      if (s) return '<span class="tok-s">' + s + "</span>";
      if (k) return '<span class="tok-k">' + k + "</span>";
      return '<span class="tok-n">' + n + "</span>";
    });
  }

  $$(".code-block code[data-lang]").forEach(function (el) {
    var lang = (el.getAttribute("data-lang") || "").toLowerCase();
    el.innerHTML = highlight(escHtml(el.textContent), lang);
  });

  /* ---------- Copy code buttons ---------- */
  $$(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var block = btn.closest(".code-block");
      var code = block ? block.querySelector("code") : null;
      if (!code) return;
      var text = code.textContent;

      function done(ok) {
        btn.textContent = ok ? "COPIED \u2713" : "PRESS CTRL+C";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = "COPY";
          btn.classList.remove("copied");
        }, 1500);
      }
      function fallback() {
        var ta = d.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        d.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = d.execCommand("copy"); } catch (e) { ok = false; }
        d.body.removeChild(ta);
        done(ok);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    });
  });

  /* ---------- Reading time (chapter pages) ---------- */
  $$(".readtime[data-readtime]").forEach(function (el) {
    var notes = $(".notes") || d.body;
    var words = (notes.textContent || "").trim().split(/\s+/).length;
    var mins = Math.max(1, Math.round(words / 180));
    el.textContent = "\u2248 " + mins + " MIN READ";
  });

  /* ---------- Auto table of contents ---------- */
  var notes = $(".notes[data-toc]");
  if (notes) {
    var heads = $$("h2", notes);
    if (heads.length > 2) {
      var toc = d.createElement("nav");
      toc.className = "toc";
      toc.setAttribute("aria-label", "Table of contents");
      var title = d.createElement("div");
      title.className = "toc-title";
      title.textContent = "ON THIS PAGE";
      var ul = d.createElement("ul");
      var used = {};
      heads.forEach(function (h) {
        if (!h.id) {
          var base = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
          var id = base, i = 2;
          while (used[id]) { id = base + "-" + i; i++; }
          used[id] = true;
          h.id = id;
        }
        var li = d.createElement("li");
        var a = d.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        ul.appendChild(li);
      });
      toc.appendChild(title);
      toc.appendChild(ul);
      notes.insertBefore(toc, notes.firstChild);
    }
  }

  /* ---------- ALL CHAPTERS list on chapter pages ----------
     Rendered from window.LV_CHAPTERS (js/chapters.js, auto-generated
     by tools/build-search.py from each subject page's chapter list).
     Uses the exact same .chapter-row classes as the subject pages,
     so every subject's chapter list looks identical everywhere.
     The chapter currently being read is highlighted. */
  var chapterSlot = $("[data-chapters]");
  if (chapterSlot && window.LV_CHAPTERS) {
    var subjectData = window.LV_CHAPTERS[chapterSlot.getAttribute("data-chapters")];
    if (subjectData && subjectData.chapters && subjectData.chapters.length) {
      var metaNum = $('meta[name="lv-chapter-num"]');
      var currentNum = metaNum ? (parseInt(metaNum.getAttribute("content"), 10) || 0) : 0;

      var TAG_CLASS = {
        "FULL NOTES": "tag-full",
        "SHORT NOTES": "tag-short",
        "ONE-SHOT REVISION": "tag-oneshot",
        "FORMULA SHEET": "tag-formula",
        "IMPORTANT QUESTIONS": "tag-questions"
      };

      var listSec = d.createElement("section");
      listSec.className = "chapter-list";
      var listTitle = d.createElement("h2");
      listTitle.className = "section-title";
      listTitle.innerHTML = 'ALL CHAPTERS <span class="tick">//</span>';
      listSec.appendChild(listTitle);

      subjectData.chapters.forEach(function (ch) {
        var isCurrent = parseInt(ch.num, 10) === currentNum;
        var row = d.createElement(isCurrent ? "div" : "a");
        row.className = "chapter-row" + (isCurrent ? " current" : "");
        if (isCurrent) {
          row.setAttribute("aria-current", "location");
        } else {
          row.href = ch.href;
        }

        var numEl = d.createElement("span");
        numEl.className = "chapter-num";
        numEl.textContent = ch.num;
        row.appendChild(numEl);

        var info = d.createElement("span");
        info.className = "chapter-info";

        var titleEl = d.createElement("span");
        titleEl.className = "chapter-title";
        titleEl.textContent = ch.title;
        info.appendChild(titleEl);

        var descEl = d.createElement("span");
        descEl.className = "chapter-desc";
        descEl.textContent = ch.desc || "";
        info.appendChild(descEl);

        var tagWrap = d.createElement("span");
        tagWrap.className = "note-tags";
        (ch.tags || []).forEach(function (name) {
          var tg = d.createElement("span");
          tg.className = "tag " + (TAG_CLASS[name] || "");
          tg.textContent = name;
          tagWrap.appendChild(tg);
        });
        info.appendChild(tagWrap);
        row.appendChild(info);

        var cta = d.createElement("span");
        cta.className = "chapter-cta";
        cta.textContent = isCurrent ? "\u25CF YOU ARE HERE" : "READ CHAPTER \u2192";
        row.appendChild(cta);

        listSec.appendChild(row);
      });

      chapterSlot.appendChild(listSec);
    }
  }

  /* ---------- Spotify embed (config in js/config.js) ---------- */
  var cfg = window.LV_CONFIG || {};
  $$("[data-spotify-slot]").forEach(function (slot) {
    var url = cfg.SPOTIFY_EMBED_URL || "";
    var h = parseInt(cfg.SPOTIFY_EMBED_HEIGHT, 10) || 352;
    if (url && url.indexOf("open.spotify.com/embed") !== -1) {
      var frame = d.createElement("iframe");
      frame.setAttribute("src", url);
      frame.setAttribute("title", "Spotify embed \u2014 listening while building Lokeshverse");
      frame.setAttribute("loading", "lazy");
      frame.setAttribute("allow", "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture");
      frame.style.height = h + "px";
      slot.innerHTML = "";
      slot.appendChild(frame);
      var open = d.createElement("a");
      open.className = "spotify-open";
      open.href = url.replace("/embed/", "/");
      open.target = "_blank";
      open.rel = "noopener";
      open.textContent = "OPEN IN SPOTIFY \u2197";
      slot.appendChild(open);
    } else {
      slot.innerHTML =
        '<div class="spotify-placeholder">\uD83C\uDFA7 SPOTIFY EMBED SLOT<br>' +
        "<span>set SPOTIFY_EMBED_URL in js/config.js</span></div>";
    }
  });

  /* ---------- Current year in footer ---------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
