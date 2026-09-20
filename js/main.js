/* =========================================================
   LOKESHVERSE — js/main.js
   Tiny shared interactions used on EVERY page:
   • mobile nav toggle
   • copy-code buttons
   • reading progress bar (chapters)
   • back-to-top button
   • footer year
   No libraries. Keep it this light. 🙏
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. Mobile navigation ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "✕" : "☰";
    });
    // close menu when a link inside it is clicked
    header.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      });
    });
  }

  /* ---------- 2. Copy-code buttons ---------- */
  document.querySelectorAll(".code-block").forEach(function (block) {
    var btn = block.querySelector(".copy-btn");
    var code = block.querySelector("pre code");
    if (!btn || !code) return;
    btn.addEventListener("click", function () {
      var text = code.innerText;
      function done() {
        btn.classList.add("copied");
        btn.textContent = "COPIED ✔";
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.textContent = "COPY CODE";
        }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------- 3. Reading progress bar ---------- */
  var bar = document.querySelector(".progress-bar");
  if (bar) {
    var ticking = false;
    function updateBar() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();
  }

  /* ---------- 4. Back to top ---------- */
  var toTop = document.querySelector(".back-to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("visible", window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 5. Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
