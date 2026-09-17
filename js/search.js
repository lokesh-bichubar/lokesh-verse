/* ============================================================
   LOKESHVERSE — search.js
   Client-side search over js/search-data.js (auto-generated
   by tools/build-search.py). Searches subject names, chapter
   titles, topics, keywords and the text inside the notes.
   ============================================================ */
(function () {
  "use strict";

  var IDX = window.SEARCH_INDEX || [];

  var form = document.getElementById("searchForm");
  var input = document.getElementById("searchInput");
  var resultsEl = document.getElementById("searchResults");
  var countEl = document.getElementById("resultCount");
  var clearBtn = document.getElementById("clearFilters");

  var FILTER_IDS = ["filterUniversity", "filterCourse", "filterSemester", "filterSubject"];
  var filters = {};
  FILTER_IDS.forEach(function (id) { filters[id] = document.getElementById(id); });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* ---------- Populate filter dropdowns from the index ---------- */
  function fillSelect(sel, key, allLabel) {
    if (!sel) return;
    var seen = {};
    IDX.forEach(function (e) {
      var v = e[key];
      if (v && !seen[v]) seen[v] = true;
    });
    Object.keys(seen).sort().forEach(function (v) {
      var o = document.createElement("option");
      o.value = v;
      o.textContent = v.toUpperCase();
      sel.appendChild(o);
    });
  }
  fillSelect(filters.filterUniversity, "university", "university");
  fillSelect(filters.filterCourse, "course", "course");
  fillSelect(filters.filterSemester, "semester", "semester");
  fillSelect(filters.filterSubject, "subject", "subject");

  /* ---------- Query helpers ---------- */
  function tokenize(q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
  }

  function haystack(e) {
    return (
      (e.title || "") + " " +
      (e.label || "") + " " +
      (e.subject || "") + " " +
      (e.keywords || []).join(" ") + " " +
      (e.noteTypes || []).join(" ") + " " +
      (e.topics || []).join(" ") + " " +
      (e.text || "")
    ).toLowerCase();
  }

  function matchScore(e, tokens) {
    if (!tokens.length) return 1;
    var hay = haystack(e);
    var titleLow = ((e.title || "") + " " + (e.label || "")).toLowerCase();
    var kwLow = (e.keywords || []).join(" ").toLowerCase();
    var all = tokens.every(function (t) { return hay.indexOf(t) !== -1; });
    if (!all) return 0;
    var score = 1;
    tokens.forEach(function (t) {
      if (titleLow.indexOf(t) !== -1) score += 4;
      if (kwLow.indexOf(t) !== -1) score += 2;
    });
    return score;
  }

  function findTopic(e, tokens) {
    var topics = e.topics || [];
    for (var i = 0; i < topics.length; i++) {
      var low = topics[i].toLowerCase();
      for (var j = 0; j < tokens.length; j++) {
        if (low.indexOf(tokens[j]) !== -1) return topics[i];
      }
    }
    return null;
  }

  function snippet(e, tokens) {
    var text = e.text || "";
    if (!tokens.length) return text.slice(0, 150) + (text.length > 150 ? "\u2026" : "");
    var low = text.toLowerCase();
    var pos = -1;
    tokens.forEach(function (t) {
      var p = low.indexOf(t);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    });
    var s;
    if (pos === -1) {
      s = text.slice(0, 150);
    } else {
      var start = Math.max(0, pos - 65);
      var end = Math.min(text.length, pos + 150);
      s = (start > 0 ? "\u2026" : "") + text.slice(start, end) + (end < text.length ? "\u2026" : "");
    }
    var re = new RegExp("(" + tokens.map(escRe).join("|") + ")", "gi");
    return esc(s).replace(re, "<mark>$1</mark>");
  }

  function activeFilters() {
    var f = {};
    FILTER_IDS.forEach(function (id) {
      var sel = filters[id];
      if (sel && sel.value) f[id.replace("filter", "").toLowerCase()] = sel.value;
    });
    return f;
  }

  function passFilters(e, f) {
    var keys = Object.keys(f);
    for (var i = 0; i < keys.length; i++) {
      if ((e[keys[i]] || "") !== f[keys[i]]) return false;
    }
    return true;
  }

  function tagHtml(types) {
    return (types || []).map(function (t) {
      var cls = {
        "FULL NOTES": "tag-full",
        "SHORT NOTES": "tag-short",
        "ONE-SHOT REVISION": "tag-oneshot",
        "FORMULA SHEET": "tag-formula",
        "IMPORTANT QUESTIONS": "tag-questions"
      }[t] || "tag";
      return '<span class="tag ' + cls + '">' + esc(t) + "</span>";
    }).join("");
  }

  /* ---------- Render ---------- */
  function render() {
    var q = (input && input.value) || "";
    var tokens = tokenize(q.trim());
    var f = activeFilters();

    var hits = IDX.map(function (e) {
      return { e: e, score: matchScore(e, tokens) };
    }).filter(function (h) { return h.score > 0 && passFilters(h.e, f); })
      .sort(function (a, b) { return b.score - a.score; });

    /* group by subject, keep original chapter order inside */
    var groups = {};
    var order = [];
    hits.forEach(function (h) {
      var s = h.e.subject;
      if (!groups[s]) { groups[s] = []; order.push(s); }
      groups[s].push(h.e);
    });

    var searching = tokens.length > 0;
    countEl.textContent = searching
      ? hits.length + " RESULT" + (hits.length === 1 ? "" : "S") + " FOR \u201C" + q.trim().toUpperCase() + "\u201D"
      : IDX.length + " PAGES INDEXED \u2014 BROWSING ALL";

    if (!hits.length) {
      resultsEl.innerHTML =
        '<div class="empty-state">' +
        '<p class="big">NO RESULTS FOUND</p>' +
        "<p>Nothing in the verse matches \u201C" + esc(q.trim()) + "\u201D. Try a different keyword, or clear the filters.</p>" +
        '<ul class="suggest-chips">' +
        '<li><a href="?q=linked+list">linked list</a></li>' +
        '<li><a href="?q=binary+tree">binary tree</a></li>' +
        '<li><a href="?q=big-o">big-o</a></li>' +
        '<li><a href="?q=integration">integration</a></li>' +
        '<li><a href="?q=matrix">matrix</a></li>' +
        "</ul></div>";
      return;
    }

    var html = "";
    order.forEach(function (subject) {
      var entries = groups[subject];
      var meta = entries[0];
      html += '<div class="result-group">' +
        '<div class="result-subject-bar">' +
        '<a href="' + esc(meta.subjectUrl) + '">' + esc(subject.toUpperCase()) + "</a>" +
        '<span class="rs-meta">' + esc(meta.university) + " \u2022 " + esc(meta.course) + " \u2022 " + esc(meta.semester) + "</span>" +
        "</div>";

      entries.forEach(function (e) {
        var topic = findTopic(e, tokens);
        var path = esc(e.subject) +
          '<span class="sep">/</span>' + esc(e.label || "Subject page") +
          (topic ? '<span class="sep">/</span><strong>' + esc(topic) + "</strong>" : "");
        html +=
          '<a class="result-card" href="' + esc(e.url) + '">' +
          '<div class="result-top">' +
          (e.kind === "chapter"
            ? '<span class="result-chip">CHAPTER ' + esc(e.chapterNum) + "</span>"
            : '<span class="result-chip" style="background:#101010">SUBJECT</span>') +
          '<span class="result-title">' + esc(e.title) + "</span>" +
          tagHtml(e.noteTypes) +
          "</div>" +
          '<div class="result-path">' + path + "</div>" +
          '<p class="result-snippet">' + snippet(e, tokens) + "</p>" +
          '<span class="result-cta">' + (e.kind === "chapter" ? "READ NOTES \u2192" : "VIEW SUBJECT \u2192") + "</span>" +
          "</a>";
      });
      html += "</div>";
    });
    resultsEl.innerHTML = html;
  }

  /* ---------- Events ---------- */
  var debounceId = null;
  if (input) {
    input.addEventListener("input", function () {
      clearTimeout(debounceId);
      debounceId = setTimeout(function () {
        try {
          var u = new URL(window.location.href);
          if (input.value.trim()) u.searchParams.set("q", input.value.trim());
          else u.searchParams.delete("q");
          window.history.replaceState(null, "", u);
        } catch (e) { /* older browsers */ }
        render();
      }, 130);
    });
  }
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
  FILTER_IDS.forEach(function (id) {
    if (filters[id]) filters[id].addEventListener("change", render);
  });
  if (clearBtn) clearBtn.addEventListener("click", function () {
    FILTER_IDS.forEach(function (id) { if (filters[id]) filters[id].value = ""; });
    if (input) input.value = "";
    render();
  });

  /* ---------- Deep-link support: search.html?q=binary+tree ---------- */
  try {
    var q = new URLSearchParams(window.location.search).get("q");
    if (q && input) input.value = q;
  } catch (e) { /* ignore */ }

  render();
  if (input) input.focus();
})();
