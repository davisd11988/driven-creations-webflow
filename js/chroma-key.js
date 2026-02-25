/* ==========================================
   DRIVEN CREATIONS — Transparent Video System

   UNIFIED APPROACH — same method for ALL browsers:
   Green-screen MP4 source → canvas chroma-key.

   Every transparent video (loader, character expand,
   project hero) uses the same pipeline:
   1. Swap source to green-screen MP4
   2. Move video off-screen to document.body
   3. Render to canvas with green removed

   This eliminates browser-specific code paths and
   the "fix one browser, break another" cycle.
   ========================================== */

(function() {
  'use strict';

  /**
   * Map of WebM sources → green-screen MP4 sources.
   * HTML may reference VP9 alpha WebMs (legacy), but we always
   * swap to the clean green-screen MP4s for chroma-key processing.
   */
  var greenScreenSources = {
    '/videos/loader-drive.webm':      '/videos/loader-drive-fallback.mp4',
    '/videos/drive-fullbody.webm':    '/videos/drive-fullbody-src.mp4',
    '/videos/deadline-fullbody.webm': '/videos/deadline-fullbody.mp4',
    '/videos/derrick-fullbody.webm':  '/videos/derrick-fullbody-src.mp4'
  };

  /**
   * Swap a video's source from WebM to green-screen MP4.
   */
  function swapToGreenScreen(video) {
    video.pause();

    var sources = video.querySelectorAll('source');
    var swapped = false;
    for (var i = 0; i < sources.length; i++) {
      var src = sources[i].getAttribute('src');
      if (greenScreenSources[src]) {
        sources[i].setAttribute('src', greenScreenSources[src]);
        sources[i].setAttribute('type', 'video/mp4');
        swapped = true;
        break;
      }
    }

    if (swapped) {
      video.load();
      if (video.hasAttribute('autoplay')) {
        video.play().catch(function() {});
      }
    }
  }

  /**
   * Apply chroma key to a video element.
   * Creates a canvas overlay that renders the video without the green background.
   * Moves the video to document.body to prevent Chrome GPU compositor issues.
   */
  function chromaKey(video, opts) {
    opts = opts || {};
    var greenMin = opts.greenMin || 80;
    var ratio    = opts.ratio    || 1.2;
    var poster   = video.getAttribute('poster');

    // Cache the original parent BEFORE any DOM manipulation.
    var originalParent = video.parentNode;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.className = 'dc-chroma-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var rafId = null;
    var isRunning = false;
    var posterHidden = false;

    function render() {
      if (video.paused || video.ended) {
        isRunning = false;
        return;
      }

      // Keep polling until video data is decoded
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

      var maxDim = opts.maxRes || 360;
      var scale = Math.min(1, maxDim / Math.max(vw, vh));
      var w = Math.round(vw * scale);
      var h = Math.round(vh * scale);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.drawImage(video, 0, 0, w, h);

      // Hide poster after first real frame is drawn (prevents blank gap)
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
        //
        // dominance = G / max(R, B)
        //   > 1.12 → fully transparent
        //   1.0–1.12 → smoothstep graduated alpha
        //   ≤ 1.0 → opaque

        for (var i = 0; i < len; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2];
          if (d[i + 3] === 0) continue;

          var maxRB = Math.max(r, b, 1);

          if (g > r && g > b && g > 25) {
            var dominance = g / maxRB;
            if (dominance > 1.12) {
              d[i + 3] = 0;
            } else if (dominance > 1.0) {
              var t = (dominance - 1.0) / 0.12;
              t = Math.max(0, Math.min(1, t));
              var smooth = t * t * (3 - 2 * t);
              var edgeAlpha = Math.round(255 * (1 - smooth));
              edgeAlpha = Math.max(0, Math.min(255, edgeAlpha));
              if (edgeAlpha < d[i + 3]) {
                d[i + 3] = edgeAlpha;
              }
            }
          }
        }
        // Despill — clamp green to max(r, b) on all visible pixels
        for (var j = 0; j < len; j += 4) {
          if (d[j + 3] > 0) {
            var clamp = Math.max(d[j], d[j + 2]);
            if (d[j + 1] > clamp) {
              d[j + 1] = clamp;
            }
          }
        }
      } else {
        // STANDARD MODE — preserves skin tones
        for (var i = 0; i < len; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2];
          if (d[i + 3] === 0) continue;

          if (g > greenMin && g > r * ratio && g > b * ratio) {
            d[i + 3] = 0;
          } else if (g > greenMin * 0.7 && g > r * (ratio * 0.85) && g > b * (ratio * 0.85)) {
            var greenStrength = (g - Math.max(r, b)) / g;
            var alpha = Math.round(255 * (1 - greenStrength));
            alpha = Math.max(0, Math.min(255, alpha));
            if (alpha < d[i + 3]) {
              d[i + 3] = alpha;
            }
          }
        }

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
      if (poster && originalParent) {
        originalParent.style.backgroundImage = 'url(' + poster + ')';
      }
    }

    video.addEventListener('play', start);
    video.addEventListener('playing', start);
    video.addEventListener('pause', stop);
    video.addEventListener('ended', function() {
      stop();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Copy poster to parent as background-image
    if (poster && originalParent) {
      originalParent.style.backgroundImage = 'url(' + poster + ')';
      originalParent.style.backgroundSize = 'cover';
      originalParent.style.backgroundPosition = 'center';
    }

    // Move video to document.body, insert canvas in its place.
    // Prevents Chrome GPU compositor "duplicate" bug (position:fixed
    // inside CSS-transformed ancestors gets mis-positioned).
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

    if (!video.paused && video.readyState >= 2) {
      start();
    }

    return canvas;
  }

  /**
   * Initialize — same pipeline for ALL browsers
   */
  function init() {

    // 1. LOADER VIDEO
    var loaderVideo = document.querySelector('.dc-loader-video');
    if (loaderVideo) {
      swapToGreenScreen(loaderVideo);
      var c = chromaKey(loaderVideo, { maxRes: 500, aggressive: true });
      c.style.width = '200px';
      c.style.height = '200px';
    }

    // 2. CHARACTER HOVER VIDEOS — scene backgrounds, no chroma-key.

    // 3. CHARACTER EXPAND VIDEO
    var expandVideo = document.querySelector('.dc-character-expand-video video');
    if (expandVideo) {
      swapToGreenScreen(expandVideo);
      var c = chromaKey(expandVideo, { maxRes: 500, aggressive: true });
      c.style.width = '100%';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
