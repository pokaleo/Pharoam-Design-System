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

    // Review queue: accept or reject. The decision stays visible.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-decide]');
      if (!b) return;
      var item = b.closest('.queue-item');
      var how = b.getAttribute('data-decide');
      var tag = item.querySelector('.q-state');
      item.classList.remove('is-accepted', 'is-rejected');
      item.classList.add(how === 'accept' ? 'is-accepted' : 'is-rejected');
      tag.className = 'tag q-state ' + (how === 'accept' ? 'ai-accepted' : 'ai-rejected');
      tag.innerHTML = '<svg class="ic"><use href="#i-' + (how === 'accept' ? 'check' : 'x') + '"/></svg>' +
        (how === 'accept' ? 'Accepted by you' : 'Rejected by you');
      item.querySelector('.q-actions').innerHTML = '<button class="btn btn-quiet btn-sm" data-undo>Undo</button>';
      var live = document.getElementById('queue-live');
      if (live) live.textContent = how === 'accept' ? 'Accepted. It is saved as AI-inferred, not as evidence.' : 'Rejected. It stays in the history.';
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-undo]');
      if (!b) return;
      var item = b.closest('.queue-item');
      item.classList.remove('is-accepted', 'is-rejected');
      var tag = item.querySelector('.q-state');
      tag.className = 'tag q-state ai-proposed';
      tag.innerHTML = '<svg class="ic"><use href="#i-ai"/></svg>Proposed';
      item.querySelector('.q-actions').innerHTML =
        '<button class="btn btn-secondary btn-sm" data-decide="accept">Accept</button>' +
        '<button class="btn btn-quiet btn-sm">Correct</button>' +
        '<button class="btn btn-quiet btn-sm" data-decide="reject">Reject</button>';
    });

    // The AI's overall level can be dismissed, and brought back.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dismiss]');
      if (!b) return;
      var box = document.getElementById(b.getAttribute('data-dismiss'));
      var back = document.getElementById(b.getAttribute('data-dismiss') + '-back');
      if (box) box.hidden = true;
      if (back) { back.hidden = false; back.querySelector('button').focus(); }
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-restore]');
      if (!b) return;
      var box = document.getElementById(b.getAttribute('data-restore'));
      if (box) box.hidden = false;
      b.closest('[id$="-back"]').hidden = true;
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
