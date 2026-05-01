/* SDproject — site JS
   Vanilla, no dependencies. ~3KB minified.
   Handles: mobile nav, scroll parallax, reveal-on-scroll,
   stats counter, 3D tilt, mouse-parallax in hero, year. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- year ---
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // --- mobile nav ---
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('primary-nav');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- scroll parallax ---
  // Hero layers + background skyline. Single rAF loop.
  var hero = document.querySelector('.hero');
  var heroLayers = hero ? hero.querySelectorAll('.hero-scene .layer') : [];
  var skyline = document.querySelector('.bg-skyline');

  var ticking = false;
  var lastY = 0;

  function applyParallax() {
    ticking = false;
    var y = lastY;

    if (hero) {
      var rect = hero.getBoundingClientRect();
      // only animate while hero is visible-ish
      if (rect.bottom > -200 && rect.top < window.innerHeight) {
        for (var i = 0; i < heroLayers.length; i++) {
          var layer = heroLayers[i];
          var depth = parseFloat(layer.getAttribute('data-depth')) || 0;
          var translate = -y * depth;
          layer.style.transform = 'translate3d(0,' + translate + 'px,0)';
        }
      }
    }
    if (skyline) {
      // background skyline drifts up slowly
      skyline.style.transform = 'translate3d(0,' + (y * 0.05) + 'px,0)';
    }
  }

  function onScroll() {
    lastY = window.pageYOffset || document.documentElement.scrollTop;
    if (!ticking && !reduced) {
      window.requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }

  if (!reduced) {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- mouse parallax in hero ---
  if (hero && !reduced && window.matchMedia('(hover: hover)').matches) {
    var mx = 0, my = 0;
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1..1
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      window.requestAnimationFrame(function () {
        for (var i = 0; i < heroLayers.length; i++) {
          var layer = heroLayers[i];
          var depth = parseFloat(layer.getAttribute('data-depth')) || 0;
          var tx = mx * depth * 18;
          var ty = my * depth * 12;
          // combine with scroll parallax
          var sy = -lastY * depth;
          layer.style.transform =
            'translate3d(' + tx + 'px,' + (sy + ty) + 'px,0)';
        }
      });
    });
    hero.addEventListener('mouseleave', function () {
      for (var i = 0; i < heroLayers.length; i++) {
        var layer = heroLayers[i];
        var depth = parseFloat(layer.getAttribute('data-depth')) || 0;
        layer.style.transform = 'translate3d(0,' + (-lastY * depth) + 'px,0)';
      }
    });
  }

  // --- reveal on scroll ---
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // --- stats counter ---
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = 0;
        var dur = 1400;
        var t0 = performance.now();
        function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(start + (target - start) * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute('data-count');
    });
  }

  // --- 3D tilt on cards ---
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    var tilts = document.querySelectorAll('.tilt');
    tilts.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(900px) rotateY(' + (px * 6) + 'deg) rotateX(' + (-py * 6) + 'deg) translateY(-2px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  // --- active nav link on scroll ---
  var navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
  var sections = [];
  navLinks.forEach(function (l) {
    var id = l.getAttribute('href').slice(1);
    var s = document.getElementById(id);
    if (s) sections.push({ link: l, section: s });
  });
  if (sections.length && 'IntersectionObserver' in window) {
    var ao = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var match = sections.find(function (s) { return s.section === e.target; });
          if (match) {
            navLinks.forEach(function (l) { l.classList.remove('active'); });
            match.link.classList.add('active');
          }
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { ao.observe(s.section); });
  }
})();
