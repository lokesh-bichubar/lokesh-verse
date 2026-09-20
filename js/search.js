/* =========================================================
   LOKESHVERSE — js/search.js
   Client-side search across subjects, chapters & topics.

   ⚙️ WHENEVER YOU ADD A SUBJECT / CHAPTER / TOPIC:
   add matching entries to SEARCH_INDEX below. That's it —
   filters and results update automatically.
   ========================================================= */
(function () {
  "use strict";

  /* ═════════════════════════════════════════════
     ⚙️ SEARCH INDEX — EDIT THIS BLOCK
     type: "subject" | "chapter" | "topic"
     ═════════════════════════════════════════════ */
  var SEARCH_INDEX = [
    {
      type: "subject",
      title: "Data Structures",
      university: "Quantum University",
      course: "B.Tech CSE",
      semester: "Semester 01",
      subject: "Data Structures",
      url: "subjects/data-structures/",
      keywords: "data structures ds arrays linked list stack queue tree graph core subject introduction",
      snippet: "Fundamentals of data structures, algorithms and their implementation — organized chapter by chapter."
    },
    {
      type: "chapter",
      title: "Chapter 01 — Introduction to Data Structures",
      university: "Quantum University",
      course: "B.Tech CSE",
      semester: "Semester 01",
      subject: "Data Structures",
      url: "subjects/data-structures/chapter-01.html",
      keywords: "introduction what is data structure why need organization primitive derived linear non linear abstract data type adt array time space complexity full notes",
      snippet: "What a data structure is, why programs need them, how they are classified, and your first look at arrays."
    },
    {
      type: "topic",
      title: "1.1 What is a Data Structure?",
      university: "Quantum University",
      course: "B.Tech CSE",
      semester: "Semester 01",
      subject: "Data Structures",
      chapter: "Chapter 01",
      url: "subjects/data-structures/chapter-01.html#what-is-a-data-structure",
      keywords: "definition organize store access modify efficiently data structure meaning",
      snippet: "A data structure is a way of organizing and storing data so that it can be accessed and modified efficiently."
    },
    {
      type: "topic",
      title: "1.2 Why Do We Need Data Structures?",
      university: "Quantum University",
      course: "B.Tech CSE",
      semester: "Semester 01",
      subject: "Data Structures",
      chapter: "Chapter 01",
      url: "subjects/data-structures/chapter-01.html#why-do-we-need-data-structures",
      keywords: "why need importance search speed program performance phone contacts example",
      snippet: "Choosing the right structure is the difference between a program that runs in seconds and one that takes hours."
    },
    {
      type: "topic",
      title: "1.3 Classification of Data Structures",
      university: "Quantum University",
      course: "B.Tech CSE",
      semester: "Semester 01",
      subject: "Data Structures",
      chapter: "Chapter 01",
      url: "subjects/data-structures/chapter-01.html#classification-of-data-structures",
      keywords: "classification types primitive derived linear nonlinear non-linear stack queue tree graph categories table",
      snippet: "Primitive vs derived, linear vs non-linear — the full family tree of data structures in one table."
    },
    {
      type: "topic",
      title: "1.4 Arrays — Your First Data Structure",
      university: "Quantum University",
      course: "B.Tech CSE",
      semester: "Semester 01",
      subject: "Data Structures",
      chapter: "Chapter 01",
      url: "subjects/data-structures/chapter-01.html#arrays-your-first-data-structure",
      keywords: "array arrays index indexing base address formula contiguous memory python code example loc a i",
      snippet: "Contiguous memory, O(1) indexing, and the address formula: Loc(A[i]) = Base(A) + i × W."
    },
    {
      type: "topic",
      title: "1.5 Quick Revision",
      university: "Quantum University",
      course: "B.Tech CSE",
      semester: "Semester 01",
      subject: "Data Structures",
      chapter: "Chapter 01",
      url: "subjects/data-structures/chapter-01.html#quick-revision",
      keywords: "quick revision recap key points summary one shot remember",
      snippet: "The whole chapter in five bullet points — perfect for the night before the exam."
    }
  ];
  /* ═════════════════════════════════════════════ */

  var input = document.getElementById("search-input");
  var resultsWrap = document.getElementById("search-results");
  var metaEl = document.getElementById("results-meta");
  var searchBtn = document.getElementById("search-button");
  if (!input || !resultsWrap) return;

  var filters = {
    university: document.getElementById("filter-university"),
    course: document.getElementById("filter-course"),
    semester: document.getElementById("filter-semester"),
    subject: document.getElementById("filter-subject")
  };

  var TYPE_STYLES = {
    subject: { cls: "tag-purple", label: "SUBJECT" },
    chapter: { cls: "tag-pink", label: "CHAPTER" },
    topic:   { cls: "tag-cyan", label: "TOPIC" }
  };

  function unique(field) {
    var out = [];
    SEARCH_INDEX.forEach(function (item) {
      if (item[field] && out.indexOf(item[field]) === -1) out.push(item[field]);
    });
    return out.sort();
  }

  function fillSelect(sel, values, label) {
    if (!sel) return;
    sel.innerHTML = "";
    var all = document.createElement("option");
    all.value = "";
    all.textContent = label;
    sel.appendChild(all);
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v.toUpperCase();
      sel.appendChild(opt);
    });
  }

  fillSelect(filters.university, unique("university"), "ALL UNIVERSITIES");
  fillSelect(filters.course, unique("course"), "ALL COURSES");
  fillSelect(filters.semester, unique("semester"), "ALL SEMESTERS");
  fillSelect(filters.subject, unique("subject"), "ALL SUBJECTS");

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlight(text, words) {
    var safe = escapeHtml(text);
    if (!words.length) return safe;
    var pattern = words
      .map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); })
      .join("|");
    if (!pattern) return safe;
    try {
      return safe.replace(new RegExp("(" + pattern + ")", "gi"), "<mark>$1</mark>");
    } catch (e) {
      return safe;
    }
  }

  function scoreItem(item, words) {
    var score = 0;
    var haystackTitle = item.title.toLowerCase();
    var haystackKeys = ((item.keywords || "") + " " + (item.subject || "")).toLowerCase();
    var haystackSnip = (item.snippet || "").toLowerCase();
    words.forEach(function (w) {
      if (haystackTitle.indexOf(w) !== -1) score += 6;
      if (haystackKeys.indexOf(w) !== -1) score += 3;
      if (haystackSnip.indexOf(w) !== -1) score += 2;
    });
    return score;
  }

  function runSearch() {
    var query = input.value.trim().toLowerCase();
    var words = query ? query.split(/\s+/).filter(Boolean) : [];

    var list = SEARCH_INDEX.filter(function (item) {
      if (filters.university && filters.university.value && item.university !== filters.university.value) return false;
      if (filters.course && filters.course.value && item.course !== filters.course.value) return false;
      if (filters.semester && filters.semester.value && item.semester !== filters.semester.value) return false;
      if (filters.subject && filters.subject.value && item.subject !== filters.subject.value) return false;
      return true;
    });

    var results;
    if (!words.length) {
      results = list.map(function (item) { return { item: item, score: 0 }; });
    } else {
      results = [];
      list.forEach(function (item) {
        var s = scoreItem(item, words);
        if (s > 0) results.push({ item: item, score: s });
      });
      results.sort(function (a, b) { return b.score - a.score; });
    }

    render(results, words, query);
  }

  function render(results, words, query) {
    if (metaEl) {
      metaEl.textContent = query
        ? results.length + " RESULT" + (results.length === 1 ? "" : "S") + ' FOR "' + query.toUpperCase() + '"'
        : "BROWSING EVERYTHING — " + results.length + " ITEM" + (results.length === 1 ? "" : "S");
    }

    if (!results.length) {
      resultsWrap.innerHTML =
        '<div class="brutal-card empty-state">' +
        '  <div class="empty-face">¯\\_(ツ)_/¯</div>' +
        '  <h3>NOTHING FOUND</h3>' +
        '  <p>No notes match that yet. Lokesh is probably still writing them — try another keyword or clear the filters.</p>' +
        "</div>";
      return;
    }

    var html = '<div class="results-list">';
    results.forEach(function (r) {
      var item = r.item;
      var t = TYPE_STYLES[item.type] || TYPE_STYLES.topic;
      var path = [item.university, item.course, item.semester, item.subject, item.chapter]
        .filter(Boolean)
        .join(" / ");
      html +=
        '<article class="brutal-card result-card">' +
        '  <div class="result-top">' +
        '    <span class="tag ' + t.cls + '">' + t.label + "</span>" +
        (item.type === "topic"
          ? '<span class="tag tag-yellow">' + escapeHtml(item.chapter || "") + "</span>"
          : "") +
        '    <span class="result-path">' + escapeHtml(path) + "</span>" +
        "  </div>" +
        '  <h3>' + highlight(item.title, words) + "</h3>" +
        '  <p>' + highlight(item.snippet, words) + "</p>" +
        '  <a href="' + item.url + '" class="brutal-button btn-black">OPEN NOTES →</a>' +
        "</article>";
    });
    html += "</div>";
    resultsWrap.innerHTML = html;
  }

  /* events */
  var debounce;
  input.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(runSearch, 120);
  });
  if (searchBtn) searchBtn.addEventListener("click", runSearch);
  Object.keys(filters).forEach(function (k) {
    if (filters[k]) filters[k].addEventListener("change", runSearch);
  });

  document.querySelectorAll("[data-chip]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      input.value = chip.getAttribute("data-chip");
      runSearch();
      input.focus();
    });
  });

  /* support search.html?q=something */
  var params = new URLSearchParams(window.location.search);
  var q = params.get("q");
  if (q) input.value = q;
  runSearch();
})();
