/* ============================================================
   LOKESHVERSE — LIVE VISITORS (real, not fake)
   ------------------------------------------------------------
   HOW IT WORKS
   ------------
   Each open tab registers itself under  liveVisitors/<sessionId>
   in Firebase Realtime Database with a heartbeat timestamp.
   - onDisconnect() removes the entry when the tab closes.
   - A heartbeat refreshes the timestamp every 30 seconds.
   - Entries older than ~2 minutes are ignored, so crashed
     tabs / dropped connections don't stay counted forever.
   - The session id lives in sessionStorage, so refreshing the
     page does NOT double-count you.

   ------------------------------------------------------------
   SETUP (5 minutes, free)
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com -> "Add project"
      (any name, e.g. "lokeshverse").
   2. In the project, go to Build -> Realtime Database ->
      "Create Database" -> start in test mode (or locked mode,
      then paste the rules from firebase-rules.json in this repo).
   3. Go to Project Settings (gear icon) -> "Your apps" ->
      Web app (</>) -> register app -> copy the firebaseConfig.
   4. Paste the values below, replacing the PASTE_ placeholders.
      IMPORTANT: databaseURL must end in .firebaseio.com or
      .firebasedatabase.app — Realtime Database, NOT Firestore.
   5. Done. Upload the site; the counter goes live on every page.

   Until configured, the footer honestly shows "—" instead of
   a made-up number.
   ============================================================ */
(function () {
  "use strict";

  /* ==========================================================
     >>> CONFIG — REPLACE THESE VALUES WITH YOUR OWN <<<
     ========================================================== */
  var FIREBASE_CONFIG = {
    apiKey: "PASTE_YOUR_API_KEY",
    authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
    databaseURL: "PASTE_YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "PASTE_YOUR_PROJECT_ID",
    storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
    messagingSenderId: "PASTE_SENDER_ID",
    appId: "PASTE_APP_ID"
  };
  /* ========================================================== */

  var HEARTBEAT_MS = 30 * 1000;   // refresh presence every 30 s
  var EXPIRY_MS = 90 * 1000;      // ignore entries older than 90 s
  var CLOCK_SKEW_MS = 60 * 1000;  // tolerance between server & local clock

  function isConfigured(cfg) {
    return !!(cfg && cfg.apiKey && cfg.databaseURL &&
      cfg.apiKey.indexOf("PASTE") === -1 &&
      cfg.databaseURL.indexOf("PASTE") === -1 &&
      (/^https:\/\/.+\.firebaseio\.com$/.test(cfg.databaseURL) ||
       /^https:\/\/.+\.firebasedatabase\.app$/.test(cfg.databaseURL)));
  }

  function setCount(val) {
    var els = document.querySelectorAll("#liveVisitorCount");
    for (var i = 0; i < els.length; i++) els[i].textContent = String(val);
  }

  if (!isConfigured(FIREBASE_CONFIG)) {
    setCount("\u2014");
    if (window.console && console.info) {
      console.info(
        "%c[LOKESHVERSE] Live visitors counter is not configured yet.\n" +
        "Open js/visitors.js and paste your Firebase Realtime Database config " +
        "where the PASTE_ placeholders are. Full guide: README.md \u2192 " +
        "\u201cLive Visitors setup\u201d.",
        "background:#7B2FFF;color:#fff;padding:4px 8px;font-weight:bold"
      );
    }
    return;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  Promise.all([
    loadScript(SDK + "firebase-app-compat.js"),
    loadScript(SDK + "firebase-database-compat.js")
  ]).then(function () {
    if (typeof firebase === "undefined") { setCount("?"); return; }

    var app = firebase.initializeApp(FIREBASE_CONFIG);
    var db = firebase.database(app);

    /* Session id: stable across refreshes within the same tab */
    var SID_KEY = "lv_session_id";
    var sid = null;
    try { sid = sessionStorage.getItem(SID_KEY); } catch (e) { /* private mode */ }
    if (!sid) {
      sid = "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
      try { sessionStorage.setItem(SID_KEY, sid); } catch (e) { /* ignore */ }
    }

    var presence = db.ref("liveVisitors/" + sid);

    function beat() {
      presence.set({
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        path: window.location.pathname
      }).catch(function () { /* offline blip */ });
    }

    presence.onDisconnect().remove();
    beat();
    setInterval(beat, HEARTBEAT_MS);
    window.addEventListener("pagehide", function () { presence.remove(); });

    function countActive(snapshot) {
      var val = snapshot.val() || {};
      var now = Date.now();
      var count = 0;
      for (var key in val) {
        if (!Object.prototype.hasOwnProperty.call(val, key)) continue;
        var t = val[key] && val[key].lastSeen;
        if (typeof t === "number" && now - t < EXPIRY_MS + CLOCK_SKEW_MS) count++;
      }
      return count;
    }

    db.ref("liveVisitors").on("value", function (snap) {
      setCount(countActive(snap));
    }, function (err) {
      console.warn("[LOKESHVERSE] Live visitors error:", err && err.message);
      setCount("?");
    });
  }).catch(function (err) {
    console.warn("[LOKESHVERSE] Could not load Firebase SDK:", err);
    setCount("?");
  });
})();
