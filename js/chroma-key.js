/* ==========================================
   DRIVEN CREATIONS — Safari Transparent Video Fix
   Canvas-based chroma key removes green screen
   backgrounds on browsers that don't support
   WebM/VP9 alpha transparency (Safari, iOS).
   ========================================== */

(function() {
  'use strict';

  // Only apply on Safari / iOS where WebM alpha channel is ignored
  var ua = navigator.userAgent;
  var isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua) && !/Edg/.test(ua);
  var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

  if (!isSafari && !isIOS) return;

  /**
   * Apply chroma key to a video element.
   * Creates a canvas overlay that renders the video without the green background.
   */
  function chromaKey(video, opts) {
    opts = opts || {};
    var greenMin = opts.greenMin || 80;    // minimum green channel value
    var ratio    = opts.ratio    || 1.2;   // green must be this much higher than R and B
    var softEdge = opts.softEdge || 20;    // feather range for soft edges

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

      for (var i = 0; i < len; i += 4) {
        var r = d[i], g = d[i + 1], b = d[i + 2];

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
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
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
      var loaderCanvas = chromaKey(loaderVideo, { maxRes: 300, greenMin: 70 });
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
