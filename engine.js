/* Lane Cooldown Trainer: engine (Data Dragon, cooldown math, search, SRS, mastery) */
(function () {
  'use strict';
  var LCT = (window.LCT = window.LCT || {});
  var PFX = 'lct:';
  var DDRAGON = 'https://ddragon.leagueoflegends.com';

  LCT.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  LCT.ROLES = [
    { id: 'MIDDLE', label: 'Mid' },
    { id: 'TOP', label: 'Top' },
    { id: 'JUNGLE', label: 'Jungle' },
    { id: 'BOTTOM', label: 'ADC' },
    { id: 'UTILITY', label: 'Support' }
  ];
  LCT.roleLabel = function (id) {
    var r = LCT.ROLES.filter(function (x) { return x.id === id; })[0];
    return r ? r.label : id;
  };

  /* ---------------- Store ---------------- */
  LCT.Store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(PFX + k, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
    del: function (k) { try { localStorage.removeItem(PFX + k); } catch (e) {} },
    clearPrefix: function (p) {
      try {
        var del = [];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.indexOf(PFX + p) === 0) del.push(key);
        }
        del.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
    }
  };

  var DEFAULT_SETTINGS = { bracket: 'all', server: 'EUW', full: false };
  LCT.settings = {
    get: function () { return Object.assign({}, DEFAULT_SETTINGS, LCT.Store.get('settings', {})); },
    set: function (patch) { LCT.Store.set('settings', Object.assign(LCT.settings.get(), patch)); }
  };

  /* ---------------- Data Dragon ---------------- */
  var DD = (LCT.DD = { ver: null, list: [], byId: {}, offline: false, _c: {} });

  DD.init = async function () {
    var ver = null;
    try {
      var r = await fetch(DDRAGON + '/api/versions.json');
      if (!r.ok) throw new Error('versions ' + r.status);
      ver = (await r.json())[0];
    } catch (e) {
      ver = LCT.Store.get('ver', null);
      DD.offline = true;
    }
    if (!ver) throw new Error('Could not reach Riot Data Dragon and nothing is cached yet. Check your connection and retry.');
    var old = LCT.Store.get('ver', null);
    if (old && old !== ver) { LCT.Store.clearPrefix('c:'); LCT.Store.clearPrefix('list:'); }
    DD.ver = ver;
    LCT.Store.set('ver', ver);
    var list = LCT.Store.get('list:' + ver, null);
    if (!list) {
      var r2 = await fetch(DDRAGON + '/cdn/' + ver + '/data/en_US/champion.json');
      if (!r2.ok) throw new Error('champion list ' + r2.status);
      var j = await r2.json();
      list = Object.keys(j.data).map(function (k) { return { id: j.data[k].id, name: j.data[k].name, tags: j.data[k].tags }; });
      LCT.Store.set('list:' + ver, list);
    }
    DD.list = list;
    DD.byId = {};
    list.forEach(function (c) { DD.byId[c.id] = c; });
    return ver;
  };

  DD.champImg = function (id) { return DDRAGON + '/cdn/' + DD.ver + '/img/champion/' + id + '.png'; };
  DD.spellImg = function (file) { return DDRAGON + '/cdn/' + DD.ver + '/img/spell/' + file; };
  DD.passiveImg = function (file) { return DDRAGON + '/cdn/' + DD.ver + '/img/passive/' + file; };

  DD.champ = function (id) {
    if (DD._c[id]) return DD._c[id];
    var key = 'c:' + DD.ver + ':' + id;
    var cached = LCT.Store.get(key, null);
    if (cached) { DD._c[id] = Promise.resolve(cached); return DD._c[id]; }
    DD._c[id] = fetch(DDRAGON + '/cdn/' + DD.ver + '/data/en_US/champion/' + id + '.json')
      .then(function (r) { if (!r.ok) throw new Error(id + ' ' + r.status); return r.json(); })
      .then(function (j) {
        var c = j.data[id];
        var out = {
          id: c.id, name: c.name, title: c.title,
          passive: { name: c.passive.name, icon: c.passive.image.full },
          spells: c.spells.map(function (s, i) {
            return { slot: 'QWER'.charAt(i), name: s.name, icon: s.image.full, cd: s.cooldown };
          })
        };
        LCT.Store.set(key, out);
        return out;
      })
      .catch(function (e) { delete DD._c[id]; throw e; });
    return DD._c[id];
  };

  /* ---------------- Kit (Data Dragon + curated layer) ---------------- */
  LCT.Kit = {
    def: function (id) { return (window.LCT_CHAMPS || {})[id] || null; },
    get: async function (id) {
      var d = await DD.champ(id);
      var cur = LCT.Kit.def(id);
      var spells = d.spells.map(function (s) {
        var ov = cur && cur.overrides && cur.overrides[s.slot];
        return { slot: s.slot, name: s.name, icon: s.icon, cd: ov || s.cd };
      });
      var keys;
      if (cur) {
        keys = cur.keys.map(function (k) { return { slot: k.slot, tag: k.tag, tip: k.tip, curated: true }; });
      } else {
        var basics = spells.slice(0, 3).filter(function (s) { return s.cd && s.cd[0] > 0; })
          .sort(function (a, b) { return a.cd[0] - b.cd[0]; });
        keys = [{ slot: 'R', tag: 'danger', tip: 'Not curated yet. This is the ultimate.', curated: false }];
        if (basics[0]) keys.push({ slot: basics[0].slot, tag: 'pressure', tip: 'Not curated yet. Auto-picked as the shortest-cooldown basic ability.', curated: false });
      }
      return { id: id, name: d.name, order: cur ? cur.maxOrder : 'QWE', curated: !!cur, spells: spells, keys: keys, notes: cur ? cur.notes : '', passive: d.passive };
    }
  };

  /* ---------------- Cooldown math ---------------- */
  var SEQ = ['P', 'S', 'T', 'P', 'P', 'R', 'P', 'S', 'P', 'S', 'R', 'S', 'S', 'T', 'T', 'R', 'T', 'T'];
  LCT.Cooldowns = {
    SEQ: SEQ,
    ranksAtLevel: function (level, order) {
      var map = { P: order.charAt(0), S: order.charAt(1), T: order.charAt(2), R: 'R' };
      var r = { Q: 0, W: 0, E: 0, R: 0 };
      for (var i = 0; i < Math.min(18, Math.max(0, level)); i++) r[map[SEQ[i]]]++;
      return r;
    },
    effective: function (base, ah) { return base * 100 / (100 + ah); },
    at: function (cdArr, rank, ah) {
      if (!cdArr || !cdArr.length) return null;
      var idx = Math.min(Math.max(rank, 1), cdArr.length) - 1;
      var b = cdArr[idx];
      if (!b) return null;
      return LCT.Cooldowns.effective(b, ah || 0);
    },
    fmt: function (v) {
      if (v == null) return '\u2014';
      return (Math.round(v * 10) / 10).toString() + 's';
    },
    firstLevel: function (slot, order) {
      var map = { P: order.charAt(0), S: order.charAt(1), T: order.charAt(2), R: 'R' };
      for (var i = 0; i < 18; i++) if (map[SEQ[i]] === slot) return i + 1;
      return 1;
    }
  };

  /* ---------------- Search ---------------- */
  var ALIASES = {
    tf: 'TwistedFate', mf: 'MissFortune', lb: 'Leblanc', j4: 'JarvanIV', asol: 'AurelionSol', kass: 'Kassadin',
    ww: 'Warwick', mundo: 'DrMundo', tk: 'TahmKench', cass: 'Cassiopeia', malz: 'Malzahar', morg: 'Morgana',
    kha: 'Khazix', heca: 'Hecarim', blitz: 'Blitzcrank', naut: 'Nautilus', kata: 'Katarina', yas: 'Yasuo',
    ez: 'Ezreal', cait: 'Caitlyn', sej: 'Sejuani', gp: 'Gangplank', trynd: 'Tryndamere', voli: 'Volibear',
    wukong: 'MonkeyKing', ksante: 'KSante', 'k6': 'Khazix', rengar: 'Rengar', lee: 'LeeSin', xin: 'XinZhao',
    kog: 'KogMaw', reksai: 'RekSai', nunu: 'Nunu', velkoz: 'Velkoz', chogath: 'Chogath', belveth: 'Belveth'
  };
  var Search = (LCT.Search = {
    norm: function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); },
    aliasesFor: function (id) {
      var out = [];
      for (var a in ALIASES) if (ALIASES[a] === id) out.push(a);
      var cur = LCT.Kit.def(id);
      if (cur) out = out.concat(cur.aliases || []);
      return out;
    },
    score: function (q, item) {
      var n = Search.norm(item.name), id = Search.norm(item.id), best = 0, i;
      if (!q) return 1;
      for (i = 0; i < item.aliases.length; i++) if (item.aliases[i] === q) best = Math.max(best, 100);
      if (n === q || id === q) best = Math.max(best, 95);
      if (n.indexOf(q) === 0 || id.indexOf(q) === 0) best = Math.max(best, 80);
      for (i = 0; i < item.aliases.length; i++) if (item.aliases[i].indexOf(q) === 0) best = Math.max(best, 70);
      // word-start initials: "as" -> Aurelion Sol
      var words = item.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      if (words.length > 1) {
        var ini = words.map(function (w) { return w.charAt(0); }).join('');
        if (ini.indexOf(q) === 0) best = Math.max(best, 60);
        if (words.some(function (w) { return w.indexOf(q) === 0; })) best = Math.max(best, 65);
      }
      if (n.indexOf(q) > 0) best = Math.max(best, 40);
      if (!best) { // subsequence
        var p = 0;
        for (i = 0; i < n.length && p < q.length; i++) if (n.charAt(i) === q.charAt(p)) p++;
        if (p === q.length) best = 20;
      }
      return best;
    },
    items: function () {
      return DD.list.map(function (c) { return { id: c.id, name: c.name, aliases: Search.aliasesFor(c.id) }; });
    },
    query: function (raw, boostIds, limit) {
      var q = Search.norm(raw || '');
      var boost = boostIds || [];
      var scored = [];
      Search.items().forEach(function (it) {
        var s = Search.score(q, it);
        if (s > 0) {
          var bi = boost.indexOf(it.id);
          scored.push({ item: it, s: s, b: bi < 0 ? 999 : bi });
        }
      });
      scored.sort(function (a, b) { return b.s - a.s || a.b - b.b || a.item.name.localeCompare(b.item.name); });
      return scored.slice(0, limit || 8).map(function (x) { return x.item; });
    }
  });

  /* ---------------- Spaced repetition (Leitner, 5 boxes) ---------------- */
  var DAY = 86400000;
  var INTERVAL_DAYS = [0, 0, 1, 3, 7, 14];
  var SRS = (LCT.SRS = {
    all: function () { return LCT.Store.get('srs', {}); },
    get: function (id) { var s = SRS.all()[id]; return s || { box: 0, due: 0, seen: 0, miss: 0 }; },
    nextBox: function (box, rating) {
      if (rating === 'again') return 1;
      if (rating === 'good') return Math.min(5, Math.max(box, 1) + 1);
      return Math.min(5, Math.max(box, 1) + 2);
    },
    rate: function (id, rating, now) {
      var all = SRS.all();
      var c = all[id] || { box: 0, due: 0, seen: 0, miss: 0 };
      c.box = SRS.nextBox(c.box, rating);
      c.seen++;
      if (rating === 'again') c.miss++;
      c.due = (now || Date.now()) + INTERVAL_DAYS[c.box] * DAY;
      all[id] = c;
      LCT.Store.set('srs', all);
      return c;
    },
    mastered: function (id) { return SRS.get(id).box >= 3; },
    queue: function (ids, n, now) {
      var t = now || Date.now();
      var all = SRS.all();
      var arr = ids.map(function (id) {
        var c = all[id] || { box: 0, due: 0 };
        return { id: id, due: c.due <= t, box: c.box, r: Math.random() };
      });
      arr.sort(function (a, b) {
        if (a.due !== b.due) return a.due ? -1 : 1;
        return a.box - b.box || a.r - b.r;
      });
      return arr.slice(0, n || arr.length).map(function (x) { return x.id; });
    },
    reset: function () { LCT.Store.del('srs'); }
  });

  /* ---------------- Mastery tiers ---------------- */
  var Mastery = (LCT.Mastery = {
    TIER: 5,
    THRESHOLD: 0.8,
    pool: function (role, bracket) {
      var m = (window.LCT_META || {})[role] || {};
      return (m[bracket] || m.all || []).slice();
    },
    tiers: function (role, bracket) {
      var p = Mastery.pool(role, bracket), out = [];
      for (var i = 0; i < p.length; i += Mastery.TIER) out.push(p.slice(i, i + Mastery.TIER));
      return out;
    },
    slots: function (champId, full) {
      var cur = LCT.Kit.def(champId);
      var s = [];
      if (full) s = ['Q', 'W', 'E', 'R'];
      else {
        if (cur) cur.keys.forEach(function (k) { if (s.indexOf(k.slot) < 0) s.push(k.slot); });
        if (s.indexOf('R') < 0) s.push('R');
        s.sort(function (a, b) { return 'QWER'.indexOf(a) - 'QWER'.indexOf(b); });
      }
      return s;
    },
    cardIds: function (champId, full) {
      return Mastery.slots(champId, full).map(function (s) { return champId + ':' + s; });
    },
    tierStats: function (tierIds, full) {
      var ids = [];
      tierIds.forEach(function (c) { ids = ids.concat(Mastery.cardIds(c, full)); });
      var done = ids.filter(function (id) { return SRS.mastered(id); }).length;
      return { total: ids.length, mastered: done, pct: ids.length ? done / ids.length : 0 };
    },
    unlockedCount: function (role, bracket, full) {
      var t = Mastery.tiers(role, bracket);
      if (!t.length) return 0;
      var u = 1;
      while (u < t.length && Mastery.tierStats(t[u - 1], full).pct >= Mastery.THRESHOLD) u++;
      return u;
    }
  });
})();
