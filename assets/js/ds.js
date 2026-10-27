/* Behaviour for the design-system pages: theme, density and contrast
   switches, light/dark specimen pairs, and the few interactions the sample
   views demonstrate. Everything renders without it; it only adds the
   second theme and the toggles. */
(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  ['theme', 'density', 'contrast', 'motion'].forEach(function (k) {
    var v = params.get(k);
    if (v) root.setAttribute('data-' + k, v);
  });
  if (params.get('dir') === 'rtl') root.setAttribute('dir', 'rtl');

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    var B = window.PHAROAM_BRAND || {};

    // Brand marks drawn from one source so every page shows the same logo.
    // The seal: the simplified drawing for small marks, the full one when
    // data-mark="full". Its disc takes the ink and its lines the ground, so it
    // inverts with the theme.
    document.querySelectorAll('[data-mark]').forEach(function (el) {
      var full = el.getAttribute('data-mark') === 'full';
      el.innerHTML = '<svg viewBox="0 0 64 64" class="mark" aria-hidden="true">' + (full ? B.sealFull : B.seal) + '</svg>';
    });
    // The wordmark: the open line P as the first letter, then "haroam".
    document.querySelectorAll('[data-wordmark]').forEach(function (el) {
      el.innerHTML = '<svg viewBox="' + B.wordmarkVB + '" class="wordmark" role="img" aria-label="Pharoam">' + B.wordmark + '</svg>';
    });

    // Light and dark side by side: the light specimen is written once and
    // cloned into a dark scope.
    document.querySelectorAll('[data-pair]').forEach(function (el) {
      var light = document.createElement('div');
      var dark = document.createElement('div');
      light.className = dark.className = 'pair-side';
      light.setAttribute('data-theme', 'light');
      dark.setAttribute('data-theme', 'dark');
      while (el.firstChild) light.appendChild(el.firstChild);
      var copy = light.cloneNode(true);
      copy.querySelectorAll('[id]').forEach(function (n) { n.id = n.id + '-dark'; });
      copy.querySelectorAll('[for]').forEach(function (n) { n.setAttribute('for', n.getAttribute('for') + '-dark'); });
      copy.querySelectorAll('[aria-controls]').forEach(function (n) { n.setAttribute('aria-controls', n.getAttribute('aria-controls') + '-dark'); });
      copy.querySelectorAll('[aria-describedby]').forEach(function (n) { n.setAttribute('aria-describedby', n.getAttribute('aria-describedby') + '-dark'); });
      copy.querySelectorAll('[aria-labelledby]').forEach(function (n) { n.setAttribute('aria-labelledby', n.getAttribute('aria-labelledby') + '-dark'); });
      copy.querySelectorAll('input[name]').forEach(function (n) { n.name = n.name + '-dark'; });
      copy.querySelectorAll('[data-accept-all]').forEach(function (n) { n.setAttribute('data-accept-all', n.getAttribute('data-accept-all') + '-dark'); });
      copy.querySelectorAll('[data-list-tools]').forEach(function (n) {
        n.setAttribute('data-list-tools', n.getAttribute('data-list-tools').split(',').map(function (id) { return id.trim() + '-dark'; }).join(','));
      });
      copy.querySelectorAll('[data-list-foot]').forEach(function (n) { n.setAttribute('data-list-foot', n.getAttribute('data-list-foot') + '-dark'); });
      while (copy.firstChild) dark.appendChild(copy.firstChild);
      var lt = document.createElement('p'); lt.className = 'pair-label'; lt.textContent = 'Light';
      var dt = document.createElement('p'); dt.className = 'pair-label'; dt.textContent = 'Dark';
      light.prepend(lt); dark.prepend(dt);
      el.appendChild(light); el.appendChild(dark);
      el.classList.add('pair');
    });

    // Page-level switches: theme, density, contrast, labels.
    function syncSwitches() {
      document.querySelectorAll('[data-set]').forEach(function (b) {
        var parts = b.getAttribute('data-set').split('=');
        var on = (root.getAttribute('data-' + parts[0]) || defaults[parts[0]]) === parts[1];
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    var defaults = {
      theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      density: 'compact', contrast: 'normal', annotate: 'off', dir: 'ltr'
    };
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set]');
      if (!b) return;
      var parts = b.getAttribute('data-set').split('=');
      if (parts[0] === 'dir') root.setAttribute('dir', parts[1]);
      root.setAttribute('data-' + parts[0], parts[1]);
      syncSwitches();
    });
    syncSwitches();

    // Show file: a disclosure between the friendly view and the file.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-show-file]');
      if (!b) return;
      var panel = document.getElementById(b.getAttribute('aria-controls'));
      var friendly = document.getElementById(b.getAttribute('data-show-file'));
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
      b.querySelector('.label').textContent = open ? 'Show file' : 'Hide file';
      if (panel) panel.hidden = open;
      if (friendly) friendly.hidden = !open;
    });

    // AI judgement review: accept, adjust or skip each one, or accept all.
    // The decision stays visible and can be undone.
    var LEVELS = ['Aware', 'Beginner', 'Working', 'Proficient', 'Expert'];
    var STATES = {
      accept: ['is-accepted', 'ai-accepted', 'check', 'Accepted by you'],
      adjust: ['is-adjusted', 'ai-adjusted', 'pencil', 'Adjusted by you'],
      skip: ['is-skipped', 'ai-skipped', 'x', 'Skipped by you']
    };
    function say(text) { var live = document.getElementById('queue-live'); if (live) live.textContent = text; }
    function stairs() { return '<span class="stairs" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>'; }
    function decide(item, how) {
      var st = STATES[how];
      var tag = item.querySelector('.q-state');
      item.classList.remove('is-accepted', 'is-adjusted', 'is-skipped');
      item.classList.add(st[0]);
      tag.className = 'tag q-state ' + st[1];
      tag.innerHTML = '<svg class="ic"><use href="#i-' + st[2] + '"/></svg>' + st[3];
      item.querySelector('.q-actions').innerHTML = '<button class="btn btn-quiet btn-sm" data-undo>Undo</button>';
      updateWaiting();
    }
    function updateWaiting() {
      document.querySelectorAll('[data-accept-all]').forEach(function (b) {
        var list = document.getElementById(b.getAttribute('data-accept-all'));
        var n = list ? list.querySelectorAll('.queue-item:not(.is-accepted):not(.is-adjusted):not(.is-skipped)').length : 0;
        b.disabled = n === 0;
        b.querySelector('.n').textContent = n;
      });
    }
    updateWaiting();
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-decide]');
      if (!b) return;
      var item = b.closest('.queue-item');
      var how = b.getAttribute('data-decide');
      if (how === 'adjust') {
        // Adjust: pick the level yourself; it is saved as self-reported.
        var name = item.querySelector('strong').textContent;
        var cur = +item.querySelector('.lvl').getAttribute('data-level');
        var opts = LEVELS.map(function (l, i) { return '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>' + l + '</option>'; }).join('');
        item.querySelector('.q-actions').innerHTML =
          '<select class="select" style="min-height:28px;inline-size:auto" aria-label="Your level for ' + name + '">' + opts + '</select>' +
          '<button class="btn btn-secondary btn-sm" data-adjust-save>Save</button>';
        item.querySelector('select').focus();
        return;
      }
      decide(item, how);
      say(how === 'accept' ? 'Accepted as an AI judgement. A diagnostic result still comes first.' : 'Skipped. It stays in the history.');
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-adjust-save]');
      if (!b) return;
      var item = b.closest('.queue-item');
      var v = +item.querySelector('select').value;
      var lvl = item.querySelector('.lvl');
      if (item.dataset.proposed == null) item.dataset.proposed = lvl.getAttribute('data-level');
      lvl.setAttribute('data-level', v);
      lvl.innerHTML = stairs() + LEVELS[v];
      decide(item, 'adjust');
      say('Adjusted to ' + LEVELS[v] + '. It is saved as your own level, self-reported.');
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-accept-all]');
      if (!b) return;
      var list = document.getElementById(b.getAttribute('data-accept-all'));
      var waiting = list.querySelectorAll('.queue-item:not(.is-accepted):not(.is-adjusted):not(.is-skipped)');
      waiting.forEach(function (item) { decide(item, 'accept'); });
      say('Accepted ' + waiting.length + '. Each one can still be undone.');
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-undo]');
      if (!b) return;
      var item = b.closest('.queue-item');
      item.classList.remove('is-accepted', 'is-adjusted', 'is-skipped');
      if (item.dataset.proposed != null) {
        // Undoing an adjustment brings back the level the AI proposed.
        var lvl = item.querySelector('.lvl'), n = +item.dataset.proposed;
        lvl.setAttribute('data-level', n);
        lvl.innerHTML = stairs() + LEVELS[n];
        delete item.dataset.proposed;
      }
      var tag = item.querySelector('.q-state');
      tag.className = 'tag q-state ai-pending';
      tag.innerHTML = '<svg class="ic"><use href="#i-ai"/></svg>Pending';
      item.querySelector('.q-actions').innerHTML =
        '<button class="btn btn-secondary btn-sm" data-decide="accept">Accept</button>' +
        '<button class="btn btn-quiet btn-sm" data-decide="adjust">Adjust</button>' +
        '<button class="btn btn-quiet btn-sm" data-decide="skip">Skip</button>';
      updateWaiting();
    });

    // Disclosures: a button that shows and hides one region, its label
    // following the state. A link to a hidden region's id opens it.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-disclose]');
      if (!b) return;
      var region = document.getElementById(b.getAttribute('aria-controls'));
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (region) region.hidden = open;
      var label = b.querySelector('.label');
      if (label) label.textContent = open ? b.getAttribute('data-closed') : b.getAttribute('data-open');
    });
    function openFromHash() {
      var id = location.hash.slice(1);
      var region = id && document.getElementById(id);
      if (!region || !region.hidden) return;
      var b = document.querySelector('[data-disclose][aria-controls="' + id + '"]');
      if (b) { b.click(); region.scrollIntoView(); }
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);

    // "?" beside an action: opens and closes its explanation; Escape closes.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-help]');
      document.querySelectorAll('[data-help][aria-expanded="true"]').forEach(function (o) {
        if (o === b) return;
        o.setAttribute('aria-expanded', 'false');
        document.getElementById(o.getAttribute('aria-controls')).hidden = true;
      });
      if (!b) return;
      var pop = document.getElementById(b.getAttribute('aria-controls'));
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
      pop.hidden = open;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('[data-help][aria-expanded="true"]').forEach(function (o) {
        o.setAttribute('aria-expanded', 'false');
        document.getElementById(o.getAttribute('aria-controls')).hidden = true;
        o.focus();
      });
    });

    // Dialogs: the AI data notice and the conflict view.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dialog]');
      if (b) { var d = document.getElementById(b.getAttribute('data-dialog')); if (d) d.showModal(); return; }
      var c = e.target.closest('[data-close]');
      if (c) c.closest('dialog').close();
    });

    // Self-claim prompt: skipping it leaves the claim as it is.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-claim-skip]');
      if (!b) return;
      var p = b.closest('.claim-prompt');
      p.innerHTML = '<p class="t-meta" style="margin:0">Kept as self-reported. You can check it from the skill at any time.</p>';
    });

    // List tools: search, filter, sort and show more over one or more tables.
    // Rows carry data-row, data-name, data-tags and the keys they sort by.
    // Counts follow the view; group and sub-group rows hide when they empty.
    document.querySelectorAll('[data-list-tools]').forEach(function (bar) {
      var bodies = bar.getAttribute('data-list-tools').split(',').map(function (id) {
        return document.getElementById(id.trim());
      }).filter(Boolean);
      var noun = bar.getAttribute('data-noun') || 'items';
      var pageSize = +bar.getAttribute('data-page-size') || 0;
      var search = bar.querySelector('[data-search]');
      var sort = bar.querySelector('[data-sort]');
      var countEl = bar.querySelector('.count');
      var foot = document.querySelector('[data-list-foot="' + bar.id + '"]');
      var filter = 'all';
      var showAll = false;
      bodies.forEach(function (tb) {
        Array.prototype.forEach.call(tb.rows, function (r, i) { r.setAttribute('data-order', i); });
      });
      function val(r, k) { return r.getAttribute('data-' + k) || ''; }
      function compare(mode) {
        var parts = mode.split(':'), k = parts[0], dir = parts[1] === 'desc' ? -1 : 1;
        return function (a, b) {
          var x = val(a, k), y = val(b, k);
          var n = (x !== '' && y !== '' && !isNaN(x) && !isNaN(y)) ? (x - y) : x.localeCompare(y);
          return n * dir || val(a, 'name').localeCompare(val(b, 'name'));
        };
      }
      function apply() {
        var q = search ? search.value.trim().toLowerCase() : '';
        var mode = sort ? sort.value : 'default';
        var total = 0, matched = 0, shown = 0;
        bodies.forEach(function (tb) {
          var table = tb.closest('table');
          var rows = Array.prototype.filter.call(tb.rows, function (r) { return r.hasAttribute('data-row'); });
          var flat = mode !== 'default';
          table.classList.toggle('is-flat', flat);
          var all = Array.prototype.slice.call(tb.rows).filter(function (r) { return !r.classList.contains('list-empty'); });
          if (flat) rows.slice().sort(compare(mode)).forEach(function (r) { tb.appendChild(r); });
          else all.sort(function (a, b) { return a.getAttribute('data-order') - b.getAttribute('data-order'); }).forEach(function (r) { tb.appendChild(r); });
          total += rows.length;
          var ordered = Array.prototype.filter.call(tb.rows, function (r) { return r.hasAttribute('data-row'); });
          var visible = 0;
          ordered.forEach(function (r) {
            var ok = (!q || val(r, 'name').indexOf(q) !== -1) &&
              (filter === 'all' || (' ' + val(r, 'tags') + ' ').indexOf(' ' + filter + ' ') !== -1);
            if (ok) matched++;
            var paged = ok && (!pageSize || showAll || shown < pageSize);
            if (paged) { shown++; visible++; }
            r.hidden = !paged;
          });
          // A group heading shows only while a row under it does.
          var head = null, any = false;
          Array.prototype.forEach.call(tb.rows, function (r) {
            if (r.classList.contains('group-row') || r.classList.contains('sub-row')) {
              if (head) head.hidden = !any;
              head = r; any = false;
            } else if (r.hasAttribute('data-row') && !r.hidden) any = true;
          });
          if (head) head.hidden = !any;
          var empty = tb.querySelector('.list-empty');
          if (!visible) {
            if (!empty) {
              empty = document.createElement('tr');
              empty.className = 'list-empty';
              var td = document.createElement('td');
              td.colSpan = table.querySelectorAll('col').length || (table.tHead ? table.tHead.rows[0].cells.length : 1);
              td.textContent = tb.getAttribute('data-empty') || 'Nothing matches.';
              empty.appendChild(td);
              tb.appendChild(empty);
            }
            empty.hidden = false;
          } else if (empty) empty.hidden = true;
        });
        if (countEl) countEl.textContent = matched === total ? total + ' ' + noun : matched + ' of ' + total + ' ' + noun;
        if (foot) {
          var more = pageSize && matched > pageSize;
          foot.hidden = !more;
          if (more) {
            foot.querySelector('.range').textContent = showAll ? 'Showing all ' + matched : 'Showing ' + Math.min(pageSize, matched) + ' of ' + matched;
            foot.querySelector('button').textContent = showAll ? 'Show fewer' : 'Show all ' + matched;
          }
        }
      }
      if (search) search.addEventListener('input', function () { showAll = false; apply(); });
      if (sort) sort.addEventListener('change', apply);
      bar.querySelectorAll('[data-filter]').forEach(function (b) {
        b.addEventListener('click', function () {
          filter = b.getAttribute('data-filter');
          bar.querySelectorAll('[data-filter]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
          showAll = false;
          apply();
        });
      });
      if (foot) foot.querySelector('button').addEventListener('click', function () { showAll = !showAll; apply(); });
      apply();
    });

    // Level over time: the level shown at each date follows the written order
    // (latest diagnostic, else latest accepted AI judgement, else latest
    // self-report), drawn as a step line; every history entry is a marker.
    var NS = 'http://www.w3.org/2000/svg';
    var LEVEL_NAMES = ['Aware', 'Beginner', 'Working', 'Proficient', 'Expert'];
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var SOURCE_NAMES = { self: 'Self-reported', ai: 'AI judgement', demo: 'Demonstrated', corr: 'AI correlated · after diagnostic' };
    function svgEl(tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function day(d) { return new Date(d + 'T00:00:00Z').getTime(); }
    function fmtDate(d) { var t = new Date(d + 'T00:00:00Z'); return t.getUTCDate() + ' ' + MONTHS[t.getUTCMonth()] + ' ' + t.getUTCFullYear(); }
    function shownSteps(entries, now) {
      var tested = null, judged = null, claimed = null, steps = [];
      entries.forEach(function (e) {
        if (e.source === 'demo' || e.source === 'corr') tested = e;
        else if (e.source === 'ai') judged = e;
        else claimed = e;
        var pick = tested || judged || claimed;
        var last = steps[steps.length - 1];
        var step = { from: e.date, level: pick.level, tested: pick === tested };
        if (last && last.from === e.date) steps[steps.length - 1] = step;
        else if (!last || last.level !== step.level || last.tested !== step.tested) steps.push(step);
      });
      steps.forEach(function (s, i) { s.to = steps[i + 1] ? steps[i + 1].from : now; });
      return steps;
    }
    function drawLevelChart(el) {
      var d = JSON.parse(el.getAttribute('data-chart'));
      var W = el.clientWidth, H = 176, L = 78, R = 72, T = 10, B = 26;
      var t0 = day(d.from), t1 = day(d.to);
      // Entries before the window are not drawn; the line enters from its start edge and the history table keeps them.
      function x(date) { return L + (Math.max(day(date), t0) - t0) / (t1 - t0) * (W - L - R); }
      function y(level) { return T + (4 - level) * (H - T - B) / 4; }
      el.querySelectorAll('svg, .lchart-tip').forEach(function (n) { n.remove(); });
      var svg = svgEl('svg', { width: W, height: H, role: 'group', 'aria-label': el.getAttribute('aria-label') || 'Level over time' }, el);
      LEVEL_NAMES.forEach(function (name, i) {
        svgEl('line', { class: 'grid', x1: L, x2: W - R, y1: y(i), y2: y(i) }, svg);
        svgEl('text', { class: 'axis-label', x: L - 10, y: y(i) + 4, 'text-anchor': 'end' }, svg).textContent = name;
      });
      var months = Math.round((t1 - t0) / 2629800000), m = new Date(t0), k = 0;
      var step = months > 6 ? (W < 480 ? 3 : 2) : 1;
      while (m.getTime() <= t1) {
        if (k % step === 0) svgEl('text', { class: 'axis-label', x: x(m.toISOString().slice(0, 10)), y: H - 6, 'text-anchor': 'middle' }, svg)
          .textContent = MONTHS[m.getUTCMonth()];
        m.setUTCMonth(m.getUTCMonth() + 1); k++;
      }
      var steps = shownSteps(d.entries, d.now);
      steps.forEach(function (s, i) {
        var p = 'M' + x(s.from) + ',' + (i ? y(steps[i - 1].level) : y(s.level)) + 'V' + y(s.level) + 'H' + x(s.to);
        svgEl('path', { d: p, class: s.tested ? 'shown-tested' : 'shown-claim' }, svg);
      });
      var lastStep = steps[steps.length - 1];
      svgEl('text', { class: 'end-label', x: x(d.now) + 8, y: y(lastStep.level) + 4 }, svg).textContent = W < 480 ? 'now' : LEVEL_NAMES[lastStep.level] + ', now';
      var tip = document.createElement('div');
      tip.className = 'lchart-tip'; tip.hidden = true; el.appendChild(tip);
      d.entries.forEach(function (e) {
        if (day(e.date) < t0) return;  // before the window: the line enters from the edge
        var cx = x(e.date), cy = y(e.level), tested = e.source === 'demo' || e.source === 'corr';
        if (e.source === 'ai') svgEl('rect', { class: 'm-claim is-ai', x: cx - 4.5, y: cy - 4.5, width: 9, height: 9, transform: 'rotate(45 ' + cx + ' ' + cy + ')' }, svg);
        else svgEl('circle', { class: tested ? 'm-tested' : 'm-claim', cx: cx, cy: cy, r: 5 }, svg);
        if (e.source === 'corr') svgEl('circle', { class: 'm-corr-ring', cx: cx, cy: cy, r: 9 }, svg);
        var label = LEVEL_NAMES[e.level] + ', ' + SOURCE_NAMES[e.source] + ', ' + fmtDate(e.date) + (e.note ? ', ' + e.note : '');
        var hit = svgEl('circle', { class: 'hit', cx: cx, cy: cy, r: 12, tabindex: 0, 'aria-label': label }, svg);
        function show() {
          tip.textContent = '';
          var strong = document.createElement('strong'); strong.textContent = LEVEL_NAMES[e.level];
          tip.appendChild(strong);
          tip.appendChild(document.createTextNode(SOURCE_NAMES[e.source] + ' · ' + fmtDate(e.date) + (e.note ? ' · ' + e.note : '')));
          tip.style.left = cx + 'px'; tip.style.top = cy + 'px'; tip.hidden = false;
        }
        function hide() { tip.hidden = true; }
        hit.addEventListener('pointerenter', show); hit.addEventListener('focus', show);
        hit.addEventListener('pointerleave', hide); hit.addEventListener('blur', hide);
      });
    }
    document.querySelectorAll('[data-chart]').forEach(function (el) {
      drawLevelChart(el);
      if (window.ResizeObserver) {
        var w = el.clientWidth;
        new ResizeObserver(function () { if (el.clientWidth !== w) { w = el.clientWidth; drawLevelChart(el); } }).observe(el);
      }
    });

    // Finish sooner: asks the session to wrap up in fewer questions. It is a
    // request, not a promise, and the note under the progress says so.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pace]');
      if (!b) return;
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.querySelector('.label').textContent = on ? 'Finishing sooner' : 'Finish sooner';
      var note = document.getElementById(b.getAttribute('aria-controls'));
      if (note) note.hidden = !on;
    });

    // Lock now: the lock screen covers the app until the passphrase.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lock]');
      if (!b) return;
      var lock = document.getElementById('lock-screen');
      if (!lock) return;
      lock.hidden = false;
      var input = lock.querySelector('input');
      if (input) input.focus();
    });
    document.addEventListener('submit', function (e) {
      if (!e.target.closest('#lock-screen')) return;
      e.preventDefault();
      document.getElementById('lock-screen').hidden = true;
    });

    // Phone navigation.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nav-toggle]');
      if (!b) return;
      var app = b.closest('.app');
      var open = app.classList.toggle('nav-open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Level picker: announce the chosen step.
    document.addEventListener('change', function (e) {
      var r = e.target.closest('.lvl-picker input');
      if (!r) return;
      var out = r.closest('form, .specimen, .pair-side');
      var o = out && out.querySelector('[data-level-out]');
      if (o) o.textContent = r.getAttribute('data-name');
    });
  });
})();
