/* SDproject — site JS, vanilla, no deps */
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

  // shrink nav on scroll
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

  // reveal on scroll
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
