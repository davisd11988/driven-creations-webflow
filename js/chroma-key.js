/* ==========================================
   DRIVEN CREATIONS — Universal Transparent Video
   Canvas-based chroma key removes green screen
   backgrounds on ALL browsers and devices.

   Why universal (not Safari-only):
   - Character hover videos are MP4 with green screens
     (H.264 cannot encode alpha), so they need chroma
     key on every browser including Chrome.
   - WebM VP9 alpha may not decode on all mobile
     hardware (some Android devices lack VP9 alpha
     support in their hardware decoder).
   - For browsers that DO decode VP9 alpha natively,
     the canvas pass-through is harmless — already-
     transparent pixels don't trigger green detection.
   - Canvas is scaled down (300-600px) so overhead
     is negligible on modern devices.
   ========================================== */

(function() {
  'use strict';

  /**
   * Apply chroma key to a video element.
   * Creates a canvas overlay that renders the video without the green background.
   */
  function chromaKey(video, opts) {
    opts = opts || {};
    var greenMin = opts.greenMin || 80;    // minimum green channel value
    var ratio    = opts.ratio    || 1.2;   // green must be this much higher than R and B
    var softEdge = opts.softEdge || 20;    // feather range for soft edges
    var poster   = video.getAttribute('poster');  // cache for start/stop toggling

    // Cache the original parent BEFORE any DOM manipulation.
    // Video will be moved into a zero-size wrapper, so video.parentNode changes.
    var originalParent = video.parentNode;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.className = 'dc-chroma-canvas';

    // Position canvas exactly over the video
    canvas.setAttribute('aria-hidden', 'true');
    var rafId = null;
    var isRunning = false;
    var posterHidden = false;

    function render() {
      if (video.paused || video.ended) {
        isRunning = false;
        return;
      }

      // If video data isn't decoded yet, keep polling instead of stopping.
      // Chrome fires 'play' before readyState reaches HAVE_CURRENT_DATA (2),
      // which previously killed the render loop permanently.
      if (video.readyState < 2) {
        rafId = requestAnimationFrame(render);
        return;
      }

      var vw = video.videoWidth;
      var vh = video.videoHeight;
      if (!vw || !vh) {
        rafId = requestAnimationFrame(render);
        return;
      }

      // Scale down for performance (max 360px on longest side)
      var maxDim = opts.maxRes || 360;
      var scale = Math.min(1, maxDim / Math.max(vw, vh));
      var w = Math.round(vw * scale);
      var h = Math.round(vh * scale);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.drawImage(video, 0, 0, w, h);

      // Hide the poster ONLY after the first real frame has been drawn.
      // This prevents the blank gap between poster disappearing and
      // canvas rendering its first frame.
      if (!posterHidden && poster && originalParent) {
        originalParent.style.backgroundImage = 'none';
        posterHidden = true;
      }

      var frame = ctx.getImageData(0, 0, w, h);
      var d = frame.data;
      var len = d.length;

      if (opts.aggressive) {
        // ─── AGGRESSIVE MODE ──────────────────────────────────────
        // Dominance-ratio detection with smoothstep edge transitions.
        // Any pixel where green is dominant by >12% gets removed.
        // Edge pixels (0-12% dominance) get smooth graduated alpha.
        //
        // dominance = G / max(R, B)
        //   > 1.12 → fully transparent (clear green screen)
        //   1.0–1.12 → smoothstep graduated alpha (soft edges)
        //   ≤ 1.0 → opaque (not green-dominant)
        //
        // Threshold of 1.12 is proven to work across Chrome/Safari
        // for the bright green (#08D800) screens in these videos.

        for (var i = 0; i < len; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2];
          if (d[i + 3] === 0) continue;

          var maxRB = Math.max(r, b, 1);

          if (g > r && g > b && g > 25) {
            var dominance = g / maxRB;
            if (dominance > 1.12) {
              // Clear green — fully transparent
              d[i + 3] = 0;
            } else if (dominance > 1.0) {
              // Edge zone — smoothstep graduated alpha
              // Maps dominance 1.0→1.12 to alpha 255→0
              var t = (dominance - 1.0) / 0.12;
              t = Math.max(0, Math.min(1, t));
              // Smoothstep: 3t² - 2t³ (hermite interpolation)
              var smooth = t * t * (3 - 2 * t);
              var edgeAlpha = Math.round(255 * (1 - smooth));
              edgeAlpha = Math.max(0, Math.min(255, edgeAlpha));
              if (edgeAlpha < d[i + 3]) {
                d[i + 3] = edgeAlpha;
              }
            }
          }
        }
        // Despill ALL remaining visible pixels — clamp green to max(r, b).
        // Full clamp (not proportional) ensures zero green fringe anywhere.
        for (var j = 0; j < len; j += 4) {
          if (d[j + 3] > 0) {
            var clamp = Math.max(d[j], d[j + 2]);
            if (d[j + 1] > clamp) {
              d[j + 1] = clamp;
            }
          }
        }
      } else {
        // STANDARD MODE — for character videos where skin tones must be preserved
        for (var i = 0; i < len; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2];

          // Skip already-transparent pixels (VP9 alpha already decoded)
          if (d[i + 3] === 0) continue;

          // Core green screen detection
          if (g > greenMin && g > r * ratio && g > b * ratio) {
            // Hard green — fully transparent
            d[i + 3] = 0;
          } else if (g > greenMin * 0.7 && g > r * (ratio * 0.85) && g > b * (ratio * 0.85)) {
            // Edge region — partially transparent for soft edges
            var greenStrength = (g - Math.max(r, b)) / g;
            var alpha = Math.round(255 * (1 - greenStrength));
            alpha = Math.max(0, Math.min(255, alpha));
            if (alpha < d[i + 3]) {
              d[i + 3] = alpha;
            }
          }
        }

        // Despill: remove green color cast from ALL remaining visible pixels.
        // Clamps green channel to max(red, blue) so no green fringe remains
        // on skin, hair, clothing, or edges next to the removed background.
        if (opts.despill) {
          for (var j = 0; j < len; j += 4) {
            if (d[j + 3] > 0) {
              var limit = Math.max(d[j], d[j + 2]);
              if (d[j + 1] > limit) {
                d[j + 1] = limit;
              }
            }
          }
        }
      }

      ctx.putImageData(frame, 0, 0);
      rafId = requestAnimationFrame(render);
    }

    function start() {
      if (!isRunning) {
        isRunning = true;
        // Poster is now hidden by render() after the first frame paints,
        // so we don't blank it here — prevents the visible gap.
        render();
      }
    }

    function stop() {
      isRunning = false;
      posterHidden = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Restore poster background when stopped (prevents blank cards)
      if (poster && originalParent) {
        originalParent.style.backgroundImage = 'url(' + poster + ')';
      }
    }

    video.addEventListener('play', start);
    video.addEventListener('playing', start);
    video.addEventListener('pause', stop);
    video.addEventListener('ended', function() {
      stop();
      // Clear canvas on end so last green frame doesn't linger
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Copy poster to parent as background-image so it stays visible
    // even after we hide the video element (prevents blank cards on mobile)
    if (poster && originalParent) {
      originalParent.style.backgroundImage = 'url(' + poster + ')';
      originalParent.style.backgroundSize = 'cover';
      originalParent.style.backgroundPosition = 'center';
    }

    // Insert canvas into the video's original parent, then move the video
    // to document.body for reliable off-screen positioning.
    //
    // CRITICAL: Chrome's hardware-accelerated video decoder creates a separate
    // GPU compositing layer that ignores opacity, clip-path, overflow:hidden,
    // and z-index. The ONLY way to hide it is position:fixed at (-9999,-9999).
    //
    // BUT: position:fixed inside a transformed ancestor (like
    // .dc-character-expand-inner which has CSS transform) is positioned
    // relative to THAT ancestor, not the viewport. Chrome's compositor then
    // renders the GPU layer inside the visible container — causing the
    // "duplicate character" bug on Deadline and Dr. Derrick.
    //
    // Moving the video to document.body ensures position:fixed is always
    // viewport-relative. drawImage() and event listeners still work
    // regardless of DOM position. shared.js caches its reference to the
    // video element before this runs (defer scripts execute before
    // DOMContentLoaded), so openCharacter() still finds the video.
    originalParent.insertBefore(canvas, video.nextSibling);
    document.body.appendChild(video);

    video.style.position = 'fixed';
    video.style.left = '-9999px';
    video.style.top = '-9999px';
    video.style.width = '320px';
    video.style.height = '240px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-9999';

    // If video is already playing (autoplay)
    if (!video.paused && video.readyState >= 2) {
      start();
    }

    return canvas;
  }

  /**
   * Initialize chroma key on all transparent videos across the site
   */
  function init() {
    // 1. LOADER VIDEO — plays once on page load
    var loaderVideo = document.querySelector('.dc-loader-video');
    if (loaderVideo) {
      var loaderCanvas = chromaKey(loaderVideo, { maxRes: 300, aggressive: true });
      // Match loader video CSS
      loaderCanvas.style.width = '200px';
      loaderCanvas.style.height = '200px';
      loaderCanvas.style.objectFit = 'contain';
    }

    // 2. CHARACTER HOVER VIDEOS — play as native <video> elements.
    //    These videos have fully-rendered scene backgrounds (purple cityscape,
    //    blue tech lab, red/dark environment) — NOT green screens.
    //    No chroma-key processing needed; the CSS positions and sizes the
    //    video correctly (.dc-character-video in shared.css).

    // 3. CHARACTER EXPAND VIDEO — fullscreen overlay (green-screen videos)
    //    These fullbody WebM videos DO have green backgrounds and need chroma-key.
    //    Video has preload="none" + no autoplay — nothing loads or processes
    //    until the user clicks "Learn More" (openCharacter in shared.js).
    //    500px is ideal quality for the 400px display container.
    var expandVideo = document.querySelector('.dc-character-expand-video video');
    if (expandVideo) {
      var expandCanvas = chromaKey(expandVideo, { maxRes: 500, aggressive: true });
      expandCanvas.style.width = '100%';
      expandCanvas.style.height = '100%';
      expandCanvas.style.objectFit = 'contain';
    }

    // 4. PROJECT HERO VIDEOS (case study pages)
    var heroVideos = document.querySelectorAll('.dc-project-hero-video');
    heroVideos.forEach(function(v) {
      var c = chromaKey(v, { maxRes: 600, greenMin: 90 });
      c.style.position = 'absolute';
      c.style.top = '0';
      c.style.left = '0';
      c.style.width = '100%';
      c.style.height = '100%';
      c.style.objectFit = 'cover';
      c.style.opacity = '0.4';
      c.style.zIndex = '1';
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
