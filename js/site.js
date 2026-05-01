/* SDproject — scroll-driven site
   Vanilla, single rAF loop, no deps. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // mobile nav
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

  // simple reveals (for elements not driven by scroll math)
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // active nav link
  var navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
  var navSections = [];
  navLinks.forEach(function (l) {
    var id = l.getAttribute('href').slice(1);
    var s = document.getElementById(id);
    if (s) navSections.push({ link: l, section: s });
  });
  if (navSections.length && 'IntersectionObserver' in window) {
    var ao = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var match = navSections.find(function (s) { return s.section === e.target; });
          if (match) {
            navLinks.forEach(function (l) { l.classList.remove('active'); });
            match.link.classList.add('active');
          }
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    navSections.forEach(function (s) { ao.observe(s.section); });
  }

  // ------------ scroll progress helpers ------------
  function progress(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = r.height - vh;
    var p = -r.top / Math.max(1, total);
    return Math.max(0, Math.min(1, p));
  }
  function visibility(el) {
    // 0 when fully below viewport, 1 when in middle, back to 0 when above
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    var center = r.top + r.height / 2;
    var d = (center - vh / 2) / (vh / 2 + r.height / 2);
    return Math.max(-1, Math.min(1, d));
  }

  // ------------ counter (triggers when stat enters view) ------------
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var dur = 1300;
        var t0 = performance.now();
        function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  // ------------ services row reveal (alternating slide-in) ------------
  var serviceRows = document.querySelectorAll('.service-row');
  if (serviceRows.length && 'IntersectionObserver' in window && !reduced) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          so.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    serviceRows.forEach(function (r) { so.observe(r); });
  } else {
    serviceRows.forEach(function (r) { r.classList.add('in'); });
  }

  // ============== HERO scrollytelling ==============
  // Spotlight rectangles per stage (aligned to the SVG viewBox 1100x620)
  var SPOT = [
    { x: 100, y: 92,  w: 200, h: 78,  scale: 2.2, tx: 350,  ty: 30  },  // 0 rooftop sign
    { x: 360, y: 348, w: 250, h: 200, scale: 1.6, tx: -50,  ty: -30 },  // 1 billboard
    { x: 620, y: 420, w: 160, h: 80,  scale: 1.7, tx: -360, ty: -100},  // 2 neon shop
    { x: 80,  y: 60,  w: 1000, h: 500, scale: 1,   tx: 0,    ty: 0   }  // 3 wide
  ];

  var hero = document.getElementById('hero');
  var heroPin = hero ? hero.querySelector('.hero-pin') : null;
  var heroScene = hero ? hero.querySelector('.hero-scene') : null;
  var heroStages = hero ? hero.querySelectorAll('.hero-stage') : [];
  var spot = document.getElementById('spot');
  var stageCounter = hero ? hero.querySelector('.stage-counter') : null;
  var annotGroups = hero ? hero.querySelectorAll('.annot-group') : [];
  var heroProgressEl = hero ? hero.querySelector('.hero-progress') : null;

  function easeInOut(t) { return t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function updateHero() {
    if (!hero || !heroScene) return;
    var p = progress(hero);                 // 0..1 across whole hero section
    var stages = SPOT.length;
    var local = p * (stages - 1);           // 0..(stages-1)
    var idx = Math.floor(local);
    if (idx >= stages - 1) idx = stages - 2;
    var f = easeInOut(local - idx);

    var a = SPOT[idx], b = SPOT[idx + 1];
    var scale = lerp(a.scale, b.scale, f);
    var tx = lerp(a.tx, b.tx, f);
    var ty = lerp(a.ty, b.ty, f);
    heroScene.style.setProperty('--scale', scale.toFixed(3));
    heroScene.style.setProperty('--tx', tx.toFixed(1) + 'px');
    heroScene.style.transform = 'scale(' + scale.toFixed(3) + ') translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';

    // spotlight rectangle interp
    if (spot) {
      spot.setAttribute('x', lerp(a.x, b.x, f));
      spot.setAttribute('y', lerp(a.y, b.y, f));
      spot.setAttribute('width', lerp(a.w, b.w, f));
      spot.setAttribute('height', lerp(a.h, b.h, f));
    }

    // active stage = nearest
    var nearest = Math.round(local);
    if (nearest > stages - 1) nearest = stages - 1;
    if (nearest < 0) nearest = 0;
    heroStages.forEach(function (st) {
      st.classList.toggle('active', parseInt(st.getAttribute('data-stage'), 10) === nearest);
    });
    annotGroups.forEach(function (g) {
      g.classList.toggle('show', parseInt(g.getAttribute('data-show-stage'), 10) === nearest);
    });
    if (stageCounter) {
      stageCounter.textContent = String(nearest + 1).padStart(2, '0') + ' / ' + String(stages).padStart(2, '0');
    }
    if (heroPin) heroPin.style.setProperty('--p', p.toFixed(3));
  }

  // ============== FORMATS — horizontal scroll ==============
  var formatsSec = document.getElementById('formats');
  var formatsPin = formatsSec ? formatsSec.querySelector('.formats-pin') : null;

  function updateFormats() {
    if (!formatsSec || !formatsPin) return;
    var p = progress(formatsSec);
    formatsPin.style.setProperty('--fp', p.toFixed(3));
  }

  // ============== PROCESS — pinned, line draws, steps light up ==============
  var processSec = document.getElementById('process');
  var processSteps = processSec ? processSec.querySelectorAll('.process-step') : [];
  var processRail = processSec ? processSec.querySelector('.process-rail') : null;

  function updateProcess() {
    if (!processSec) return;
    var p = progress(processSec);
    if (processRail) processRail.style.setProperty('--pp', p.toFixed(3));
    var n = processSteps.length;
    var active = Math.min(n - 1, Math.floor(p * n + 0.001));
    processSteps.forEach(function (s, i) {
      s.classList.toggle('active', i <= active);
    });
  }

  // ============== Generic parallax blobs ==============
  var parallaxEls = document.querySelectorAll('.parallax');
  function updateParallax() {
    parallaxEls.forEach(function (el) {
      var v = visibility(el.parentElement || el);
      var speed = parseFloat(el.getAttribute('data-speed')) || 0;
      el.style.setProperty('--py', (v * speed).toFixed(1));
    });
  }

  // ============== Body bg drift + nav shrink ==============
  var nav = document.getElementById('nav');
  function updateGlobal() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('shrunk', y > 8);
    document.body.style.setProperty('--bg-x', (y * 0.04).toFixed(1) + 'px');
    document.body.style.setProperty('--bg-y', (y * 0.06).toFixed(1) + 'px');
  }

  // single rAF loop
  var ticking = false;
  function tick() {
    ticking = false;
    if (!reduced) {
      updateGlobal();
      updateHero();
      updateFormats();
      updateProcess();
      updateParallax();
    }
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // initial paint
  if (!reduced) tick();
  else {
    if (heroStages.length) heroStages.forEach(function (s) { s.classList.add('active'); });
    if (annotGroups.length) annotGroups.forEach(function (g) { g.classList.add('show'); });
  }
})();
