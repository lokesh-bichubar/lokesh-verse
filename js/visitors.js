/* =========================================================
   LOKESHVERSE — js/visitors.js
   REAL live-visitor counter (no fake numbers).

   HOW IT WORKS
   • Uses Firebase Realtime Database "presence" pattern.
   • Each browser tab gets an id stored in sessionStorage,
     so refreshing the page does NOT add a new visitor.
   • The tab writes { lastSeen } every 25s (heartbeat).
   • Firebase `onDisconnect()` removes the visitor if the
     browser closes / loses network.
   • Count = visitors whose heartbeat is newer than 70s.
   • If Firebase is NOT configured yet, the pill honestly
     shows "—" and a note — it never invents a number.

   SETUP (5 minutes, free)
   1. Go to https://console.firebase.google.com → create a project.
   2. Build → Realtime Database → Create database (test mode is fine to start).
   3. Project settings → "Your apps" → Web app → copy the config.
   4. Paste it into VISITOR_CONFIG below.
   5. (Recommended once you launch) tighten your RTDB rules, e.g.
        {
          "rules": {
            "presence": {
              ".read": true,
              "$uid": { ".write": true, ".validate": "newData.hasChildren(['lastSeen'])" }
            }
          }
        }
   ========================================================= */
(function () {
  "use strict";

  /* ═════════════════════════════════════════════
     ⚙️ VISITOR COUNTER CONFIG — EDIT THIS BLOCK
     ═════════════════════════════════════════════ */
  var VISITOR_CONFIG = {
    firebase: {
      apiKey:        "PASTE_YOUR_API_KEY",
      authDomain:    "PASTE_YOUR_PROJECT.firebaseapp.com",
      databaseURL:   "https://PASTE_YOUR_PROJECT-default-rtdb.firebaseio.com",
      projectId:     "PASTE_YOUR_PROJECT",
      storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
      appId:         "PASTE_YOUR_APP_ID"
    },
    heartbeatSeconds: 25,   // how often this tab says "still here"
    staleAfterSeconds: 70   // visitors older than this are not counted
  };
  /* ═════════════════════════════════════════════ */

  var countEls = document.querySelectorAll("[data-live-visitors]");
  var dotEls = document.querySelectorAll("[data-visitor-dot]");
  var noteEls = document.querySelectorAll("[data-visitor-note]");

  function setCount(text) {
    countEls.forEach(function (el) { el.textContent = text; });
  }
  function setNote(text) {
    noteEls.forEach(function (el) { el.textContent = text; });
  }

  var cfg = VISITOR_CONFIG.firebase;
  var configured =
    cfg &&
    cfg.apiKey &&
    cfg.databaseURL &&
    cfg.apiKey.indexOf("PASTE") === -1 &&
    cfg.databaseURL.indexOf("PASTE") === -1;

  if (!configured) {
    setCount("—");
    dotEls.forEach(function (el) { el.classList.add("offline"); });
    setNote("Counter offline — paste your Firebase config in js/visitors.js");
    return;
  }

  /* Stable per-tab id → refreshes don't create extra visitors */
  var visitorId = sessionStorage.getItem("lv-visitor-id");
  if (!visitorId) {
    visitorId = "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem("lv-visitor-id", visitorId);
  }

  (async function run() {
    try {
      var appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      var dbMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");

      var app = appMod.initializeApp(cfg);
      var db = dbMod.getDatabase(app);
      var myRef = dbMod.ref(db, "presence/" + visitorId);

      var heartbeat = function () {
        return dbMod.set(myRef, { lastSeen: dbMod.serverTimestamp() });
      };

      heartbeat();
      dbMod.onDisconnect(myRef).remove();

      var interval = setInterval(heartbeat, VISITOR_CONFIG.heartbeatSeconds * 1000);

      /* remove our presence if the tab is closed/hidden for long */
      window.addEventListener("pagehide", function () {
        clearInterval(interval);
        dbMod.remove(myRef);
      });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") heartbeat();
      });

      /* listen to everyone's presence and count fresh ones */
      var staleMs = VISITOR_CONFIG.staleAfterSeconds * 1000;
      var lastCleanup = 0;

      dbMod.onValue(dbMod.ref(db, "presence"), function (snap) {
        var now = Date.now();
        var count = 0;
        var staleIds = [];
        snap.forEach(function (child) {
          var lastSeen = child.val() && child.val().lastSeen;
          if (typeof lastSeen === "number" && now - lastSeen < staleMs) {
            count++;
          } else if (child.key !== visitorId) {
            staleIds.push(child.key);
          }
        });
        setCount(String(count));

        /* occasionally sweep stale entries left behind by crashes */
        if (staleIds.length && now - lastCleanup > 30000) {
          lastCleanup = now;
          staleIds.forEach(function (id) {
            dbMod.remove(dbMod.ref(db, "presence/" + id));
          });
        }
      }, function () {
        setCount("—");
        setNote("Counter could not connect. Check Firebase rules.");
      });
    } catch (err) {
      setCount("—");
      setNote("Counter error — check the config in js/visitors.js");
    }
  })();
})();
