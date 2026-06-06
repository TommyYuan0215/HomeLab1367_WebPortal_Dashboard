/**
 * splash.js — IdealHub Futuristic Splash Screen
 *
 * Features:
 *  • Web Audio API boot sound sequence (synthesized — no external files)
 *  • Typewriter effect for brand name + subtitle
 *  • JS-driven percentage counter synced to progress bar
 *  • Status text cycling
 *  • Respects 'homelab-splash-mode' setting (true = always, false = never)
 */
(function () {
  "use strict";

  /* ── Config ─────────────────────────────────────────── */
  var STORAGE_KEY    = "homelab-splash-mode";
  var TOTAL_MS       = 3600;   // total splash lifetime before dismiss
  var TRANSITION_MS  = 600;    // CSS fade-out duration

  var BRAND_TEXT     = "IdealHub";
  var SUBTITLE_TEXT  = "HomeLab1367 Web Portal";

  var STATUS_MSGS = [
    "INITIALIZING SYSTEMS",
    "LOADING SERVICES",
    "CONNECTING TO NETWORK",
    "SYSTEM READY"
  ];

  /* ── Helpers ─────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  function shouldShow() {
    var s = localStorage.getItem(STORAGE_KEY);
    return s !== "false";          // default: show
  }

  function dismissSplash(immediate) {
    var splash = $("splash-screen");
    if (!splash) return;
    if (immediate) {
      splash.style.transition = "none";
      splash.classList.add("splash-hidden");
      if (splash.parentNode) splash.parentNode.removeChild(splash);
      return;
    }
    splash.classList.add("splash-hidden");
    setTimeout(function () {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, TRANSITION_MS + 80);
  }

  /* ── Web Audio Boot Sounds ───────────────────────────── */
  var _ctx = null;

  function getCtx() {
    if (!_ctx) {
      try {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    return _ctx;
  }

  /**
   * Play a synthesized tone.
   * @param {number} freq     - frequency in Hz
   * @param {number} startSec - AudioContext time to start
   * @param {number} dur      - duration in seconds
   * @param {string} type     - oscillator type
   * @param {number} gain     - peak gain (0–1)
   * @param {number} [rampIn] - attack ramp (s), default 0.01
   */
  function playTone(freq, startSec, dur, type, gain, rampIn) {
    var ctx = getCtx();
    if (!ctx) return;
    rampIn = rampIn || 0.01;
    var osc = ctx.createOscillator();
    var g   = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, startSec);
    g.gain.setValueAtTime(0, startSec);
    g.gain.linearRampToValueAtTime(gain, startSec + rampIn);
    g.gain.exponentialRampToValueAtTime(0.0001, startSec + dur);
    osc.start(startSec);
    osc.stop(startSec + dur + 0.05);
  }

  function playScanBeep(delayMs) {
    var ctx = getCtx();
    if (!ctx) return;
    var t = ctx.currentTime + delayMs / 1000;
    // Rising frequency sweep (scan-line passing)
    var osc = ctx.createOscillator();
    var g   = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(2200, t + 0.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  function playBootSequence() {
    var ctx = getCtx();
    if (!ctx) return;
    var t = ctx.currentTime;

    // 1) Low power-on drone (fades in with logo)
    playTone(60,  t + 0.7,  1.2,  "sine",     0.06, 0.4);
    playTone(120, t + 0.7,  1.2,  "sine",     0.03, 0.4);

    // 2) Scan line sweep sound
    playScanBeep(300);

    // 3) Typewriter click ticks (one per character of "IDEALHUB")
    for (var i = 0; i < BRAND_TEXT.length; i++) {
      (function(idx) {
        var tickT = ctx.currentTime + 0.9 + idx * 0.1;
        playTone(1200 + idx * 80, tickT, 0.04, "square", 0.04);
      })(i);
    }

    // 4) Subtitle appearance blip
    playTone(880, t + 1.9, 0.12, "sine", 0.05);

    // 5) Progress ticks at ~25%, 50%, 75%
    var barStart = 1.6; // seconds from now
    [0.45, 0.9, 1.35].forEach(function(offset) {
      playTone(440, t + barStart + offset, 0.06, "square", 0.035);
    });

    // 6) SYSTEM READY — ascending arpeggio (C5 E5 G5 C6)
    var readyT = t + 3.0;
    [523, 659, 784, 1047].forEach(function(f, i) {
      playTone(f, readyT + i * 0.09, 0.25, "sine", 0.08, 0.02);
    });
  }

  /* ── Typewriter ──────────────────────────────────────── */
  function typewrite(el, text, delayMs, msPerChar, done) {
    var i = 0;
    el.textContent = "";
    setTimeout(function tick() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(tick, msPerChar);
      } else {
        if (done) done();
      }
    }, delayMs);
  }

  /* ── Percentage counter ──────────────────────────────── */
  function animateCounter(pctEl, barEl, startMs, durationMs) {
    var start = null;
    // Easing curve mirrors the progress bar CSS ease
    var curve = [0, 8, 18, 30, 43, 55, 65, 73, 80, 86, 91, 95, 98, 100];

    setTimeout(function () {
      function frame(ts) {
        if (!start) start = ts;
        var elapsed  = ts - start;
        var progress = Math.min(elapsed / durationMs, 1);
        // Map progress [0,1] → curve index
        var idx   = Math.min(Math.floor(progress * (curve.length - 1)), curve.length - 2);
        var t     = (progress * (curve.length - 1)) - idx;
        var val   = Math.round(curve[idx] + t * (curve[idx + 1] - curve[idx]));
        if (pctEl) pctEl.textContent = val + "%";
        if (barEl) barEl.style.width = val + "%";
        if (progress < 1) requestAnimationFrame(frame);
        else {
          if (pctEl) pctEl.textContent = "100%";
          if (barEl) barEl.style.width = "100%";
        }
      }
      requestAnimationFrame(frame);
    }, startMs);
  }

  /* ── Status cycling ──────────────────────────────────── */
  function cycleStatus() {
    var el  = $("splash-status");
    if (!el) return;
    var idx = 0;
    el.textContent = STATUS_MSGS[0];
    var timings = [1400, 2000, 2600, 3100]; // ms when each message shows
    timings.forEach(function(ms, i) {
      setTimeout(function() {
        if ($("splash-status")) {
          var statusEl = $("splash-status");
          statusEl.textContent = STATUS_MSGS[i] || STATUS_MSGS[STATUS_MSGS.length - 1];
        }
      }, ms);
    });
  }

  /* ── Cursor hide after typing ────────────────────────── */
  function hideCursor(delayMs) {
    setTimeout(function() {
      var cur = document.querySelector(".splash-cursor");
      if (cur) cur.style.display = "none";
    }, delayMs);
  }

  /* ── Main run ────────────────────────────────────────── */
  function run() {
    if (!shouldShow()) {
      dismissSplash(true);
      return;
    }

    // Kick off audio (requires user gesture workaround — we try immediately;
    // browsers that block autoplay will silently fail)
    playBootSequence();

    // Typewriter brand name starting at 900ms
    var brandEl    = $("splash-brand-text");
    var subtitleEl = $("splash-subtitle");
    var pctEl      = $("splash-pct");
    var barEl      = $("splash-bar");

    typewrite(brandEl, BRAND_TEXT, 900, 100, function() {
      // After brand typed → subtitle
      typewrite(subtitleEl, SUBTITLE_TEXT, 100, 38, function() {
        hideCursor(200);
      });
    });

    // Progress counter: starts at 1600ms, takes ~1800ms
    animateCounter(pctEl, barEl, 1600, 1800);

    // Status messages
    cycleStatus();

    // Dismiss after TOTAL_MS
    setTimeout(function() { dismissSplash(false); }, TOTAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

})();
