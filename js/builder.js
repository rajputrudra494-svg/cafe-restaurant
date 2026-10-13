/* Build your own: the same base, crust and topping prices the counter uses,
   added up live, with a drawn pizza that fills as you pick. */
(function () {
  'use strict';

  var DATA = window.PS_MENU;
  var form = document.querySelector('[data-build]');
  if (!DATA || !form) return;

  var $ = function (s) { return document.querySelector(s); };
  var PS = window.PS || {};
  var SIZES = DATA.sizes;

  var crustCat = DATA.categories.filter(function (c) { return c.id === 'crust'; })[0];
  var topCat = DATA.categories.filter(function (c) { return c.id === 'toppings'; })[0];
  var BASE = crustCat.items.filter(function (i) { return /plain pizza base/i.test(i.n); })[0];
  var BURST = crustCat.items.filter(function (i) { return /cheese burst/i.test(i.n); })[0];
  var PAN = crustCat.items.filter(function (i) { return /pan crust/i.test(i.n); })[0];

  var CRUSTS = [
    { key: 'regular', name: 'Regular', note: 'the house base', p: [0, 0, 0, 0] },
    { key: 'burst', name: 'Cheese Burst', note: 'cheese in the rim', p: BURST ? BURST.p : [null, null, null, null] },
    { key: 'pan', name: 'Pan Crust', note: 'thicker, pan-baked', p: PAN ? PAN.p : [null, null, null, null] }
  ];

  /* a colour for every topping, so the drawing looks like the thing */
  var SWATCH = [
    [/black olive|kalamata/i, '#241f1c'],
    [/green olive/i, '#8a9a3b'],
    [/jalape/i, '#3f7d27'],
    [/green pepper/i, '#2d7b2e'],
    [/red pepper|paprika/i, '#c9271d'],
    [/cherry tomato|tomato/i, '#d1352a'],
    [/onion/i, '#9a5788'],
    [/spring onion/i, '#7fae4a'],
    [/mushroom/i, '#dcc4a3'],
    [/baby corn|sweet corn/i, '#f3b713'],
    [/pineapple/i, '#f0c33c'],
    [/spinach|broccoli/i, '#2f6b31'],
    [/eggplant/i, '#6b4a86'],
    [/zucchini/i, '#5f8f3f'],
    [/sausage|pepperoni/i, '#a33224'],
    [/walnut/i, '#8a6243'],
    [/paneer|ricotta|feta|cream cheese/i, '#fff6ea'],
    [/cheddar|colby|monterey/i, '#f0a93c'],
    [/cheese/i, '#f6dd9b']
  ];
  function colourFor(name) {
    for (var i = 0; i < SWATCH.length; i++) if (SWATCH[i][0].test(name)) return SWATCH[i][1];
    return '#e9c46a';
  }
  function groupFor(name) {
    if (/cheese|paneer|ricotta|feta|cheddar|colby|monterey/i.test(name)) return 'Cheeses';
    if (/sausage|pepperoni|walnut|pineapple/i.test(name)) return 'The interesting ones';
    return 'From the garden';
  }

  var state = { size: 1, crust: 'regular', tops: [] };

  /* ------------------------------------------------------------ fields */
  var sizeBox = $('[data-build-sizes]');
  var crustBox = $('[data-build-crusts]');
  var topsBox = $('[data-build-tops]');
  var priceEl = $('[data-build-price]');
  var noteEl = $('[data-build-note]');
  var countEl = $('[data-build-count]');
  var orderBtn = $('[data-build-order]');
  var resetBtn = $('[data-build-reset]');
  var pie = $('[data-build-pie]');
  var scaleG = pie ? pie.querySelector('[data-pie-scale]') : null;
  var topsLayer = pie ? pie.querySelector('[data-pie-tops]') : null;

  SIZES.forEach(function (size, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', i === state.size ? 'true' : 'false');
    b.innerHTML = '<b>' + size.inch + '″</b><span>' + size.label + ' · ₹' + BASE.p[i] + '</span>';
    b.addEventListener('click', function () { state.size = i; render(); });
    sizeBox.appendChild(b);
  });

  CRUSTS.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-crust', c.key);
    b.innerHTML = '<b>' + c.name + '</b><span data-crust-price>' + c.note + '</span>';
    b.addEventListener('click', function () {
      if (b.disabled) return;
      state.crust = c.key;
      render();
    });
    crustBox.appendChild(b);
    c.btn = b;
  });

  var topList = [];
  var seen = {};
  topCat.items.forEach(function (item) {
    var g = groupFor(item.n);
    if (!seen[g]) {
      var wrap = document.createElement('div');
      wrap.className = 'tops-group';
      var h = document.createElement('h4');
      h.textContent = g;
      wrap.appendChild(h);
      var list = document.createElement('div');
      list.className = 'tops';
      wrap.appendChild(list);
      topsBox.appendChild(wrap);
      seen[g] = list;
    }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'top';
    b.setAttribute('aria-pressed', 'false');
    var colour = colourFor(item.n);
    b.innerHTML = '<i style="background:' + colour + '"></i>' + item.n + ' <small data-top-price></small>';
    b.addEventListener('click', function () {
      if (b.disabled) return;
      var at = state.tops.indexOf(item.n);
      if (at >= 0) state.tops.splice(at, 1);
      else state.tops.push(item.n);
      render();
    });
    seen[g].appendChild(b);
    topList.push({ item: item, btn: b, colour: colour });
  });

  /* --------------------------------------------------------- the drawing */
  // deterministic scatter, so a topping always lands in the same places
  function seeded(n) {
    return function () {
      n = (n * 1664525 + 1013904223) % 4294967296;
      return n / 4294967296;
    };
  }
  function drawTops() {
    if (!topsLayer) return;
    while (topsLayer.firstChild) topsLayer.removeChild(topsLayer.firstChild);
    var NS = 'http://www.w3.org/2000/svg';
    state.tops.forEach(function (name, idx) {
      var colour = colourFor(name);
      var rand = seeded(name.length * 7919 + idx * 104729 + 13);
      var ring = /olive|jalape|onion/i.test(name);
      var n = 11;
      for (var i = 0; i < n; i++) {
        var a = rand() * Math.PI * 2;
        var d = Math.sqrt(rand()) * 133;
        var x = 200 + Math.cos(a) * d, y = 200 + Math.sin(a) * d;
        var r = 7 + rand() * 5;
        var el;
        if (ring) {
          el = document.createElementNS(NS, 'circle');
          el.setAttribute('r', r);
          el.setAttribute('fill', 'none');
          el.setAttribute('stroke', colour);
          el.setAttribute('stroke-width', r * 0.55);
        } else {
          el = document.createElementNS(NS, 'ellipse');
          el.setAttribute('rx', r * 1.2);
          el.setAttribute('ry', r * 0.78);
          el.setAttribute('fill', colour);
          el.setAttribute('transform', 'rotate(' + (rand() * 180 | 0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
        }
        el.setAttribute('cx', x.toFixed(1));
        el.setAttribute('cy', y.toFixed(1));
        el.setAttribute('opacity', '0.95');
        topsLayer.appendChild(el);
      }
    });
  }

  /* -------------------------------------------------------------- price */
  function crustOf(key) {
    return CRUSTS.filter(function (c) { return c.key === key; })[0];
  }
  function total() {
    var i = state.size;
    var sum = BASE.p[i] || 0;
    var c = crustOf(state.crust);
    if (c && c.p[i] != null) sum += c.p[i];
    state.tops.forEach(function (name) {
      var t = topList.filter(function (x) { return x.item.n === name; })[0];
      if (t && t.item.p[i] != null) sum += t.item.p[i];
    });
    return sum;
  }

  function render() {
    var i = state.size;

    Array.prototype.forEach.call(sizeBox.children, function (b, k) {
      b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });

    CRUSTS.forEach(function (c) {
      var ok = c.p[i] != null;
      c.btn.disabled = !ok;
      if (!ok && state.crust === c.key) state.crust = 'regular';
      c.btn.querySelector('[data-crust-price]').textContent =
        !ok ? 'not in ' + SIZES[i].inch + '″' : (c.p[i] ? '+₹' + c.p[i] : c.note);
    });
    CRUSTS.forEach(function (c) { c.btn.setAttribute('aria-pressed', state.crust === c.key ? 'true' : 'false'); });

    topList.forEach(function (t) {
      var p = t.item.p[i];
      var ok = p != null;
      t.btn.disabled = !ok;
      if (!ok) {
        var at = state.tops.indexOf(t.item.n);
        if (at >= 0) state.tops.splice(at, 1);
      }
      t.btn.querySelector('[data-top-price]').textContent = ok ? '+₹' + p : 'n/a';
      t.btn.setAttribute('aria-pressed', state.tops.indexOf(t.item.n) >= 0 ? 'true' : 'false');
    });

    if (scaleG) scaleG.setAttribute('transform', 'translate(200 200) scale(' + (0.76 + i * 0.08) + ') translate(-200 -200)');
    if (noteEl) noteEl.textContent = SIZES[i].inch + ' inch · ' + SIZES[i].label.toLowerCase();
    if (countEl) countEl.textContent = state.tops.length ? state.tops.length + (state.tops.length === 1 ? ' topping' : ' toppings') : 'no toppings yet';
    drawTops();

    var to = total();
    if (priceEl) {
      if (PS.rollPrice) PS.rollPrice(priceEl, to);
      else priceEl.textContent = to;
    }
    if (orderBtn) orderBtn.href = waLink(to);
  }

  function waLink(to) {
    var i = state.size;
    var c = crustOf(state.crust);
    var lines = [
      'Hi P’S Delicacies! I’d like to build a pizza:',
      '• Size: ' + SIZES[i].inch + ' inch (' + SIZES[i].label + ')',
      '• Crust: ' + (c ? c.name : 'Regular'),
      '• Toppings: ' + (state.tops.length ? state.tops.join(', ') : 'just cheese'),
      'That comes to about ₹' + to + ' on the site. Is that right?'
    ];
    return 'https://wa.me/919537246200?text=' + encodeURIComponent(lines.join('\n'));
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      state = { size: 1, crust: 'regular', tops: [] };
      render();
      if (PS.toast) PS.toast('Back to a plain base');
    });
  }
  if (orderBtn) {
    orderBtn.addEventListener('click', function () {
      if (PS.toast) PS.toast('Opening WhatsApp with your order');
    });
  }

  render();
})();
