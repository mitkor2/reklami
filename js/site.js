/* SDproject — site JS, vanilla */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Brand text cycling: TLD cycles, then name flips Latin <-> Cyrillic
  (function () {
    var nameEl = document.querySelector('[data-name]');
    var tldEl  = document.querySelector('[data-tld]');
    if (!nameEl || !tldEl || reduced) return;
    var states = [
      { name: 'uzakoniavanereklami', tld: '.com' },
      { name: 'uzakoniavanereklami', tld: '.bg'  },
      { name: 'uzakoniavanereklami', tld: '.eu'  },
      { name: 'узаконяванереклами',  tld: '.com' },
      { name: 'узаконяванереклами',  tld: '.bg'  },
      { name: 'узаконяванереклами',  tld: '.eu'  }
    ];
    var i = 0;
    setInterval(function () {
      var next = (i + 1) % states.length;
      var nameChanged = states[i].name !== states[next].name;
      var tldChanged  = states[i].tld  !== states[next].tld;
      if (nameChanged) nameEl.classList.add('swap');
      if (tldChanged)  tldEl.classList.add('swap');
      setTimeout(function () {
        nameEl.textContent = states[next].name;
        tldEl.textContent  = states[next].tld;
        nameEl.classList.remove('swap');
        tldEl.classList.remove('swap');
        i = next;
      }, 260);
    }, 2200);
  })();

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

  var nav = document.getElementById('nav');
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        var s = window.pageYOffset || document.documentElement.scrollTop;
        if (nav) nav.classList.toggle('shrunk', s > 8);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

  // day/night badge — sync with the 32s CSS cycle
  var modeIcon = document.getElementById('scene-mode-icon');
  var modeText = document.getElementById('scene-mode-text');
  if (modeIcon && modeText && !reduced) {
    var CYCLE = 32000; // must match --cycle in CSS
    var t0 = performance.now();
    function loop() {
      var t = ((performance.now() - t0) % CYCLE) / CYCLE;
      // 0..0.36 day, 0.36..0.46 dusk, 0.46..0.86 night, 0.86..1 dawn
      var label = 'ден';
      var isNight = false;
      if (t < .36)        { label = 'ден';  isNight = false; }
      else if (t < .46)   { label = 'залез'; isNight = false; }
      else if (t < .86)   { label = 'нощ';  isNight = true;  }
      else                { label = 'изгрев'; isNight = false; }
      if (modeText.textContent !== label) modeText.textContent = label;
      modeIcon.classList.toggle('night', isNight);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // counters
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
})();
