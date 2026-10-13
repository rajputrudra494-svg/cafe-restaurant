/* The full menu: built from js/menu-data.js, searchable, filterable.
   Everything renders on load, so the page still works if the filters are
   never touched; search and chips only hide rows that don't match. */
(function () {
  'use strict';

  var DATA = window.PS_MENU;
  var out = document.querySelector('[data-menu-out]');
  if (!DATA || !out) return;

  var tabsBox = document.querySelector('[data-menu-tabs]');
  var input = document.querySelector('[data-menu-search]');
  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var countEl = document.querySelector('[data-menu-count]');
  var PS = window.PS || {};

  var SIZES = DATA.sizes;
  var groups = [];
  var tabs = [];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ------------------------------------------------------------- build */
  function rowEl(item, sized) {
    var row = document.createElement('div');
    row.className = 'row' + (sized ? ' row--sized' : '');

    var name = document.createElement('p');
    name.className = 'row__name';
    var label = document.createElement('span');
    label.setAttribute('data-name', '');
    label.textContent = item.n;
    name.appendChild(label);

    var veg = document.createElement('span');
    veg.className = 'veg-mark';
    veg.setAttribute('role', 'img');
    veg.setAttribute('aria-label', 'vegetarian');
    name.appendChild(veg);

    if (item.jain) {
      var j = document.createElement('i');
      j.className = 'badge badge--jain';
      j.textContent = 'J';
      j.setAttribute('role', 'img');
      j.setAttribute('aria-label', 'Jain on request');
      name.appendChild(j);
    }
    if (item.spicy) {
      var s = document.createElement('i');
      s.className = 'chilli';
      s.setAttribute('role', 'img');
      s.setAttribute('aria-label', 'spicy');
      name.appendChild(s);
    }
    if (item.note) {
      var note = document.createElement('span');
      note.className = 'row__note';
      note.textContent = item.note;
      name.appendChild(note);
    }
    row.appendChild(name);

    if (sized) {
      var cells = document.createElement('p');
      cells.className = 'row__sizes';
      SIZES.forEach(function (size, i) {
        var cell = document.createElement('span');
        var p = item.p[i];
        cell.setAttribute('data-size', size.inch + '″');
        if (p == null) { cell.className = 'na'; cell.textContent = '—'; cell.setAttribute('aria-label', 'not made in ' + size.inch + ' inch'); }
        else cell.textContent = p;
        cells.appendChild(cell);
      });
      row.appendChild(cells);
    } else {
      var price = document.createElement('p');
      price.className = 'row__price';
      price.textContent = '₹' + item.p;
      row.appendChild(price);
    }

    row._name = item.n.toLowerCase();
    row._note = (item.note || '').toLowerCase();
    row._jain = !!item.jain;
    row._spicy = !!item.spicy;
    row._label = label;
    return row;
  }

  var KICKERS = {
    signature: 'the ones with our name on them',
    classic: 'the plain-spoken end of the menu',
    crust: 'start here if you want to build it yourself',
    toppings: 'price is per pizza, per size',
    appetizers: 'bread, cheese, and things to share',
    pasta: 'finished in the pan, one size',
    salad: 'yes, really',
    dessert: 'the sweet two minutes at the end',
    extras: 'for dunking',
    beverages: 'cold, from the fridge'
  };

  DATA.categories.forEach(function (cat) {
    var sized = cat.type === 'sized';
    var sec = document.createElement('section');
    sec.className = 'ticket-group' + (sized ? ' ticket-group--sized' : '');
    sec.id = cat.id;

    var head = document.createElement('div');
    head.className = 'ticket-group__head';
    var title = document.createElement('div');
    var h2 = document.createElement('h2');
    h2.textContent = cat.name;
    title.appendChild(h2);
    var kick = document.createElement('p');
    kick.textContent = KICKERS[cat.id] || '';
    title.appendChild(kick);
    head.appendChild(title);

    if (sized) {
      var cols = document.createElement('div');
      cols.className = 'ticket-cols';
      cols.setAttribute('aria-hidden', 'true');
      SIZES.forEach(function (size) {
        var c = document.createElement('span');
        c.innerHTML = '<b>' + size.inch + '″</b>' + esc(size.key);
        cols.appendChild(c);
      });
      head.appendChild(cols);
    }
    sec.appendChild(head);

    var list = document.createElement('div');
    list.className = 'ticket-list' + (sized ? ' ticket-list--sized' : '');
    var rows = cat.items.map(function (item) {
      var r = rowEl(item, sized);
      list.appendChild(r);
      return r;
    });
    sec.appendChild(list);
    out.appendChild(sec);

    groups.push({ id: cat.id, name: cat.name, el: sec, rows: rows, count: rows.length });
  });

  var empty = document.createElement('div');
  empty.className = 'menu__empty';
  empty.hidden = true;
  empty.innerHTML = '<p class="script">nothing by that name</p><p>Try “paneer”, “garlic” or “cheese” — or clear the filters.</p>';
  out.appendChild(empty);

  /* -------------------------------------------------------------- tabs */
  if (tabsBox) {
    groups.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-selected', 'false');
      b.innerHTML = esc(g.name) + '<sup>' + g.count + '</sup>';
      b.addEventListener('click', function () {
        if (PS.scrollTo) PS.scrollTo(g.el, -150);
        else g.el.scrollIntoView({ behavior: 'smooth' });
        history.replaceState(null, '', '#' + g.id);
      });
      tabsBox.appendChild(b);
      tabs.push({ group: g, btn: b });
    });
  }

  function markActiveTab() {
    var best = null, bestTop = -Infinity;
    tabs.forEach(function (t) {
      if (t.group.el.hidden) return;
      var top = t.group.el.getBoundingClientRect().top - 180;
      if (top <= 0 && top > bestTop) { bestTop = top; best = t; }
    });
    if (!best && tabs.length) best = tabs[0];
    tabs.forEach(function (t) {
      var on = t === best;
      t.btn.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && tabsBox && tabsBox.scrollWidth > tabsBox.clientWidth) {
        var r = t.btn.getBoundingClientRect(), br = tabsBox.getBoundingClientRect();
        if (r.left < br.left || r.right > br.right) {
          tabsBox.scrollTo({ left: t.btn.offsetLeft - 12, behavior: 'smooth' });
        }
      }
    });
  }

  /* ------------------------------------------------------------ filter */
  var state = { q: '', jain: false, spicy: false };

  function highlight(row, q) {
    var el = row._label;
    if (!q) { el.textContent = el.textContent; return; }
    var name = el.textContent;
    var i = name.toLowerCase().indexOf(q);
    if (i < 0) return;
    el.innerHTML = esc(name.slice(0, i)) + '<mark>' + esc(name.slice(i, i + q.length)) + '</mark>' + esc(name.slice(i + q.length));
  }

  function apply() {
    var q = state.q.trim().toLowerCase();
    var shown = 0;
    groups.forEach(function (g) {
      var vis = 0;
      g.rows.forEach(function (row) {
        var ok = (!q || row._name.indexOf(q) >= 0 || row._note.indexOf(q) >= 0) &&
                 (!state.jain || row._jain) &&
                 (!state.spicy || row._spicy);
        row.hidden = !ok;
        if (ok) {
          vis++;
          row._label.textContent = row._label.textContent;   // drop old <mark>
          if (q) highlight(row, q);
        }
      });
      g.el.hidden = vis === 0;
      shown += vis;
      var tab = tabs.filter(function (t) { return t.group === g; })[0];
      if (tab) tab.btn.querySelector('sup').textContent = vis;
    });
    empty.hidden = shown > 0;
    if (countEl) countEl.textContent = shown;
    markActiveTab();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  if (input) {
    var t;
    input.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { state.q = input.value; apply(); }, 120);
    });
    input.addEventListener('search', function () { state.q = input.value; apply(); });
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var key = chip.getAttribute('data-filter');
      state[key] = !state[key];
      chip.setAttribute('aria-pressed', state[key] ? 'true' : 'false');
      apply();
    });
  });

  window.addEventListener('scroll', markActiveTab, { passive: true });
  if (window.PS && PS.lenis) PS.lenis.on('scroll', markActiveTab);
  apply();

  // deep links from the footer and the home page
  var hash = (location.hash || '').slice(1);
  if (hash && document.getElementById(hash)) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (PS.scrollTo) PS.scrollTo(document.getElementById(hash), -150);
      }, 420);
    });
  }
})();
