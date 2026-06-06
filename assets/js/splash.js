/**
 * splash.js — Manages the IdealHub splash screen lifecycle.
 *
 * Timeline:
 *   0.20s  → Logo bounces in
 *   0.70s  → Brand name fades up
 *   0.95s  → Subtitle fades up
 *   1.10s  → Loader bar appears
 *   1.20s  → Loader progress starts (1.8s animation)
 *   ~3.20s → Progress complete → fade-out begins
 *   ~3.90s → Element removed from DOM
 */
(function () {
  "use strict";

  const DISMISS_DELAY_MS = 3100; // matches animation total: ~1.2 + 1.8s + small buffer
  const TRANSITION_MS = 700;     // matches CSS transition duration

  function dismissSplash() {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;

    // Trigger the fade-out CSS transition
    splash.classList.add("splash-hidden");

    // Remove from DOM after transition so it can't block interactions
    setTimeout(function () {
      if (splash && splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, TRANSITION_MS + 50);
  }

  // Kick off on DOMContentLoaded (assets may still be fetching, but UI is ready)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(dismissSplash, DISMISS_DELAY_MS);
    });
  } else {
    // DOMContentLoaded already fired
    setTimeout(dismissSplash, DISMISS_DELAY_MS);
  }
})();
