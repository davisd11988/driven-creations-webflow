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

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.className = 'dc-chroma-canvas';

    // Position canvas exactly over the video
    canvas.setAttribute('aria-hidden', 'true');
    var rafId = null;
    var isRunning = false;

    function render() {
      if (video.paused || video.ended || video.readyState < 2) {
        isRunning = false;
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

      var frame = ctx.getImageData(0, 0, w, h);
      var d = frame.data;
      var len = d.length;

      if (opts.aggressive) {
        // AGGRESSIVE MODE — for loader and isolated animations on dark backgrounds.
        // Any pixel where green is dominant gets removed, with graduated edges.
        for (var i = 0; i < len; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2];
          if (d[i + 3] === 0) continue;

          var maxRB = Math.max(r, b, 1);

          if (g > r && g > b && g > 25) {
            var dominance = g / maxRB;
            if (dominance > 1.12) {
              // Clear green — fully transparent
              d[i + 3] = 0;
            } else {
              // Graduated edge — fade based on how close to green threshold
              var edgeAlpha = Math.round(255 * (1 - (dominance - 1) / 0.12));
              edgeAlpha = Math.max(0, Math.min(255, edgeAlpha));
              if (edgeAlpha < d[i + 3]) {
                d[i + 3] = edgeAlpha;
              }
            }
          }
        }
        // Despill ALL remaining visible pixels — clamp green to max(r, b)
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

        // Despill: remove green color cast from semi-transparent edge pixels
        if (opts.despill) {
          for (var j = 0; j < len; j += 4) {
            var a = d[j + 3];
            if (a > 0 && a < 240) {
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
        // Hide poster background while canvas is active (prevents doubling)
        if (poster && video.parentNode) {
          video.parentNode.style.backgroundImage = 'none';
        }
        render();
      }
    }

    function stop() {
      isRunning = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Restore poster background when stopped (prevents blank cards)
      if (poster && video.parentNode) {
        video.parentNode.style.backgroundImage = 'url(' + poster + ')';
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
    if (poster && video.parentNode) {
      video.parentNode.style.backgroundImage = 'url(' + poster + ')';
      video.parentNode.style.backgroundSize = 'cover';
      video.parentNode.style.backgroundPosition = 'center';
    }

    // Insert canvas after video, hide video visually (keep it for playback)
    video.parentNode.insertBefore(canvas, video.nextSibling);
    video.style.opacity = '0';
    video.style.position = 'absolute';
    video.style.pointerEvents = 'none';

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

    // 2. CHARACTER HOVER VIDEOS — play on hover/click
    var charVideos = document.querySelectorAll('.dc-character-video');
    charVideos.forEach(function(v) {
      var c = chromaKey(v, { maxRes: 400 });
      // Match character video positioning
      c.style.position = 'absolute';
      c.style.top = '0';
      c.style.left = '0';
      c.style.width = '100%';
      c.style.height = '100%';
      c.style.objectFit = 'cover';
      c.style.zIndex = '2';
    });

    // 3. CHARACTER EXPAND VIDEO — fullscreen overlay
    var expandVideo = document.querySelector('.dc-character-expand-video video');
    if (expandVideo) {
      var expandCanvas = chromaKey(expandVideo, { maxRes: 500 });
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
