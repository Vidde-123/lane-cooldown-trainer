/* Pre-Game Scout */
(function () {
  'use strict';
  var L = window.LCT, esc = L.esc, Store = L.Store, DD = L.DD, CD = L.Cooldowns;
  var TABS = [['MIDDLE', 'Mid'], ['TOP', 'Top'], ['JUNGLE', 'Jungle'], ['DUO', 'Bot Duo']];
  var TAGS = { danger: 'Danger spell', punish: 'Punish window', escape: 'Escape', pressure: 'Trade pressure' };
  var S = Object.assign({ role: 'MIDDLE', level: 6, ah: 0, sel: {}, active: 'BOTTOM' }, Store.get('scout', {}));
  if (!S.sel) S.sel = {};
  var root = null, token = 0, kitCache = {};

  function save() { Store.set('scout', S); }
  function kit(id) {
    if (!kitCache[id]) kitCache[id] = L.Kit.get(id).catch(function (e) { delete kitCache[id]; throw e; });
    return kitCache[id];
  }
  function bracket() { return L.settings.get().bracket; }
  function stripRole() { return S.role === 'DUO' ? S.active : S.role; }
  function stripIds() { return L.Mastery.pool(stripRole(), bracket()).slice(0, 12); }
  function selectedFor(r) { return S.sel[r] || null; }
  function activeRoleLabel() {
    if (S.role === 'DUO') return S.active === 'BOTTOM' ? 'Enemy ADC' : 'Enemy Support';
    return 'Enemy ' + L.roleLabel(S.role);
  }

  var Scout = (L.Scout = {
    mount: function (el) { root = el; render(); return function () { root = null; token++; }; },
    isDuo: function () { return S.role === 'DUO'; },
    pick: function (id) {
      if (S.role === 'DUO') { S.sel[S.active] = id; if (S.active === 'BOTTOM') S.active = 'UTILITY'; }
      else S.sel[S.role] = id;
      save(); if (root) render();
    },
    toggleActive: function () { if (S.role !== 'DUO') return; S.active = S.active === 'BOTTOM' ? 'UTILITY' : 'BOTTOM'; save(); if (root) render(); },
    paletteTarget: function () { return activeRoleLabel(); },
    paletteBoost: function () { return L.Mastery.pool(stripRole(), bracket()); },
    state: function () { return S; }
  });

  function portrait(id, cls) { return '<img class="portrait ' + (cls || '') + '" src="' + DD.champImg(id) + '" alt="" loading="lazy" width="48" height="48">'; }

  function render() {
    if (!root) return;
    var ids = stripIds(), cur = selectedFor(stripRole());
    var h = '';
    h += '<div class="stack">';
    h += '<div class="row wrap-r"><h1>Scout</h1><span class="sub">Enemy laner cooldowns at a glance</span><span class="spacer"></span><span class="sub hide-touch">Just start typing to search</span></div>';
    h += '<div class="seg" role="tablist" id="roletabs">' + TABS.map(function (t) {
      return '<button role="tab" data-role="' + t[0] + '" class="' + (S.role === t[0] ? 'on' : '') + '">' + t[1] + '</button>';
    }).join('') + '</div>';
    if (S.role === 'DUO') {
      h += '<div class="duo-tabs"><div class="seg" id="duotabs"><button data-active="BOTTOM" class="' + (S.active === 'BOTTOM' ? 'on' : '') + '">Enemy ADC</button><button data-active="UTILITY" class="' + (S.active === 'UTILITY' ? 'on' : '') + '">Enemy Support</button></div></div>';
      h += '<div class="row wrap-r" style="gap:6px"><span class="sub">Popular duos:</span>' + (window.LCT_META.botDuos || []).map(function (d, i) {
        return '<button class="chip" data-duo="' + i + '">' + esc((DD.byId[d[0]] || {}).name || d[0]) + ' + ' + esc((DD.byId[d[1]] || {}).name || d[1]) + '</button>';
      }).join('') + '</div>';
    }
    h += '<div><div class="sub" style="margin-bottom:2px">Top ' + esc(L.roleLabel(stripRole())) + ' picks (' + esc(bracketLabel()) + ')</div><div class="strip" id="strip">' + ids.map(function (id) {
      var c = DD.byId[id]; if (!c) return '';
      return '<button data-id="' + id + '" class="' + (cur === id ? 'on' : '') + '" title="' + esc(c.name) + '">' + portrait(id) + '<span>' + esc(c.name) + '</span></button>';
    }).join('') + '</div></div>';
    h += '<div class="card tight"><div class="tools">' +
      '<div class="slider"><label class="lvl" for="lvl">Lv <span id="lvlv">' + S.level + '</span></label><input id="lvl" type="range" min="1" max="18" value="' + S.level + '" aria-label="Champion level"></div>' +
      '<div class="row wrap-r" style="gap:6px"><span class="sub">Level:</span>' + [3, 6, 9, 11, 13, 16].map(function (n) { return '<button class="chip" data-lv="' + n + '">' + n + '</button>'; }).join('') + '</div>' +
      '<div class="row" style="gap:8px"><span class="sub">Ability haste</span><div class="seg" id="ahseg">' + [0, 15, 30].map(function (a) {
        return '<button data-ah="' + a + '" class="' + (S.ah === a ? 'on' : '') + '">' + (a === 0 ? 'Base' : '+' + a) + '</button>';
      }).join('') + '</div></div></div></div>';
    h += '<div id="panels"></div></div>';
    root.innerHTML = h;
    bind();
    renderPanels();
  }

  function bracketLabel() {
    var b = (window.LCT_META.brackets || []).filter(function (x) { return x.id === bracket(); })[0];
    return b ? b.label : 'All ranks';
  }

  function bind() {
    root.querySelector('#roletabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-role]'); if (!b) return;
      S.role = b.dataset.role; save(); render();
    });
    var dt = root.querySelector('#duotabs');
    if (dt) dt.addEventListener('click', function (e) {
      var b = e.target.closest('[data-active]'); if (!b) return;
      S.active = b.dataset.active; save(); render();
    });
    root.querySelectorAll('[data-duo]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = window.LCT_META.botDuos[+b.dataset.duo];
        S.sel.BOTTOM = d[0]; S.sel.UTILITY = d[1]; save(); render();
      });
    });
    root.querySelector('#strip').addEventListener('click', function (e) {
      var b = e.target.closest('[data-id]'); if (!b) return;
      Scout.pick(b.dataset.id);
    });
    var lvl = root.querySelector('#lvl');
    lvl.addEventListener('input', function () {
      S.level = +lvl.value; root.querySelector('#lvlv').textContent = S.level; save(); renderPanels();
    });
    root.querySelectorAll('[data-lv]').forEach(function (b) {
      b.addEventListener('click', function () {
        S.level = +b.dataset.lv; lvl.value = S.level; root.querySelector('#lvlv').textContent = S.level; save(); renderPanels();
      });
    });
    root.querySelector('#ahseg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ah]'); if (!b) return;
      S.ah = +b.dataset.ah; save();
      root.querySelectorAll('#ahseg button').forEach(function (x) { x.classList.toggle('on', +x.dataset.ah === S.ah); });
      renderPanels();
    });
  }

  function renderPanels() {
    var el = root && root.querySelector('#panels'); if (!el) return;
    var my = ++token;
    if (S.role !== 'DUO') {
      var id = selectedFor(S.role);
      if (!id) { el.innerHTML = placeholder('Pick the enemy ' + L.roleLabel(S.role) + ' laner'); return; }
      el.innerHTML = '<div class="skeleton"></div>';
      kit(id).then(function (k) { if (my === token && root) el.innerHTML = champPanel(k); })
        .catch(function (e) { if (my === token && root) el.innerHTML = '<div class="card err">Could not load ' + esc(id) + ': ' + esc(e.message) + '</div>'; });
      return;
    }
    el.innerHTML = '<div class="duo" id="duo"></div>';
    var duo = el.querySelector('#duo');
    ['BOTTOM', 'UTILITY'].forEach(function (r) {
      var col = document.createElement('div');
      col.className = 'duo-col ' + (S.active === r ? 'active-col' : 'inactive');
      col.dataset.slot = r;
      var title = '<div class="slot-title"><span class="chip">' + (r === 'BOTTOM' ? 'Enemy ADC' : 'Enemy Support') + '</span></div>';
      var id = selectedFor(r);
      col.innerHTML = title + (id ? '<div class="skeleton"></div>' : placeholder('Pick the enemy ' + (r === 'BOTTOM' ? 'ADC' : 'Support')));
      duo.appendChild(col);
      if (id) kit(id).then(function (k) { if (my === token) col.innerHTML = title + champPanel(k); })
        .catch(function (e) { if (my === token) col.innerHTML = title + '<div class="card err">Could not load ' + esc(id) + ': ' + esc(e.message) + '</div>'; });
    });
  }

  function placeholder(msg) {
    return '<div class="placeholder"><div style="font-size:15px;color:var(--text);margin-bottom:4px">' + esc(msg) + '</div>Tap a portrait above, or just start typing a champion name.</div>';
  }

  function heroCard(k, key, ranks) {
    var sp = k.spells.filter(function (s) { return s.slot === key.slot; })[0];
    if (!sp) return '';
    var r = ranks[key.slot], shown = Math.max(1, r);
    var now = CD.at(sp.cd, shown, S.ah);
    var r1 = CD.at(sp.cd, 1, S.ah), rmax = CD.at(sp.cd, sp.cd.length, S.ah);
    var learned = r > 0;
    var flag = !learned ? '<span class="chip">Not skilled until Lv ' + CD.firstLevel(key.slot, k.order) + '</span>' : '<span class="chip">Rank ' + r + '</span>';
    return '<article class="hero ' + (key.tag === 'danger' ? 'danger' : key.tag === 'punish' ? 'punish' : '') + '" data-key="' + key.slot + '">' +
      '<div class="hero-top"><div class="spell"><img src="' + DD.spellImg(sp.icon) + '" alt="" width="52" height="52" loading="lazy"><b>' + key.slot + '</b></div>' +
      '<div style="min-width:0"><div class="row wrap-r" style="gap:6px"><span class="chip ' + key.tag + '">' + (TAGS[key.tag] || key.tag) + '</span>' + flag + '</div>' +
      '<div style="font-weight:600;margin-top:4px;overflow:hidden;text-overflow:ellipsis">' + esc(sp.name) + '</div></div></div>' +
      '<div><div class="cd-big" data-cd="' + key.slot + '">' + CD.fmt(now) + '<small>' + (S.ah ? '+' + S.ah + ' AH' : 'base') + '</small></div>' +
      '<div class="sub" style="margin-top:4px">Rank 1: ' + CD.fmt(r1) + ' \u00B7 Max: ' + CD.fmt(rmax) + '</div></div>' +
      '<p class="tip">' + esc(key.tip) + '</p></article>';
  }

  function champPanel(k) {
    var ranks = CD.ranksAtLevel(S.level, k.order);
    var o = k.order.split('').join(' <i>\u203A</i> ');
    var h = '<section class="stack" data-champ="' + k.id + '"><div class="champ-head">' + portrait(k.id) +
      '<div><h2>' + esc(k.name) + '</h2><div class="row wrap-r" style="gap:8px"><span class="order">' + o + '</span>' +
      (k.curated ? '' : '<span class="chip punish">Unverified max order</span>') +
      '</div></div></div>';
    if (k.notes) h += '<div class="sub">' + esc(k.notes) + '</div>';
    h += '<div class="heroes">' + k.keys.map(function (key) { return heroCard(k, key, ranks); }).join('') + '</div>';
    h += '<div class="tablewrap"><table class="kit"><thead><tr><th style="text-align:left;padding-left:10px">Ability</th>' +
      [1, 2, 3, 4, 5].map(function (n) { return '<th>R' + n + '</th>'; }).join('') + '</tr></thead><tbody>';
    k.spells.forEach(function (sp) {
      var cur = ranks[sp.slot];
      h += '<tr data-slot="' + sp.slot + '"><td class="n"><img src="' + DD.spellImg(sp.icon) + '" alt="" loading="lazy" width="30" height="30"><b>' + sp.slot + '</b> <span class="sub">' + esc(sp.name) + '</span></td>';
      for (var n = 1; n <= 5; n++) {
        if (n > sp.cd.length && sp.slot === 'R' && n > 3) { h += '<td class="dim">\u2014</td>'; continue; }
        var v = sp.cd.length === 1 ? CD.at(sp.cd, 1, S.ah) : (n <= sp.cd.length ? CD.at(sp.cd, n, S.ah) : null);
        var isCur = cur > 0 && Math.min(cur, sp.cd.length) === n;
        h += '<td class="' + (isCur ? 'cur' : (cur < n ? 'dim' : '')) + '">' + (n <= sp.cd.length || sp.cd.length === 1 ? CD.fmt(v) : '\u2014') + '</td>';
      }
      h += '</tr>';
    });
    h += '</tbody></table></div></section>';
    return h;
  }
})();
