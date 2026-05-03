/* SDproject — site JS, vanilla */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Hero headline cycling: rotates through different ad-type nouns
  // ('външна реклама.' -> 'билборди.' -> 'рекламни елементи.') with a
  // typewriter effect (erase to empty, then type the next word).
  (function () {
    var els = document.querySelectorAll('[data-cycle]');
    if (!els.length || reduced) return;
    var words = [
      'външна реклама.',
      'билборди.',
      'рекламни елементи.'
    ];
    var ERASE_MS = 38;
    var TYPE_MS  = 70;
    var PAUSE_MS = 2200;

    function setAll(text) {
      for (var k = 0; k < els.length; k++) els[k].textContent = text;
    }
    function curr() { return els[0] ? els[0].textContent : ''; }

    function eraseTo(target, done) {
      var t = curr();
      if (t === target) { done(); return; }
      var arr = Array.from(t);
      arr.pop();
      setAll(arr.join(''));
      setTimeout(function () { eraseTo(target, done); }, ERASE_MS);
    }
    function typeTo(target, done) {
      var t = curr();
      if (t === target) { done(); return; }
      var arr = Array.from(target);
      var n = Array.from(t).length + 1;
      setAll(arr.slice(0, n).join(''));
      setTimeout(function () { typeTo(target, done); }, TYPE_MS);
    }
    function setTyping(on) {
      for (var k = 0; k < els.length; k++) els[k].classList.toggle('typing', on);
    }

    var i = 0;
    function cycle() {
      var next = (i + 1) % words.length;
      setTyping(true);
      eraseTo('', function () {
        typeTo(words[next], function () {
          i = next;
          setTyping(false);
          setTimeout(cycle, PAUSE_MS);
        });
      });
    }
    setTimeout(cycle, PAUSE_MS);
  })();

  // Animated process tape: stages light up one by one, connectors fill,
  // hold a moment with all done, then reset and repeat.
  (function () {
    var tape = document.querySelector('.process-tape');
    if (!tape) return;
    var stages = tape.querySelectorAll('.stage');
    var connectors = tape.querySelectorAll('.connector');
    var counter = document.getElementById('tape-count');
    if (!stages.length) return;

    var STEP_MS  = 1500; // delay between activations
    var FINAL_MS = 2200; // dwell after all done before reset

    function reset() {
      for (var k = 0; k < stages.length; k++) stages[k].classList.remove('active', 'done');
      for (var c = 0; c < connectors.length; c++) connectors[c].classList.remove('full');
      if (counter) counter.textContent = '01';
    }

    function setCounter(n) {
      if (!counter) return;
      counter.textContent = n < 10 ? '0' + n : '' + n;
    }

    if (reduced) {
      // show all done state, no animation
      for (var k = 0; k < stages.length; k++) stages[k].classList.add('done');
      for (var c = 0; c < connectors.length; c++) connectors[c].classList.add('full');
      setCounter(stages.length);
      return;
    }

    function cycle() {
      reset();
      var step = 0;

      function next() {
        if (step >= stages.length) {
          // mark final done, hold, then restart
          stages[stages.length - 1].classList.remove('active');
          stages[stages.length - 1].classList.add('done');
          if (connectors[stages.length - 2]) connectors[stages.length - 2].classList.add('full');
          setCounter(stages.length);
          setTimeout(cycle, FINAL_MS);
          return;
        }
        // mark previous as done + fill connector behind it
        if (step > 0) {
          stages[step - 1].classList.remove('active');
          stages[step - 1].classList.add('done');
          if (connectors[step - 1]) connectors[step - 1].classList.add('full');
        }
        // activate current
        stages[step].classList.add('active');
        setCounter(step + 1);
        step++;
        setTimeout(next, STEP_MS);
      }
      // first stage activates immediately
      next();
    }

    // start after the page settles
    setTimeout(cycle, 600);
  })();

  // Brand text cycling with a typewriter effect:
  // Erase only the part that changes one char at a time, then type the new value.
  // Updates ALL matching brand elements (header + footer) in sync.
  (function () {
    var names = document.querySelectorAll('[data-name]');
    var tlds  = document.querySelectorAll('[data-tld]');
    if (!names.length || !tlds.length || reduced) return;

    var states = [
      { name: 'uzakoniavanereklami', tld: '.com' },
      { name: 'uzakoniavanereklami', tld: '.bg'  },
      { name: 'uzakoniavanereklami', tld: '.eu'  },
      { name: 'узаконяванереклами',  tld: '.com' },
      { name: 'узаконяванереклами',  tld: '.bg'  },
      { name: 'узаконяванереклами',  tld: '.eu'  }
    ];

    var ERASE_MS = 35;   // ms between deletions
    var TYPE_MS  = 60;   // ms between insertions
    var PAUSE_MS = 1800; // dwell time after a state finishes

    function setAll(list, text) {
      for (var k = 0; k < list.length; k++) list[k].textContent = text;
    }
    function curr(list) { return list[0] ? list[0].textContent : ''; }

    function eraseTo(list, target, done) {
      var t = curr(list);
      if (t === target) { done(); return; }
      // remove one Unicode codepoint (handles Cyrillic + emoji safely)
      var arr = Array.from(t);
      arr.pop();
      setAll(list, arr.join(''));
      setTimeout(function () { eraseTo(list, target, done); }, ERASE_MS);
    }
    function typeTo(list, target, done) {
      var t = curr(list);
      if (t === target) { done(); return; }
      var arr = Array.from(target);
      var n = Array.from(t).length + 1;
      setAll(list, arr.slice(0, n).join(''));
      setTimeout(function () { typeTo(list, target, done); }, TYPE_MS);
    }

    function transition(from, to, done) {
      var nameChanged = from.name !== to.name;
      var tldChanged  = from.tld  !== to.tld;
      if (nameChanged) {
        // Erase TLD then name, then type new name then new TLD
        eraseTo(tlds, '', function () {
          eraseTo(names, '', function () {
            typeTo(names, to.name, function () {
              typeTo(tlds, to.tld, done);
            });
          });
        });
      } else if (tldChanged) {
        eraseTo(tlds, '', function () {
          typeTo(tlds, to.tld, done);
        });
      } else {
        done();
      }
    }

    function setTyping(on) {
      for (var k = 0; k < names.length; k++) {
        var holder = names[k].parentNode;
        if (holder) holder.classList.toggle('typing', on);
      }
    }

    var i = 0;
    function cycle() {
      var next = (i + 1) % states.length;
      setTyping(true);
      transition(states[i], states[next], function () {
        i = next;
        setTyping(false);
        setTimeout(cycle, PAUSE_MS);
      });
    }

    setTimeout(cycle, PAUSE_MS);
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
