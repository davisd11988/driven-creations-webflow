/* ==========================================
   DRIVEN CREATIONS — Loading Page Animation
   Plays Drive transparent video on page load,
   then slides the loader away. Only once per session.
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

  var video = loader.querySelector('.dc-loader-video');
  var maxTimeout = 4500; // Maximum 4.5 seconds

  function dismissLoader() {
    loader.classList.add('is-done');
    sessionStorage.setItem('dc-loader-played', '1');
    // Remove from DOM after transition
    setTimeout(function() {
      loader.style.display = 'none';
    }, 900);
  }

  // When video ends naturally
  if (video) {
    video.addEventListener('ended', function() {
      setTimeout(dismissLoader, 300); // Brief pause after video ends
    });

    // Ensure video plays
    video.play().catch(function() {
      // If autoplay blocked, dismiss after short delay
      setTimeout(dismissLoader, 1500);
    });
  }

  // Safety timeout — always dismiss after max time
  setTimeout(dismissLoader, maxTimeout);

})();
