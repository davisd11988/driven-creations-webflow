/* ==========================================
   DRIVEN CREATIONS — Shared JavaScript
   Navbar, mobile menu, scroll reveal,
   character video hover, word-split
   ========================================== */

(function() {
  'use strict';

  /* ------------------------------------------
     YOUTUBE VIDEO MODAL
     Uses event delegation — works for clash
     section AND portfolio AI video cards
     ------------------------------------------ */
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest('[data-video-modal]');
    if (!trigger) return;
    e.preventDefault();

    var modal = document.querySelector('.dc-video-modal');
    if (!modal) return;

    var videoId = trigger.getAttribute('data-video-id') || 'im-qtaIxbYk';
    var iframe = modal.querySelector('.dc-video-modal-embed iframe');
    if (iframe) {
      iframe.setAttribute('src', 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0');
    }
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  });

  document.addEventListener('click', function(e) {
    var modal = document.querySelector('.dc-video-modal');
    if (!modal || !modal.classList.contains('is-active')) return;

    var closeBtn = e.target.closest('.dc-video-modal-close');
    var clickedOverlay = (e.target === modal);

    if (closeBtn || clickedOverlay) {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
      var iframe = modal.querySelector('.dc-video-modal-embed iframe');
      if (iframe) iframe.setAttribute('src', '');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modal = document.querySelector('.dc-video-modal');
      if (modal && modal.classList.contains('is-active')) {
        modal.classList.remove('is-active');
        document.body.style.overflow = '';
        var iframe = modal.querySelector('.dc-video-modal-embed iframe');
        if (iframe) iframe.setAttribute('src', '');
      }
    }
  });

  /* ------------------------------------------
     VIDEO LAZY LOADING
     Videos with data-lazy-video won't fetch anything
     until they approach the viewport. Saves dozens of
     MB in wasted early network requests.
     ------------------------------------------ */
  function activateLazyVideo(video) {
    var sources = video.querySelectorAll('source[data-src]');
    if (!sources.length) return; // Already activated
    sources.forEach(function(source) {
      source.setAttribute('src', source.getAttribute('data-src'));
      source.removeAttribute('data-src');
    });
    video.removeAttribute('data-lazy-video');
    video.load();
  }

  var lazyVideos = document.querySelectorAll('video[data-lazy-video]');
  if (lazyVideos.length) {
    var videoLazyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          activateLazyVideo(entry.target);
          videoLazyObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '200px 0px'  // Start loading 200px before entering viewport
    });

    lazyVideos.forEach(function(video) {
      videoLazyObserver.observe(video);
    });
  }

  /* ------------------------------------------
     EAGER PRELOAD: Character videos
     After the page has fully loaded (images, hero video, etc.),
     preload character hover videos so they're ready before the
     user scrolls to them. Uses idle time — doesn't block initial paint.
     ------------------------------------------ */
  function preloadCharacterVideos() {
    var charVideos = document.querySelectorAll('.dc-character-video[data-lazy-video]');
    charVideos.forEach(function(video) {
      activateLazyVideo(video);
      if (videoLazyObserver) videoLazyObserver.unobserve(video);
    });
  }

  if (document.readyState === 'complete') {
    // Page already loaded — preload immediately
    setTimeout(preloadCharacterVideos, 100);
  } else {
    window.addEventListener('load', function() {
      // Small delay so hero video / critical assets finish first
      setTimeout(preloadCharacterVideos, 500);
    });
  }

  /* ------------------------------------------
     SCROLL THROTTLE UTILITY
     ------------------------------------------ */
  var scrollTicking = false;
  var scrollCallbacks = [];
  function onScroll(fn) { scrollCallbacks.push(fn); }
  window.addEventListener('scroll', function() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(function() {
        for (var i = 0; i < scrollCallbacks.length; i++) scrollCallbacks[i]();
        scrollTicking = false;
      });
    }
  }, { passive: true });

  /* ------------------------------------------
     NAVBAR SCROLL EFFECT
     ------------------------------------------ */
  var navbar = document.querySelector('.dc-navbar');
  if (navbar) {
    onScroll(function() {
      if (window.scrollY > 50) {
        navbar.classList.add('is-scrolled');
      } else {
        navbar.classList.remove('is-scrolled');
      }
    });
  }

  /* ------------------------------------------
     MOBILE MENU TOGGLE
     ------------------------------------------ */
  var menuBtn = document.querySelector('.dc-mobile-menu-btn');
  var mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function() {
      var isOpen = mobileMenu.classList.contains('is-open');
      if (isOpen) {
        mobileMenu.classList.remove('is-open');
        menuBtn.classList.remove('is-open');
        document.body.style.overflow = '';
      } else {
        mobileMenu.classList.add('is-open');
        menuBtn.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    });

    var menuLinks = mobileMenu.querySelectorAll('.dc-mobile-menu-link, .dc-mobile-menu-cta a');
    for (var i = 0; i < menuLinks.length; i++) {
      menuLinks[i].addEventListener('click', function() {
        mobileMenu.classList.remove('is-open');
        menuBtn.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    }
  }

  /* ------------------------------------------
     SCROLL COLLISION: play video + fade content
     ------------------------------------------ */
  var collisionSection = document.getElementById('collision');
  if (collisionSection) {
    var collVideo = collisionSection.querySelector('.dc-collision-video');
    var collContent = collisionSection.querySelector('.dc-collision-content');

    var collObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          if (collVideo) {
            collVideo.currentTime = 0;
            collVideo.play();
            collVideo.classList.add('is-playing');
          }
          if (collContent) {
            collContent.classList.add('is-visible');
          }
        } else {
          if (collVideo) {
            collVideo.pause();
            collVideo.currentTime = 0;
            collVideo.classList.remove('is-playing');
          }
          if (collContent) {
            collContent.classList.remove('is-visible');
          }
        }
      });
    }, { threshold: 0.3 });

    collObserver.observe(collisionSection);
  }

  /* ------------------------------------------
     PROCESS SECTION: scroll-driven progress
     ------------------------------------------ */
  var processSection = document.getElementById('process');
  if (processSection) {
    var progressLine = processSection.querySelector('.dc-process-line-progress');
    var stepCircles = processSection.querySelectorAll('.dc-step-circle');
    var isMobile = window.innerWidth < 768;

    function updateProgress() {
      var rect = processSection.getBoundingClientRect();
      var windowH = window.innerHeight;
      var start = rect.top + window.scrollY - windowH;
      var end = rect.top + window.scrollY + rect.height - windowH * 0.5;
      var scrollY = window.scrollY;
      var rawProgress = (scrollY - start) / (end - start);
      var scrollProgress = Math.max(0, Math.min(1, rawProgress));

      var lineScale = (scrollProgress - 0.15) / 0.7;
      lineScale = Math.max(0, Math.min(1, lineScale));

      if (progressLine) {
        if (isMobile) {
          progressLine.style.transform = 'scaleY(' + lineScale + ')';
        } else {
          progressLine.style.transform = 'scaleX(' + lineScale + ')';
        }
      }

      for (var i = 0; i < stepCircles.length; i++) {
        var threshold = i / (stepCircles.length - 1);
        var activationPoint = 0.15 + threshold * 0.7;
        if (scrollProgress >= activationPoint - 0.05) {
          stepCircles[i].classList.add('dc-step-active');
        } else {
          stepCircles[i].classList.remove('dc-step-active');
        }
      }
    }

    onScroll(updateProgress);
    window.addEventListener('resize', function() {
      isMobile = window.innerWidth < 768;
      updateProgress();
    });
    updateProgress();
  }

  /* ------------------------------------------
     CHARACTER VIDEO CARDS: hover play/pause
     Mobile/tablet: auto-play when scrolled into view
     Desktop: hover to play
     ------------------------------------------ */
  var videoCards = document.querySelectorAll('.dc-character-video-card');
  if (videoCards.length) {
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    videoCards.forEach(function(card) {
      var video = card.querySelector('.dc-character-video');
      if (!video) return;
      var hoverPending = false;

      function playVideo() {
        // If video data isn't loaded yet, wait for it
        if (video.readyState < 2) {
          hoverPending = true;
          // Ensure source is activated (lazy loading might not have fired yet)
          if (video.hasAttribute('data-lazy-video')) {
            activateLazyVideo(video);
          }
          video.addEventListener('canplay', function onReady() {
            video.removeEventListener('canplay', onReady);
            if (hoverPending) {
              hoverPending = false;
              doPlay();
            }
          });
          return;
        }
        doPlay();
      }

      function doPlay() {
        video.currentTime = 0;
        video.play().catch(function(err) {
          if (err.name !== 'AbortError') card.classList.remove('is-playing');
        });
        card.classList.add('is-playing');
      }

      function pauseVideo() {
        hoverPending = false;
        video.pause();
        video.currentTime = 0;
        card.classList.remove('is-playing');
      }

      video.addEventListener('error', function() {
        card.classList.remove('is-playing');
      });

      if (!isTouch) {
        // Desktop: hover to play
        card.addEventListener('mouseenter', function() { playVideo(); });
        card.addEventListener('mouseleave', function() { pauseVideo(); });
      }

      video.addEventListener('ended', function() {
        card.classList.remove('is-playing');
        video.currentTime = 0;
      });
    });

    var videoObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var card = entry.target;
        var video = card.querySelector('.dc-character-video');
        if (!video) return;

        if (entry.isIntersecting && isTouch) {
          // Ensure source is activated (eager preload may not have run yet)
          if (video.hasAttribute('data-lazy-video')) {
            activateLazyVideo(video);
          }

          function startAutoPlay() {
            video.currentTime = 0;
            video.play().catch(function(err) {
              if (err.name !== 'AbortError') card.classList.remove('is-playing');
            });
            card.classList.add('is-playing');
            card.classList.add('is-autoplay');
          }

          // Wait for data if not loaded yet
          if (video.readyState >= 2) {
            startAutoPlay();
          } else {
            video.addEventListener('canplay', function onAutoReady() {
              video.removeEventListener('canplay', onAutoReady);
              // Only play if card is still in view
              if (card.classList.contains('is-autoplay') || !card.classList.contains('is-playing')) {
                startAutoPlay();
              }
            });
            card.classList.add('is-autoplay'); // Mark as waiting
          }
        } else if (!entry.isIntersecting) {
          video.pause();
          video.currentTime = 0;
          card.classList.remove('is-playing');
          card.classList.remove('is-autoplay');
        }
      });
    }, { threshold: 0.3 });

    videoCards.forEach(function(card) {
      videoObserver.observe(card);
    });
  }

  /* ------------------------------------------
     WORD-BY-WORD TEXT REVEAL (13g.fr style)
     ------------------------------------------ */
  var textRevealEls = document.querySelectorAll('.dc-reveal-text');
  textRevealEls.forEach(function(el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.innerHTML = '';
    words.forEach(function(word, i) {
      var span = document.createElement('span');
      span.className = 'dc-word';
      span.textContent = word;
      span.style.transitionDelay = (i * 0.06) + 's';
      el.appendChild(span);
      // Add a space between words (except last)
      if (i < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    });
  });

  /* ------------------------------------------
     13g.fr SCROLL REVEAL OBSERVER
     Delays non-hero reveals on sub-pages so hero
     text finishes animating before content appears.
     ------------------------------------------ */
  var revealElements = document.querySelectorAll(
    '.dc-reveal, .dc-reveal-left, .dc-reveal-right, .dc-reveal-scale, .dc-reveal-text'
  );
  if (revealElements.length) {
    // Check prefers-reduced-motion — reveal all elements instantly, skip observer.
    // IMPORTANT: Do NOT use return here — it exits the entire IIFE and kills
    // all code below (character expand, hero arrow, back to top, etc.).
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      for (var j = 0; j < revealElements.length; j++) {
        revealElements[j].classList.add('is-revealed');
      }
    }

    if (!reducedMotion) {
    // Determine hero animation finish time for proper cascade ordering
    var heroAnimDone = 0;
    if (document.querySelector('.dc-hero-tag-anim')) {
      // Main sub-pages: subtitle anim finishes at ~0.9s delay + 1.2s = 2.1s
      heroAnimDone = 2000;
    } else if (document.querySelector('.dc-project-hero')) {
      // Project sub-pages: hero reveals finish at ~0.3s delay + 0.7s = 1.0s
      heroAnimDone = 1200;
    }
    var dcPageStart = Date.now();

    var revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var isHeroEl = entry.target.closest('.dc-hero, .dc-hero-content, .dc-project-hero, .dc-project-hero-content');
          var elapsed = Date.now() - dcPageStart;

          if (!heroAnimDone || isHeroEl || elapsed >= heroAnimDone) {
            // No delay needed: homepage, hero element, or hero already finished
            entry.target.classList.add('is-revealed');
          } else {
            // Delay non-hero elements until hero animations complete
            var wait = heroAnimDone - elapsed;
            (function(el) {
              setTimeout(function() {
                el.classList.add('is-revealed');
              }, wait);
            })(entry.target);
          }
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px'  /* 13g.fr trigger point */
    });

    for (var k = 0; k < revealElements.length; k++) {
      revealObserver.observe(revealElements[k]);
    }
    } // end if (!reducedMotion)
  }

  /* ------------------------------------------
     PROJECT CARD VIDEO: auto-play when in view
     ------------------------------------------ */
  var projectCards = document.querySelectorAll('.dc-project-card');
  if (projectCards.length) {
    var projectVideoObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var video = entry.target.querySelector('.dc-project-thumb-video');
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(function(err) {
            if (err.name !== 'AbortError') entry.target.classList.remove('is-playing');
          });
          entry.target.classList.add('is-playing');
        } else {
          video.pause();
          entry.target.classList.remove('is-playing');
        }
      });
    }, { threshold: 0.2 });

    projectCards.forEach(function(card) {
      var video = card.querySelector('.dc-project-thumb-video');
      if (video) {
        projectVideoObserver.observe(card);
      }
    });
  }

  /* ------------------------------------------
     PORTFOLIO: View All Projects toggle
     ------------------------------------------ */
  var viewAllBtn = document.querySelector('.dc-view-all-btn');
  var hiddenProjects = document.querySelector('.dc-projects-hidden');
  if (viewAllBtn && hiddenProjects) {
    viewAllBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (hiddenProjects.classList.contains('is-visible')) {
        hiddenProjects.classList.remove('is-visible');
        viewAllBtn.textContent = 'View All Projects \u2192';
      } else {
        hiddenProjects.classList.add('is-visible');
        viewAllBtn.textContent = 'Show Less';
        // Trigger reveal animations for newly visible cards
        var newCards = hiddenProjects.querySelectorAll('.dc-reveal-scale');
        newCards.forEach(function(card, i) {
          card.style.transitionDelay = (i * 0.09) + 's';
          setTimeout(function() {
            card.classList.add('is-revealed');
          }, 50);
        });
      }
    });
  }

  /* ------------------------------------------
     CHARACTER EXPAND INTERACTION
     ------------------------------------------ */
  var expandOverlay = document.querySelector('.dc-character-expand-overlay');
  if (expandOverlay) {
    var expandBtns = document.querySelectorAll('.dc-character-btn');
    var closeBtn = expandOverlay.querySelector('.dc-character-expand-close');
    var expandName = expandOverlay.querySelector('.dc-character-expand-name');
    var expandRole = expandOverlay.querySelector('.dc-character-expand-role');
    var expandLore = expandOverlay.querySelector('.dc-character-expand-lore');
    var expandVideoSource = expandOverlay.querySelector('.dc-character-expand-video source');
    var expandVideo = expandOverlay.querySelector('.dc-character-expand-video video');

    var characterData = {
      drive: {
        name: 'DRIVE',
        role: 'The Hero',
        roleColor: '#8b5cf6',
        lore: 'Born from the first pixel of Creativity City, Drive is the embodiment of creative excellence. He exists for one singular purpose: to destroy Deadline and prove that great design never has to be rushed. With every project he touches, Drive brings precision, passion, and an unwavering commitment to quality that transforms brands from forgettable to unforgettable.',
        video: '/videos/drive-fullbody.webm',
        videoFallback: '/videos/drive-fullbody-src.mp4'
      },
      deadline: {
        name: 'DEADLINE',
        role: 'The Villain',
        roleColor: '#ef4444',
        lore: 'The force behind every rushed launch and every "just ship it" decision. Deadline is the shadow that looms over every creative project, turning vision into compromise and excellence into "good enough." He feeds on shortcuts, thrives on panic, and grows stronger with every corner cut. Unless someone stands in his way.',
        video: '/videos/deadline-fullbody.webm',
        videoFallback: '/videos/deadline-fullbody.mp4'
      },
      derrick: {
        name: 'DR. DERRICK',
        role: 'The Creator',
        roleColor: '#fbbf24',
        lore: 'The architect of the resistance. Dr. Derrick built Drive and Driven Creations to prove that quality always wins the long game. With over 15 years of experience in digital design and brand transformation, he has led the charge against mediocrity, empowering startups, B2B organizations, and government agencies to achieve design excellence.',
        video: '/videos/derrick-fullbody.webm',
        videoFallback: '/videos/derrick-fullbody-src.mp4'
      }
    };

    // Track the chroma-key canvas so we can clear it between switches
    var expandVideoContainer = expandOverlay.querySelector('.dc-character-expand-video');
    var expandCanvas = expandVideoContainer ? expandVideoContainer.querySelector('.dc-chroma-canvas') : null;

    // Shared handler — opens the character expand overlay
    function openCharacter(charKey) {
      var data = characterData[charKey];
      if (!data) return;

      // Update text immediately
      expandName.textContent = data.name;
      expandRole.textContent = data.role;
      expandRole.style.color = data.roleColor;
      expandLore.textContent = data.lore;

      if (expandVideoSource && expandVideo) {
        // 1. Pause old video & hide video area instantly
        expandVideo.pause();
        if (expandVideoContainer) {
          expandVideoContainer.classList.add('dc-video-loading');
        }

        // 2. Clear the chroma-key canvas so old character frame doesn't linger
        if (!expandCanvas) {
          expandCanvas = expandVideoContainer ? expandVideoContainer.querySelector('.dc-chroma-canvas') : null;
        }
        if (expandCanvas) {
          var ctx = expandCanvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, expandCanvas.width, expandCanvas.height);
        }

        // 3. Swap source & load new video
        //    Always use green-screen MP4 — chroma-key processes it on all browsers.
        expandVideoSource.setAttribute('src', data.videoFallback);
        expandVideoSource.setAttribute('type', 'video/mp4');
        expandVideo.load();

        // 4. Wait for new video data before showing
        function onReady() {
          expandVideo.removeEventListener('canplay', onReady);
          expandVideo.play().catch(function() {});
          // Small delay to let chroma-key render first frame
          setTimeout(function() {
            if (expandVideoContainer) {
              expandVideoContainer.classList.remove('dc-video-loading');
            }
          }, 80);
        }
        expandVideo.addEventListener('canplay', onReady);

        // Fallback: if canplay doesn't fire within 2s, show anyway
        setTimeout(function() {
          expandVideo.removeEventListener('canplay', onReady);
          expandVideo.play().catch(function() {});
          if (expandVideoContainer) {
            expandVideoContainer.classList.remove('dc-video-loading');
          }
        }, 2000);
      }

      expandOverlay.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    // Bind both click AND touch events for full mobile/tablet/desktop support.
    // touchend fires immediately on lift — no 300ms delay, no missed taps.
    expandBtns.forEach(function(btn) {
      var touchStartY = 0;
      var touchHandled = false;

      btn.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchHandled = false;
      }, { passive: true });

      btn.addEventListener('touchend', function(e) {
        // Only handle taps, not scrolls (ignore if finger moved > 10px)
        var touchEndY = e.changedTouches[0].clientY;
        if (Math.abs(touchEndY - touchStartY) > 10) return;

        touchHandled = true;
        e.preventDefault(); // Prevent subsequent click from double-firing
        var charKey = btn.getAttribute('data-character');
        openCharacter(charKey);
      });

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // Skip if touchend already handled this interaction
        if (touchHandled) {
          touchHandled = false;
          return;
        }
        var charKey = btn.getAttribute('data-character');
        openCharacter(charKey);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        expandOverlay.classList.remove('is-active');
        document.body.style.overflow = '';
        if (expandVideo) expandVideo.pause();
      });
    }

    expandOverlay.addEventListener('click', function(e) {
      if (e.target === expandOverlay) {
        expandOverlay.classList.remove('is-active');
        document.body.style.overflow = '';
        if (expandVideo) expandVideo.pause();
      }
    });
  }

  /* ------------------------------------------
     HERO ARROW: native smooth scroll
     ------------------------------------------ */
  var heroArrow = document.querySelector('.dc-scroll-indicator[href]');
  if (heroArrow) {
    heroArrow.addEventListener('click', function(e) {
      var targetId = heroArrow.getAttribute('href');
      if (targetId && targetId.charAt(0) === '#') {
        var target = document.getElementById(targetId.slice(1));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
          history.pushState(null, '', targetId);
        }
      }
    });
  }

  /* ------------------------------------------
     BACK TO TOP BUTTON
     ------------------------------------------ */
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    onScroll(function() {
      if (window.scrollY > 600) {
        backToTop.classList.add('is-visible');
      } else {
        backToTop.classList.remove('is-visible');
      }
    });

    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ------------------------------------------
     COOKIE CONSENT BANNER
     ------------------------------------------ */
  var cookieBanner = document.getElementById('cookieBanner');
  if (cookieBanner && !localStorage.getItem('dc-cookie-consent')) {
    setTimeout(function() {
      cookieBanner.classList.add('is-visible');
    }, 1500);

    var acceptBtn = document.getElementById('cookieAccept');
    var declineBtn = document.getElementById('cookieDecline');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function() {
        localStorage.setItem('dc-cookie-consent', 'accepted');
        cookieBanner.classList.remove('is-visible');
      });
    }
    if (declineBtn) {
      declineBtn.addEventListener('click', function() {
        localStorage.setItem('dc-cookie-consent', 'declined');
        cookieBanner.classList.remove('is-visible');
      });
    }
  }

  /* ------------------------------------------
     PORTFOLIO FILTER TABS
     ------------------------------------------ */
  var filterBtns = document.querySelectorAll('.dc-filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var filter = this.getAttribute('data-filter');
        var grid = this.closest('section').querySelector('.dc-projects-grid');
        if (!grid) return;

        // Update active button
        this.closest('.dc-filter-bar').querySelectorAll('.dc-filter-btn').forEach(function(b) {
          b.classList.remove('is-active');
        });
        this.classList.add('is-active');

        // Filter cards
        var cards = grid.querySelectorAll('[data-category]');
        cards.forEach(function(card, i) {
          var cat = card.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            card.classList.remove('dc-filter-hidden');
            card.classList.add('dc-filter-reveal');
            card.style.animationDelay = (i * 0.04) + 's';
          } else {
            card.classList.add('dc-filter-hidden');
            card.classList.remove('dc-filter-reveal');
          }
        });
      });
    });
  }

})();
