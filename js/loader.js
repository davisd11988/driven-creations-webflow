/* ==========================================
   DRIVEN CREATIONS — Loading Page Animation
   Plays Drive transparent video on page load,
   then slides the loader away. Only once per session.
   Waits for the hero background video to be ready
   so there's no flash of blank hero on dismiss.
   ========================================== */

(function() {
  'use strict';

  var loader = document.getElementById('dc-loader');
  if (!loader) return;

  // Only play once per session
  if (sessionStorage.getItem('dc-loader-played')) {
    loader.style.display = 'none';
    return;
  }

  var loaderVideo  = loader.querySelector('.dc-loader-video');
  var heroVideo    = document.querySelector('.dc-hero-video');
  var maxTimeout   = 6000; // Absolute max — never hang longer than 6s
  var dismissed    = false;
  var loaderDone   = false;
  var heroDone     = false;

  function dismissLoader() {
    if (dismissed) return;
    dismissed = true;
    loader.classList.add('is-done');
    sessionStorage.setItem('dc-loader-played', '1');
    // Remove from DOM after CSS transition finishes
    setTimeout(function() {
      loader.style.display = 'none';
    }, 900);
  }

  // Called when both conditions are met (or safety timeout fires)
  function tryDismiss() {
    if (loaderDone && heroDone) {
      dismissLoader();
    }
  }

  // ---- CONDITION 1: Loader animation finished ----
  if (loaderVideo) {
    loaderVideo.addEventListener('ended', function() {
      setTimeout(function() {
        loaderDone = true;
        tryDismiss();
      }, 300); // Brief pause after loader video ends
    });

    // Ensure loader video plays
    loaderVideo.play().catch(function() {
      // If autoplay blocked, mark loader as done after short delay
      setTimeout(function() {
        loaderDone = true;
        tryDismiss();
      }, 1500);
    });
  } else {
    // No loader video — mark loader as immediately done
    loaderDone = true;
  }

  // ---- CONDITION 2: Hero video is ready to display ----
  if (heroVideo) {
    // readyState >= 3 means enough data to start playing smoothly
    if (heroVideo.readyState >= 3) {
      heroDone = true;
    } else {
      heroVideo.addEventListener('canplay', function onHeroReady() {
        heroVideo.removeEventListener('canplay', onHeroReady);
        heroDone = true;
        tryDismiss();
      });
      // Nudge browser to start loading the hero video immediately
      heroVideo.load();
    }
  } else {
    // No hero video on this page — skip waiting
    heroDone = true;
  }

  // Check if both are already satisfied (e.g. cached video loads instantly)
  tryDismiss();

  // ---- SAFETY TIMEOUT — never hang beyond max ----
  setTimeout(dismissLoader, maxTimeout);

})();
