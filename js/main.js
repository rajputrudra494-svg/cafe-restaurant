/* P'S Delicacies: shared behaviour for every page.
   GSAP + ScrollTrigger + Lenis come from CDNs; everything here degrades to a
   plain, fully readable page if any of them fail to load. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!hasGsap || reduce) root.classList.remove('has-motion');
  var motion = root.classList.contains('has-motion');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var PS = window.PS = window.PS || {};
  PS.motion = motion;

  /* ---------------------------------------------------------------- toast */
  var toastEl;
  PS.toast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  };

  /* --------------------------------------------------------- smooth scroll */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.95 });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  PS.lenis = lenis;

  PS.scrollTo = function (target, offset) {
    var el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    var off = offset == null ? -90 : offset;
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.3 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset + off, behavior: reduce ? 'auto' : 'smooth' });
  };

  // same-page anchors
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = document.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    closeDrawer();
    PS.scrollTo(el);
    history.replaceState(null, '', id);
  });

  /* ------------------------------------------------ page curtain transitions */
  var curtain = $('.curtain');
  function isInternalPage(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(tel:|mailto:|https?:|\/\/)/i.test(href)) return false;
    return /\.html(#.*)?$/i.test(href) || href === './' || href === '/';
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a');
    if (!isInternalPage(a) || !curtain) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname) {
      // same page with a hash: just scroll
      if (url.hash) { var t = document.getElementById(url.hash.slice(1)); if (t) { e.preventDefault(); closeDrawer(); PS.scrollTo(t); } }
      return;
    }
    e.preventDefault();
    try { sessionStorage.setItem('ps-transition', '1'); } catch (err) {}
    curtain.style.transformOrigin = 'bottom';
    curtain.classList.add('is-covering');
    setTimeout(function () { location.href = a.href; }, reduce ? 0 : 560);
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && curtain) { curtain.classList.remove('is-covering'); root.classList.remove('transitioning'); }
  });

  function revealPage(done) {
    if (root.classList.contains('transitioning') && curtain) {
      curtain.style.transformOrigin = 'top';
      requestAnimationFrame(function () {
        root.classList.remove('transitioning');
        curtain.classList.remove('is-covering');
      });
      setTimeout(done, reduce ? 0 : 380);
    } else done();
  }

  /* ------------------------------------------------------------------ nav */
  var nav = $('[data-nav]');
  var lastY = 0;
  function onScroll(y) {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 30);
    var drawerOpen = body.classList.contains('drawer-open');
    var hide = !drawerOpen && y > 240 && y > lastY + 2;
    var show = y < lastY - 2 || y < 240;
    if (hide) nav.classList.add('is-hidden');
    else if (show) nav.classList.remove('is-hidden');
    body.classList.toggle('nav-visible', !nav.classList.contains('is-hidden'));
    lastY = y;
  }
  if (lenis) lenis.on('scroll', function (l) { onScroll(l.scroll); });
  else window.addEventListener('scroll', function () { onScroll(window.pageYOffset); }, { passive: true });
  onScroll(window.pageYOffset);

  var burger = $('[data-burger]');
  var drawer = $('[data-drawer]');
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    body.classList.remove('drawer-open');
    if (lenis) lenis.start();
  }
  function openDrawer() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    body.classList.add('drawer-open');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop();
    if (motion) gsap.fromTo($$('nav a', drawer), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out', delay: 0.15 });
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1100) closeDrawer(); });
  }
  PS.closeDrawer = closeDrawer;

  /* --------------------------------------- red steel grid, like the ceiling */
  // A ceiling plane seen from below, projected by hand: beams that run away
  // from you converge on a vanishing point, cross beams bunch up with depth.
  function drawSteel(svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var W = 1600, H = 900;
    var soft = svg.getAttribute('data-grid') === 'soft';
    var vx = soft ? 800 : 1120, horizon = soft ? 520 : 470;
    var h = 1;                                  // ceiling height (unit)
    var F = horizon + 60;                       // so z=1 lands just above the frame
    var frag = document.createDocumentFragment();
    function beam(x1, y1, x2, y2, w) {
      var g = document.createElementNS(NS, 'g');
      var a = document.createElementNS(NS, 'line');
      var b = document.createElementNS(NS, 'line');
      a.setAttribute('class', 'beam-a'); b.setAttribute('class', 'beam-b');
      [[a, 0], [b, w * 0.9]].forEach(function (p) {
        p[0].setAttribute('x1', x1); p[0].setAttribute('y1', y1 + p[1]);
        p[0].setAttribute('x2', x2); p[0].setAttribute('y2', y2 + p[1]);
        p[0].style.strokeWidth = w;
      });
      g.appendChild(b); g.appendChild(a);
      frag.appendChild(g);
    }
    var zFar = 9;
    var yFar = horizon - (h * F) / zFar;
    // long beams (run into the distance)
    for (var j = -7; j <= 7; j++) {
      var X = j * 0.9;
      var xn = vx + (X * F) / 1, yn = horizon - (h * F) / 1;
      var xf = vx + (X * F) / zFar;
      beam(xn, yn, xf, yFar, 4.2);
    }
    // cross beams
    for (var z = 1.15; z <= zFar; z *= 1.32) {
      var y = horizon - (h * F) / z;
      var xl = vx - (7 * 0.9 * F) / z, xr = vx + (7 * 0.9 * F) / z;
      beam(Math.max(xl, -200), y, Math.min(xr, W + 200), y, Math.max(1.2, 5.2 / z));
    }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.classList.add('steel');
    if (soft) svg.classList.add('steel--soft');
    svg.appendChild(frag);
    return $$('line', svg);
  }
  var steelLines = [];
  $$('[data-grid]').forEach(function (svg) { steelLines = steelLines.concat(drawSteel(svg)); });

  function animateSteel(lines, delay) {
    if (!motion || !lines.length) return;
    lines.forEach(function (l) {
      var len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
      l.style.strokeDasharray = len;
      l.style.strokeDashoffset = len;
    });
    gsap.to(lines, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: { each: 0.012, from: 'random' }, delay: delay || 0 });
  }

  /* ------------------------------------------------------- split headings */
  $$('[data-split] .line').forEach(function (line) {
    if (line.firstElementChild && line.firstElementChild.classList.contains('in')) return;
    var span = document.createElement('span');
    span.className = 'in';
    while (line.firstChild) span.appendChild(line.firstChild);
    line.appendChild(span);
  });

  function splitIn(el, delay) {
    return gsap.fromTo($$('.line > span', el), { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.09, delay: delay || 0 });
  }

  /* -------------------------------------------------------------- counters */
  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(end)) return;
    var start = el.hasAttribute('data-from') ? parseInt(el.getAttribute('data-from'), 10) : 0;
    if (!motion) { el.textContent = end; return; }
    var o = { v: start };
    gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
  }

  /* ------------------------------------------------- scroll-driven bits */
  function setupScrollAnimations() {
    if (!motion) {
      $$('[data-count]').forEach(countUp);
      return;
    }
    $$('[data-split]').forEach(function (el) {
      if (el.closest('[data-intro]')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: function () { splitIn(el); } });
    });
    $$('[data-reveal]').forEach(function (el) {
      if (el.closest('[data-intro]')) return;
      var pop = el.getAttribute('data-reveal') === 'pop';
      var rot = parseFloat(el.getAttribute('data-rot') || 0);
      var from = pop ? { opacity: 0, y: 20, scale: 0.82, rotation: rot - 10 } : { opacity: 0, y: 34 };
      var to = pop ? { opacity: 1, y: 0, scale: 1, rotation: rot, duration: 0.9, ease: 'back.out(1.7)' }
                   : { opacity: 1, y: 0, duration: 1, ease: 'power3.out' };
      to.scrollTrigger = { trigger: el, start: 'top 88%', once: true };
      gsap.fromTo(el, from, to);
    });
    $$('[data-stagger]').forEach(function (wrap) {
      var kids = Array.prototype.slice.call(wrap.children);
      gsap.fromTo(kids, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    });
    $$('[data-parallax]').forEach(function (el) {
      var img = $('img', el) || el;
      var amt = parseFloat(el.getAttribute('data-parallax')) || 6;
      gsap.fromTo(img, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-count]').forEach(function (el) {
      if (el.closest('[data-intro]')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { countUp(el); } });
    });
    var embosses = $$('.emboss');
    embosses.forEach(function (el) {
      gsap.fromTo(el, { xPercent: -50, x: 60 }, { xPercent: -50, x: -60, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-grid]').forEach(function (svg) {
      if (svg.closest('[data-intro]')) return;
      ScrollTrigger.create({ trigger: svg.parentElement, start: 'top 80%', once: true, onEnter: function () { animateSteel($$('line', svg)); } });
    });

    // photo strip drifts sideways with the scroll
    var strip = $('[data-strip]');
    if (strip) {
      gsap.fromTo(strip, { x: 0 }, {
        x: function () { return -Math.max(0, strip.scrollWidth - window.innerWidth); },
        ease: 'none',
        scrollTrigger: { trigger: strip.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true }
      });
    }

    // marquee speeds up while you scroll, then settles
    var mq = $('[data-marquee]');
    if (mq && mq.getAnimations) {
      var anim = mq.getAnimations()[0];
      if (anim) {
        var rate = 1;
        ScrollTrigger.create({ onUpdate: function (self) { rate = Math.min(4, 1 + Math.abs(self.getVelocity()) / 700); } });
        gsap.ticker.add(function () {
          anim.playbackRate += (rate - anim.playbackRate) * 0.08;
          rate += (1 - rate) * 0.05;
        });
      }
    }
  }

  /* -------------------------------------------------------- magnetic CTAs */
  if (finePointer && motion) {
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* -------------------------------------------- signature dishes (home) */
  var SIZE_LABELS = ['10″', '12″', '14″', '16″'];
  function rollPrice(el, to) {
    var from = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
    if (!motion) { el.textContent = to; return; }
    var o = { v: from };
    gsap.to(o, { v: to, duration: 0.5, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
  }
  PS.rollPrice = rollPrice;
  $$('[data-dish][data-prices]').forEach(function (card) {
    var prices = card.getAttribute('data-prices').split(',').map(Number);
    var holder = $('.sizes', card);
    var out = $('[data-price]', card);
    if (!holder || prices.length < 2) return;
    prices.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = SIZE_LABELS[i];
      b.setAttribute('aria-pressed', i === 1 ? 'true' : 'false');
      b.setAttribute('aria-label', SIZE_LABELS[i].replace('″', ' inch') + ', ₹' + p);
      b.addEventListener('click', function () {
        $$('button', holder).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        rollPrice(out, p);
        var img = $('.dish__plate img', card);
        if (img && motion) gsap.fromTo(img, { scale: 0.86 + i * 0.03 }, { scale: 0.9 + i * 0.05, duration: 0.6, ease: 'back.out(2)' });
      });
      holder.appendChild(b);
    });
    out.textContent = prices[1];
  });

  function setupSignatureScroll() {
    var sig = $('[data-sig]');
    var track = $('[data-sig-track]');
    if (!sig || !track || !motion) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 960px)', function () {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: sig, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      $$('.dish__plate img', track).forEach(function (img) {
        gsap.fromTo(img, { rotation: -40 }, { rotation: 40, ease: 'none', scrollTrigger: { trigger: img.closest('.dish'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () { gsap.set(track, { clearProps: 'x' }); };
    });
  }

  /* ------------------------------------------------- locations (visit) */
  var LOCS = {
    surat: {
      map: 'https://maps.google.com/maps?q=International%20Wealth%20Center%2C%20VIP%20Road%2C%20Vesu%2C%20Surat%20395007&z=16&output=embed',
      dir: 'https://www.google.com/maps/search/?api=1&query=International+Wealth+Center+VIP+Road+Vesu+Surat+395007'
    },
    bardoli: {
      map: 'https://maps.google.com/maps?q=21.1438733,73.091353&z=16&output=embed',
      dir: 'https://www.google.com/maps/search/?api=1&query=21.1438733,73.091353'
    }
  };
  var locBtns = $$('[data-loc]');
  var frame = $('[data-map-frame]');
  var dirBtn = $('[data-directions]');
  function setLoc(key, focus) {
    locBtns.forEach(function (b) {
      var on = b.getAttribute('data-loc') === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    if (frame && LOCS[key] && frame.getAttribute('src') !== LOCS[key].map) frame.setAttribute('src', LOCS[key].map);
    if (dirBtn && LOCS[key]) dirBtn.href = LOCS[key].dir;
  }
  locBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { setLoc(b.getAttribute('data-loc')); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = locBtns[(i + (e.key === 'ArrowRight' ? 1 : locBtns.length - 1)) % locBtns.length];
      setLoc(n.getAttribute('data-loc'), true);
    });
  });
  if (locBtns.length) {
    var want = (location.hash || '').replace('#', '');
    setLoc(LOCS[want] ? want : 'surat');
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------- home hero: scroll pulls a slice */
  function setupHeroPull() {
    var hero = $('[data-hero]');
    if (!hero) return;
    var scribB = $('.scribble--b', hero);
    var tag = $('.hero__tag', hero);
    PS.lift = 0;
    if (!motion) return;
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: '+=85%',
      pin: true, anticipatePin: 1,
      onUpdate: function (self) {
        var p = self.progress;
        PS.lift = p;
        if (PS.pizza) PS.pizza.setLift(p);
        if (scribB) scribB.style.opacity = String(Math.max(0, 1 - p * 3));
        if (tag) tag.style.transform = 'rotate(' + (-4 + p * 6) + 'deg) translateY(' + (-p * 30) + 'px)';
      }
    });
  }

  /* ---------------------------------------------------------------- intro */
  function intro() {
    var box = $('[data-intro]');
    if (!box) return;
    if (!motion) { $$('[data-count]', box).forEach(countUp); return; }
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    animateSteel($$('[data-grid] line', box), 0);
    $$('[data-split]', box).forEach(function (el, i) { tl.add(splitIn(el), 0.1 + i * 0.1); });
    tl.fromTo($$('[data-hero-fade]', box), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.45);
    var pops = $$('[data-reveal]', box);
    pops.forEach(function (el) {
      var rot = parseFloat(el.getAttribute('data-rot') || 0);
      if (el.getAttribute('data-reveal') === 'pop') tl.fromTo(el, { opacity: 0, scale: 0.8, rotation: rot - 10 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.9, ease: 'back.out(1.8)' }, 0.9);
      else tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, 0.6);
    });
    $$('[data-count]', box).forEach(function (el) { tl.call(function () { countUp(el); }, null, 0.7); });
    tl.call(function () { window.dispatchEvent(new CustomEvent('ps:intro')); }, null, 0.2);
  }

  /* --------------------------------------------------------- loader + go */
  function hideLoader(cb) {
    if (root.classList.contains('seen')) { body.classList.add('is-loaded'); cb(); return; }
    var done = false;
    function go() {
      if (done) return;
      done = true;
      var wait = Math.max(0, 900 - performance.now());
      setTimeout(function () {
        body.classList.add('is-loaded');
        try { sessionStorage.setItem('ps-seen', '1'); } catch (e) {}
        setTimeout(cb, 260);
      }, wait);
    }
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go);
    setTimeout(go, 2600);
  }

  if (hasGsap) {
    setupHeroPull();
    setupSignatureScroll();
  }
  setupScrollAnimations();
  PS.ready = true;
  window.dispatchEvent(new CustomEvent('ps:ready'));

  hideLoader(function () { revealPage(intro); });

  if (hasGsap) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  // land on a #hash from another page once layout has settled
  if (location.hash && location.hash.length > 1) {
    var target = document.getElementById(location.hash.slice(1));
    if (target && !target.hasAttribute('data-loc')) {
      window.addEventListener('load', function () { setTimeout(function () { PS.scrollTo(target); }, 450); });
    }
  }
})();
