/* ============================================================
   LOKESHVERSE — SITE CONFIG
   This is the ONE place to change site-wide settings.
   ============================================================ */

window.LV_CONFIG = {

  /* ------------------------------------------------------------
     SPOTIFY EMBED — "LISTENING WHILE BUILDING THIS"
     ------------------------------------------------------------
     Replace the URL below with YOUR playlist / album / track
     embed URL to make it yours.

     HOW TO GET YOUR EMBED URL:
       1. Open your playlist in Spotify (desktop or web).
       2. Share -> "Embed playlist" (or right-click -> Share ->
          Embed track/album/playlist).
       3. Copy the src URL of the iframe. It looks like:
          https://open.spotify.com/embed/playlist/XXXXXXXXXXXX...
       4. Paste it below, keeping the ?utm_source=generator part.

     NOTE: This is the music Lokesh was listening to WHILE
     BUILDING Lokeshverse — it is not a "now playing" widget,
     and it never autoplays.
  ------------------------------------------------------------ */
  SPOTIFY_EMBED_URL: "https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0",

  /* Embed height in px. Tracks: 152, Playlists: 352–380. */
  SPOTIFY_EMBED_HEIGHT: 352

  /* ------------------------------------------------------------
     LIVE VISITORS is configured separately in:
        js/visitors.js   (Firebase config at the top)
     See README.md for the 5-minute setup guide.
  ------------------------------------------------------------ */
};
