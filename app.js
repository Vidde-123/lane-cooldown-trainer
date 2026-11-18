/* App shell: router, nav, type-anywhere palette, settings */
(function () {
  'use strict';
  var L = window.LCT, esc = L.esc, DD = L.DD;
  var view, current = null, route = 'scout';

  var ICONS = {
    scout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
    train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M7 3h14v14"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>'
  };
  var NAV = [['scout', 'Scout'], ['train', 'Train'], ['progress', 'Progress'], ['settings', 'Settings']];

  function renderNav() {
    document.getElementById('topnav').innerHTML = NAV.map(function (n) { return '<a href="#/' + n[0] + '" data-n="' + n[0] + '">' + n[1] + '</a>'; }).join('');
    document.getElementById('tabbar').innerHTML = NAV.map(function (n) { return '<a href="#/' + n[0] + '" data-n="' + n[0] + '">' + ICONS[n[0]] + '<span>' + n[1] + '</span></a>'; }).join('');
  }
  function markNav() {
    document.querySelectorAll('[data-n]').forEach(function (a) { a.classList.toggle('on', a.dataset.n === route); });
    document.getElementById('fab').hidden = route !== 'scout';
  }

  function go() {
    var parts = (location.hash || '#/scout').replace(/^#\/?/, '').split('/');
    route = ['scout', 'train', 'progress', 'settings'].indexOf(parts[0]) >= 0 ? parts[0] : 'scout';
    if (current) { try { current(); } catch (e) {} current = null; }
    Palette.close();
    markNav();
    window.scrollTo(0, 0);
    try {
      if (route === 'scout') current = L.Scout.mount(view);
      else if (route === 'train') current = L.Trainer.mount(view, parts[1]);
      else if (route === 'progress') current = L.Trainer.progress(view);
      else current = settings();
    } catch (e) {
      view.innerHTML = '<div class="card err">Something went wrong: ' + esc(e.message) + '</div>';
      console.error(e);
    }
  }

  /* ---------------- Settings ---------------- */
  function settings() {
    var s = L.settings.get();
    view.innerHTML = '<div class="stack" style="max-width:560px"><h1>Settings</h1>' +
      '<div class="card stack"><div class="field"><label class="sub" for="s-br">Rank bracket (orders the matchup lists)</label><select id="s-br">' +
      window.LCT_META.brackets.map(function (b) { return '<option value="' + b.id + '"' + (s.bracket === b.id ? ' selected' : '') + '>' + b.label + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label class="sub" for="s-sv">Server (label only for now)</label><select id="s-sv">' +
      ['EUW', 'EUNE', 'NA', 'KR', 'OCE', 'BR', 'LAN', 'LAS', 'TR', 'RU', 'JP'].map(function (x) { return '<option' + (s.server === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<label class="row" style="gap:8px"><input type="checkbox" id="s-full"' + (s.full ? ' checked' : '') + '> Train the full kit (Q W E R) instead of key spells + R</label></div>' +
      '<div class="card stack"><h3>Data</h3><div class="sub">Champion data: Riot Data Dragon, patch <b>' + esc(DD.ver || '?') + '</b>' + (DD.offline ? ' (offline cache)' : '') + '.<br>Matchup order: ' + esc(window.LCT_META.patchLabel) + '</div>' +
      '<div class="row wrap-r"><button class="btn" id="s-reset-p">Reset progress</button><button class="btn" id="s-reset-all">Reset everything</button></div></div></div>';
    view.querySelector('#s-br').addEventListener('change', function (e) { L.settings.set({ bracket: e.target.value }); });
    view.querySelector('#s-sv').addEventListener('change', function (e) { L.settings.set({ server: e.target.value }); });
    view.querySelector('#s-full').addEventListener('change', function (e) { L.settings.set({ full: e.target.checked }); });
    view.querySelector('#s-reset-p').addEventListener('click', function () { if (confirm('Reset all flashcard, quiz and match progress?')) { L.SRS.reset(); L.Store.del('stats'); L.Store.del('train'); } });
    view.querySelector('#s-reset-all').addEventListener('click', function () { if (confirm('Reset all saved data on this device?')) { L.Store.clearPrefix(''); location.reload(); } });
    return null;
  }

  /* ---------------- Palette (type-anywhere) ---------------- */
  var P = { el: null, input: null, list: null, results: [], sel: 0, open: false };
  var Palette = {
    init: function () {
      P.el = document.getElementById('palette'); P.input = document.getElementById('palette-input'); P.list = document.getElementById('palette-list');
      P.input.addEventListener('input', Palette.update);
      P.input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); P.sel = Math.min(P.results.length - 1, P.sel + 1); Palette.draw(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); P.sel = Math.max(0, P.sel - 1); Palette.draw(); }
        else if (e.key === 'Enter') { e.preventDefault(); Palette.choose(P.sel); }
        else if (e.key === 'Escape') { e.preventDefault(); Palette.close(); }
        else if (e.key === 'Tab' && L.Scout.isDuo()) { e.preventDefault(); L.Scout.toggleActive(); Palette.head(); Palette.update(); }
      });
      P.list.addEventListener('mousedown', function (e) { var li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); Palette.choose(+li.dataset.i); } });
      P.list.addEventListener('touchend', function (e) { var li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); Palette.choose(+li.dataset.i); } });
      P.el.addEventListener('mousedown', function (e) { if (e.target === P.el) Palette.close(); });
      document.getElementById('fab').addEventListener('click', function () { Palette.show(''); });
    },
    head: function () {
      document.getElementById('palette-target').textContent = L.Scout.paletteTarget();
      document.getElementById('palette-hint').textContent = L.Scout.isDuo() ? 'Tab switches ADC / Support \u00B7 Enter selects' : 'Enter selects \u00B7 Esc closes';
    },
    show: function (q) {
      P.open = true; P.el.hidden = false; Palette.head(); P.input.value = q || ''; P.sel = 0; Palette.update(); P.input.focus();
    },
    close: function () { if (!P.el) return; P.open = false; P.el.hidden = true; if (P.input) P.input.blur(); },
    update: function () {
      P.results = L.Search.query(P.input.value, L.Scout.paletteBoost(), 8); P.sel = 0; Palette.draw();
    },
    draw: function () {
      P.list.innerHTML = P.results.length ? P.results.map(function (it, i) {
        var cur = L.Kit.def(it.id);
        return '<li data-i="' + i + '" class="' + (i === P.sel ? 'sel' : '') + '"><img src="' + DD.champImg(it.id) + '" alt="" width="36" height="36"><span class="nm">' + esc(it.name) + '</span><span class="tg">' + (cur ? esc(cur.roles.map(L.roleLabel).join(' / ')) : 'not curated') + '</span></li>';
      }).join('') : '<li style="cursor:default"><span class="hint">No champion matches</span></li>';
      var s = P.list.querySelector('li.sel'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
    },
    choose: function (i) {
      var it = P.results[i]; if (!it) return;
      Palette.close(); L.Scout.pick(it.id);
    }
  };

  function onKey(e) {
    if (route !== 'scout' || P.open) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.key === 'Tab' && L.Scout.isDuo()) { e.preventDefault(); L.Scout.toggleActive(); return; }
    // Let the typed letter land natively in the freshly focused input (no duplicate first key).
    if (e.key.length === 1 && /[a-z]/i.test(e.key)) { Palette.show(''); }
    else if (e.key === '/') { e.preventDefault(); Palette.show(''); }
  }

  /* ---------------- Boot ---------------- */
  async function boot() {
    view = document.getElementById('view');
    renderNav();
    view.innerHTML = '<div class="stack"><div class="skeleton" style="min-height:60px"></div><div class="skeleton"></div></div>';
    var status = document.getElementById('status');
    try {
      await DD.init();
      status.textContent = 'Patch ' + DD.ver + (DD.offline ? ' (offline)' : '');
      status.classList.toggle('off', !!DD.offline);
      // sanity: warn (not error) about curated ids Riot doesn't know
      Object.keys(window.LCT_CHAMPS).forEach(function (id) { if (!DD.byId[id]) console.warn('Curated champion id not in Data Dragon: ' + id); });
    } catch (e) {
      status.textContent = 'Offline'; status.classList.add('off');
      view.innerHTML = '<div class="card err"><h2>Can\u2019t load champion data</h2><p style="margin:8px 0 14px">' + esc(e.message) + '</p><button class="btn primary" id="retry">Retry</button></div>';
      document.getElementById('retry').addEventListener('click', function () { location.reload(); });
      return;
    }
    Palette.init();
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', go);
    go();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
