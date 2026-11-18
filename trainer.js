/* Trainer: tiers, Flashcards, Memory Match, Rapid Quiz, Progress */
(function () {
  'use strict';
  var L = window.LCT, esc = L.esc, Store = L.Store, DD = L.DD, CD = L.Cooldowns, SRS = L.SRS, M = L.Mastery;
  var TAGS = { danger: 'Danger spell', punish: 'Punish window', escape: 'Escape', pressure: 'Trade pressure' };
  var T = Object.assign({ role: 'MIDDLE', scope: 'all' }, Store.get('train', {}));
  var root = null, cleanup = null;

  function saveT() { Store.set('train', T); }
  function st() { return L.settings.get(); }
  function tiers() { return M.tiers(T.role, st().bracket); }
  function unlocked() { return M.unlockedCount(T.role, st().bracket, st().full); }
  function scopeChamps() {
    var t = tiers(), u = unlocked();
    if (T.scope !== 'all') { var i = +T.scope; if (i < u && t[i]) return t[i]; }
    var out = []; t.slice(0, u).forEach(function (x) { out = out.concat(x); }); return out;
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function img(id, cls) { return '<img class="portrait ' + (cls || '') + '" src="' + DD.champImg(id) + '" alt="" loading="lazy" width="48" height="48">'; }

  // Build card objects for a champion list
  async function loadCards(champs) {
    var full = st().full, cards = [];
    var kits = await Promise.all(champs.map(function (id) { return L.Kit.get(id); }));
    kits.forEach(function (k) {
      M.slots(k.id, full).forEach(function (slot) {
        var sp = k.spells.filter(function (s) { return s.slot === slot; })[0];
        if (!sp) return;
        var key = k.keys.filter(function (x) { return x.slot === slot; })[0];
        cards.push({ id: k.id + ':' + slot, champ: k.id, cname: k.name, slot: slot, spell: sp, tip: key ? key.tip : '', tag: key ? key.tag : '', order: k.order });
      });
    });
    return cards;
  }

  function loading(msg) { root.innerHTML = '<div class="session"><div class="skeleton"></div><div class="sub" style="text-align:center">' + esc(msg || 'Loading champion data\u2026') + '</div></div>'; }
  function fail(e) { root.innerHTML = '<div class="card err">Could not load data: ' + esc(e.message) + '<div style="margin-top:10px"><a class="btn" href="#/train">Back</a></div></div>'; }

  var Trainer = (L.Trainer = {
    mount: function (el, sub) {
      root = el; cleanup = null;
      if (sub === 'flash') flash(); else if (sub === 'match') match(); else if (sub === 'quiz') quiz(); else home();
      return function () { if (cleanup) cleanup(); cleanup = null; root = null; };
    },
    progress: function (el) { root = el; progress(); return function () { root = null; }; }
  });

  /* ---------------- Home ---------------- */
  function home() {
    var s = st(), t = tiers(), u = unlocked(), h = '<div class="stack">';
    h += '<div class="row wrap-r"><h1>Train</h1><span class="sub">Most common matchups first</span></div>';
    h += '<div class="seg" id="roles">' + L.ROLES.map(function (r) { return '<button data-r="' + r.id + '" class="' + (T.role === r.id ? 'on' : '') + '">' + r.label + '</button>'; }).join('') + '</div>';
    h += '<div class="row wrap-r"><span class="sub">Rank: </span><select id="bracket" aria-label="Rank bracket">' + window.LCT_META.brackets.map(function (b) { return '<option value="' + b.id + '"' + (s.bracket === b.id ? ' selected' : '') + '>' + b.label + '</option>'; }).join('') + '</select>' +
      '<span class="sub">Server: ' + esc(s.server) + '</span><span class="spacer"></span><label class="row sub" style="gap:6px"><input type="checkbox" id="full"' + (s.full ? ' checked' : '') + '> Full kit (Q W E R)</label></div>';
    h += '<div><h2 style="margin-bottom:8px">Matchup tiers</h2><div class="tiers" id="tiers">';
    t.forEach(function (ids, i) {
      var lock = i >= u, ss = M.tierStats(ids, s.full), pct = Math.round(ss.pct * 100);
      var on = (T.scope === 'all' && !lock) ? false : (T.scope == i);
      h += '<button class="tier ' + (lock ? 'locked' : '') + ' ' + (on ? 'sel' : '') + '" data-tier="' + i + '" ' + (lock ? 'aria-disabled="true"' : '') + '>' +
        '<div class="row"><b>Tier ' + (i + 1) + '</b><span class="sub">#' + (i * 5 + 1) + '\u2013' + (i * 5 + ids.length) + '</span><span class="spacer"></span>' +
        (lock ? '<span class="chip">Locked</span>' : pct >= 80 ? '<span class="chip escape">Mastered</span>' : '<span class="chip accent">' + pct + '%</span>') + '</div>' +
        '<div class="faces">' + ids.map(function (id) { return img(id); }).join('') + '</div>' +
        '<div class="bar ' + (pct >= 80 ? 'ok' : '') + '"><i style="width:' + pct + '%"></i></div>' +
        '<div class="sub">' + (lock ? 'Master 80% of Tier ' + i + ' to unlock' : ss.mastered + ' / ' + ss.total + ' cards mastered') + '</div></button>';
    });
    h += '</div></div>';
    h += '<div class="row wrap-r"><span class="sub">Practice scope:</span><div class="seg" id="scope"><button data-s="all" class="' + (T.scope === 'all' ? 'on' : '') + '">All unlocked</button></div>' +
      '<span class="sub">' + scopeChamps().length + ' champions \u00B7 ' + (function () { var n = 0; scopeChamps().forEach(function (c) { n += M.slots(c, s.full).length; }); return n; })() + ' cards</span></div>';
    h += '<div class="modes">' +
      '<a class="mode" href="#/train/flash" id="m-flash"><div class="ic">\u25A3</div><h3>Flashcards</h3><div class="sub">Spaced repetition. Flip, then rate Again / Good / Easy.</div></a>' +
      '<a class="mode" href="#/train/match" id="m-match"><div class="ic">\u25A6</div><h3>Memory Match</h3><div class="sub">Pair each ability with its cooldown.</div></a>' +
      '<a class="mode" href="#/train/quiz" id="m-quiz"><div class="ic">\u26A1</div><h3>Rapid Quiz</h3><div class="sub">Multiple choice or type the number.</div></a></div></div>';
    root.innerHTML = h;
    root.querySelector('#roles').addEventListener('click', function (e) { var b = e.target.closest('[data-r]'); if (!b) return; T.role = b.dataset.r; T.scope = 'all'; saveT(); home(); });
    root.querySelector('#bracket').addEventListener('change', function (e) { L.settings.set({ bracket: e.target.value }); T.scope = 'all'; saveT(); home(); });
    root.querySelector('#full').addEventListener('change', function (e) { L.settings.set({ full: e.target.checked }); home(); });
    root.querySelector('#tiers').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tier]'); if (!b) return;
      var i = +b.dataset.tier; if (i >= u) return;
      T.scope = T.scope == i ? 'all' : i; saveT(); home();
    });
    root.querySelector('#scope').addEventListener('click', function () { T.scope = 'all'; saveT(); home(); });
  }

  /* ---------------- Flashcards ---------------- */
  function flash() {
    loading();
    loadCards(scopeChamps()).then(function (cards) {
      var byId = {}; cards.forEach(function (c) { byId[c.id] = c; });
      var queue = SRS.queue(cards.map(function (c) { return c.id; }), 16), idx = 0, flipped = false, tally = { again: 0, good: 0, easy: 0 }, total = queue.length;
      function cur() { return byId[queue[idx]]; }
      function draw() {
        if (!root) return;
        if (idx >= queue.length) return summary();
        var c = cur(), pct = Math.round(idx / Math.max(total, 1) * 100);
        var h = '<div class="session"><div class="prog"><a href="#/train" class="btn sm">\u2190 Back</a><div class="bar"><i style="width:' + pct + '%"></i></div><span>' + Math.min(idx + 1, total) + '/' + total + '</span></div>';
        if (!flipped) {
          h += '<div class="fcard" id="fc" role="button" tabindex="0" aria-label="Reveal answer">' + img(c.champ) +
            '<img class="big-icon" src="' + DD.spellImg(c.spell.icon) + '" alt="">' +
            '<div class="q">' + esc(c.cname) + ' ' + c.slot + '</div><div class="sub">' + esc(c.spell.name) + '</div>' +
            '<div class="chip accent">Cooldown at rank 1?</div><div class="sub">Tap or press <kbd>Space</kbd> to reveal</div></div>';
        } else {
          var sp = c.spell, n = Math.min(sp.cd.length, 5), ranks = [];
          for (var i = 1; i <= n; i++) ranks.push('<div><small>R' + i + '</small>' + CD.fmt(sp.cd[i - 1]) + '</div>');
          h += '<div class="fcard back" id="fc">' + '<div class="row"><img class="portrait" src="' + DD.champImg(c.champ) + '" alt=""><img class="portrait" src="' + DD.spellImg(sp.icon) + '" alt=""></div>' +
            '<div class="q">' + esc(c.cname) + ' ' + c.slot + ' \u00B7 ' + esc(sp.name) + '</div>' +
            '<div class="cdrow">' + ranks.join('') + '</div>' +
            '<div class="sub">With ability haste: +15 AH <b>' + CD.fmt(CD.at(sp.cd, 1, 15)) + '</b> \u00B7 +30 AH <b>' + CD.fmt(CD.at(sp.cd, 1, 30)) + '</b> (rank 1)</div>' +
            (c.tag ? '<span class="chip ' + c.tag + '">' + (TAGS[c.tag] || c.tag) + '</span>' : '') +
            (c.tip ? '<p class="tip" style="max-width:420px">' + esc(c.tip) + '</p>' : '') + '</div>' +
            '<div class="rate"><button class="btn again" data-rate="again">Again <kbd>1</kbd></button><button class="btn good" data-rate="good">Good <kbd>2</kbd></button><button class="btn easy" data-rate="easy">Easy <kbd>3</kbd></button></div>';
        }
        h += '</div>';
        root.innerHTML = h;
        var fc = root.querySelector('#fc');
        if (!flipped) fc.addEventListener('click', function () { flipped = true; draw(); });
        root.querySelectorAll('[data-rate]').forEach(function (b) { b.addEventListener('click', function () { rate(b.dataset.rate); }); });
      }
      function rate(r) {
        var c = cur(); if (!c) return;
        SRS.rate(c.id, r); tally[r]++;
        if (r === 'again') queue.splice(Math.min(idx + 4, queue.length), 0, c.id);
        idx++; flipped = false; draw();
      }
      function summary() {
        var s = st(), ss = M.tierStats(tiers()[0] || [], s.full);
        root.innerHTML = '<div class="session"><div class="card" style="text-align:center"><h2>Session complete</h2><div class="stats" style="margin:14px 0"><div class="stat"><b>' + tally.again + '</b><span>Again</span></div><div class="stat"><b>' + tally.good + '</b><span>Good</span></div><div class="stat"><b>' + tally.easy + '</b><span>Easy</span></div></div>' +
          '<div class="sub" style="margin-bottom:12px">Tier 1 mastery: ' + Math.round(ss.pct * 100) + '% (80% unlocks the next tier)</div><div class="row" style="justify-content:center;gap:10px"><a class="btn" href="#/train">Back to tiers</a><a class="btn primary" href="#/train/flash" id="again-btn">Another session</a></div></div></div>';
        root.querySelector('#again-btn').addEventListener('click', function (e) { e.preventDefault(); flash(); });
      }
      function key(e) {
        if (e.target.closest && e.target.closest('input,select,textarea')) return;
        if (idx >= queue.length) return;
        if (!flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flipped = true; draw(); }
        else if (flipped && (e.key === '1' || e.key === '2' || e.key === '3')) rate(['again', 'good', 'easy'][+e.key - 1]);
      }
      document.addEventListener('keydown', key);
      cleanup = function () { document.removeEventListener('keydown', key); };
      if (!queue.length) { root.innerHTML = '<div class="empty">No cards in this scope yet.</div>'; return; }
      draw();
    }).catch(fail);
  }

  /* ---------------- Memory Match ---------------- */
  function match() {
    loading();
    loadCards(scopeChamps()).then(function (cards) {
      var wide = window.innerWidth >= 700, pairsN = wide ? 8 : 6, seen = {}, pool = shuffle(cards).filter(function (c) {
        var v = c.spell.cd[0]; if (!v || seen[v]) return false; seen[v] = 1; return true;
      }).slice(0, pairsN);
      if (pool.length < 3) { root.innerHTML = '<div class="card">Not enough unique cooldowns in this scope. <a class="btn sm" href="#/train">Back</a></div>'; return; }
      var deck = [];
      pool.forEach(function (c) { deck.push({ pid: c.id, kind: 'a', c: c }); deck.push({ pid: c.id, kind: 'c', c: c }); });
      deck = shuffle(deck);
      var open = [], moves = 0, found = 0, t0 = Date.now(), lock = false;
      var h = '<div class="session"><div class="prog"><a href="#/train" class="btn sm">\u2190 Back</a><span id="mv">Moves 0</span><span class="spacer"></span><span id="pr">0/' + pool.length + ' pairs</span></div>' +
        '<div class="sub" style="text-align:center">Match each ability with its rank 1 cooldown.</div><div class="grid-match ' + (wide ? 'g4' : '') + '" id="grid">' +
        deck.map(function (d, i) { return '<button class="mcard" data-i="' + i + '" aria-label="Card"><span class="back-face">?</span></button>'; }).join('') + '</div></div>';
      root.innerHTML = h;
      var grid = root.querySelector('#grid');
      function face(d) {
        if (d.kind === 'a') return '<span class="face"><img src="' + DD.spellImg(d.c.spell.icon) + '" alt=""><span class="lbl">' + esc(d.c.cname) + ' ' + d.c.slot + '</span></span>';
        return '<span class="face"><span class="cdv">' + CD.fmt(d.c.spell.cd[0]) + '</span><span class="lbl">rank 1</span></span>';
      }
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('.mcard'); if (!b || lock || b.classList.contains('open') || b.classList.contains('done')) return;
        var i = +b.dataset.i; b.classList.add('open'); b.innerHTML = face(deck[i]); open.push(i);
        if (open.length === 2) {
          moves++; root.querySelector('#mv').textContent = 'Moves ' + moves;
          var a = deck[open[0]], c = deck[open[1]], ea = grid.children[open[0]], ec = grid.children[open[1]];
          if (a.pid === c.pid && a.kind !== c.kind) {
            ea.classList.add('done'); ec.classList.add('done'); open = []; found++;
            root.querySelector('#pr').textContent = found + '/' + pool.length + ' pairs';
            if (found === pool.length) finish();
          } else {
            lock = true; ea.classList.add('bad'); ec.classList.add('bad');
            setTimeout(function () {
              [ea, ec].forEach(function (x) { x.classList.remove('open', 'bad'); x.innerHTML = '<span class="back-face">?</span>'; });
              open = []; lock = false;
            }, 750);
          }
        }
      });
      function finish() {
        var secs = Math.round((Date.now() - t0) / 1000), stats = Store.get('stats', {}), m = stats.match || { games: 0, best: null };
        m.games++; if (m.best == null || moves < m.best) m.best = moves; stats.match = m; Store.set('stats', stats);
        setTimeout(function () {
          if (!root) return;
          root.querySelector('.session').insertAdjacentHTML('beforeend', '<div class="card" style="text-align:center" id="done"><h2>Cleared!</h2><div class="sub" style="margin:6px 0 12px">' + moves + ' moves \u00B7 ' + secs + 's \u00B7 best ' + m.best + ' moves</div><div class="row" style="justify-content:center;gap:10px"><a class="btn" href="#/train">Back</a><button class="btn primary" id="replay">Play again</button></div></div>');
          root.querySelector('#replay').addEventListener('click', match);
        }, 400);
      }
    }).catch(fail);
  }

  /* ---------------- Rapid Quiz ---------------- */
  function quiz() {
    loading();
    loadCards(scopeChamps()).then(function (cards) {
      cards = cards.filter(function (c) { return c.spell.cd[0] > 0; });
      var mode = Store.get('quizmode', 'choice'), mixed = Store.get('quizmixed', false);
      var qs = shuffle(cards).slice(0, 10), i = 0, right = 0, streak = 0, best = 0, answered = false, tStart = 0, times = [];
      if (!qs.length) { root.innerHTML = '<div class="empty">No cards in this scope yet.</div>'; return; }
      function rankFor(c) { return mixed ? 1 + Math.floor(Math.random() * Math.min(c.spell.cd.length, 5)) : 1; }
      qs.forEach(function (c) { c.q = rankFor(c); c.ans = c.spell.cd[Math.min(c.q, c.spell.cd.length) - 1]; });
      function options(c) {
        var set = {}, out = [c.ans]; set[c.ans] = 1;
        var near = [c.ans - 4, c.ans - 2, c.ans + 2, c.ans + 4, c.ans + 6, c.ans - 1, c.ans + 1, c.ans + 8, c.ans - 3];
        shuffle(near).forEach(function (v) { v = Math.round(v * 10) / 10; if (v > 0 && !set[v] && out.length < 4) { set[v] = 1; out.push(v); } });
        return shuffle(out);
      }
      function fmtNum(v) { return (Math.round(v * 10) / 10) + 's'; }
      function draw() {
        if (!root) return;
        if (i >= qs.length) return end();
        var c = qs[i]; answered = false; tStart = Date.now();
        var h = '<div class="session"><div class="prog"><a href="#/train" class="btn sm">\u2190 Back</a><div class="bar"><i style="width:' + Math.round(i / qs.length * 100) + '%"></i></div><span>' + (i + 1) + '/' + qs.length + '</span></div>' +
          '<div class="row wrap-r"><div class="seg" id="qmode"><button data-m="choice" class="' + (mode === 'choice' ? 'on' : '') + '">Choices</button><button data-m="type" class="' + (mode === 'type' ? 'on' : '') + '">Type it</button></div>' +
          '<label class="row sub" style="gap:6px"><input type="checkbox" id="mixed"' + (mixed ? ' checked' : '') + '> Mixed ranks</label><span class="spacer"></span><span class="chip accent">Streak ' + streak + '</span></div>' +
          '<div class="card" style="text-align:center;display:grid;gap:10px;justify-items:center"><div class="row">' + img(c.champ) + '<img class="portrait" src="' + DD.spellImg(c.spell.icon) + '" alt=""></div>' +
          '<div class="q" style="font-size:20px;font-weight:650">' + esc(c.cname) + ' ' + c.slot + ' \u00B7 ' + esc(c.spell.name) + '</div><div class="sub">Cooldown at <b>rank ' + c.q + '</b>?</div></div>';
        if (mode === 'choice') h += '<div class="opts" id="opts">' + options(c).map(function (v) { return '<button class="opt" data-v="' + v + '">' + fmtNum(v) + '</button>'; }).join('') + '</div>';
        else h += '<form id="tf" class="stack"><input class="numin" id="num" inputmode="decimal" pattern="[0-9.,]*" autocomplete="off" placeholder="seconds" aria-label="Cooldown in seconds"><button class="btn primary" type="submit">Check <kbd>Enter</kbd></button></form>';
        h += '<div id="fb"></div></div>';
        root.innerHTML = h;
        root.querySelector('#qmode').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b) return; mode = b.dataset.m; Store.set('quizmode', mode); draw(); });
        root.querySelector('#mixed').addEventListener('change', function (e) { mixed = e.target.checked; Store.set('quizmixed', mixed); qs.slice(i).forEach(function (q) { q.q = rankFor(q); q.ans = q.spell.cd[Math.min(q.q, q.spell.cd.length) - 1]; }); draw(); });
        if (mode === 'choice') root.querySelector('#opts').addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (b) check(+b.dataset.v, b); });
        else { var num = root.querySelector('#num'); root.querySelector('#tf').addEventListener('submit', function (e) { e.preventDefault(); var v = parseFloat(num.value.replace(',', '.')); if (!isNaN(v)) check(v); }); if (window.matchMedia('(hover:hover)').matches) num.focus(); }
      }
      function check(v, btn) {
        if (answered) return; answered = true;
        var c = qs[i], ok = Math.abs(v - c.ans) <= 0.5; times.push(Date.now() - tStart);
        if (ok) { right++; streak++; best = Math.max(best, streak); } else streak = 0;
        SRS.rate(c.id, ok ? 'good' : 'again');
        if (btn) { btn.classList.add(ok ? 'right' : 'wrong'); root.querySelectorAll('.opt').forEach(function (b) { if (Math.abs(+b.dataset.v - c.ans) < 0.01) b.classList.add('right'); }); }
        else { var n = root.querySelector('#num'); if (n) n.disabled = true; }
        root.querySelector('#fb').innerHTML = '<div class="card tight" style="text-align:center"><b style="color:var(--' + (ok ? 'safe' : 'danger') + ')">' + (ok ? 'Correct' : 'Not quite') + '</b> \u00B7 ' + esc(c.cname) + ' ' + c.slot + ' rank ' + c.q + ' = <b>' + fmtNum(c.ans) + '</b>' + (c.tip ? '<div class="tip" style="margin-top:6px">' + esc(c.tip) + '</div>' : '') + '</div><button class="btn primary" id="next" style="width:100%;margin-top:10px">Next <kbd>Enter</kbd></button>';
        root.querySelector('#next').addEventListener('click', function () { i++; draw(); });
        root.querySelector('#next').focus();
      }
      function end() {
        var acc = Math.round(right / qs.length * 100), avg = times.length ? (times.reduce(function (a, b) { return a + b; }, 0) / times.length / 1000).toFixed(1) : '0';
        var stats = Store.get('stats', {}), q = stats.quiz || { rounds: 0, correct: 0, total: 0, bestStreak: 0 };
        q.rounds++; q.correct += right; q.total += qs.length; q.bestStreak = Math.max(q.bestStreak, best); stats.quiz = q; Store.set('stats', stats);
        root.innerHTML = '<div class="session"><div class="card" style="text-align:center"><h2>Round complete</h2><div class="stats" style="margin:14px 0"><div class="stat"><b>' + right + '/' + qs.length + '</b><span>Correct (' + acc + '%)</span></div><div class="stat"><b>' + avg + 's</b><span>Avg time</span></div><div class="stat"><b>' + best + '</b><span>Best streak</span></div></div><div class="row" style="justify-content:center;gap:10px"><a class="btn" href="#/train">Back</a><button class="btn primary" id="replay">New round</button></div></div></div>';
        root.querySelector('#replay').addEventListener('click', quiz);
      }
      function key(e) { if (e.key === 'Enter' && answered) { var n = root && root.querySelector('#next'); if (n && document.activeElement !== n) { e.preventDefault(); n.click(); } } }
      document.addEventListener('keydown', key);
      cleanup = function () { document.removeEventListener('keydown', key); };
      draw();
    }).catch(fail);
  }

  /* ---------------- Progress ---------------- */
  function progress() {
    var s = st(), stats = Store.get('stats', {}), q = stats.quiz, m = stats.match, all = SRS.all();
    var h = '<div class="stack"><div><h1>Progress</h1><div class="sub">Saved on this device</div></div>';
    h += '<div class="stats">' +
      '<div class="stat"><b>' + Object.keys(all).length + '</b><span>Cards seen</span></div>' +
      '<div class="stat"><b>' + Object.keys(all).filter(function (k) { return all[k].box >= 3; }).length + '</b><span>Cards mastered</span></div>' +
      '<div class="stat"><b>' + (q ? Math.round(q.correct / Math.max(q.total, 1) * 100) + '%' : '\u2014') + '</b><span>Quiz accuracy</span></div>' +
      '<div class="stat"><b>' + (q ? q.bestStreak : 0) + '</b><span>Best quiz streak</span></div>' +
      '<div class="stat"><b>' + (m && m.best != null ? m.best : '\u2014') + '</b><span>Best match (moves)</span></div></div>';
    L.ROLES.forEach(function (r) {
      var t = M.tiers(r.id, s.bracket), u = M.unlockedCount(r.id, s.bracket, s.full);
      h += '<div class="card"><div class="row"><h3>' + r.label + '</h3><span class="spacer"></span><span class="sub">' + u + ' / ' + t.length + ' tiers unlocked</span></div><div class="list" style="margin-top:10px">';
      t.forEach(function (ids, i) {
        var ss = M.tierStats(ids, s.full), pct = Math.round(ss.pct * 100);
        h += '<div class="li" style="' + (i >= u ? 'opacity:.5' : '') + '"><b style="width:56px">Tier ' + (i + 1) + '</b><div class="bar ' + (pct >= 80 ? 'ok' : '') + '" style="flex:1"><i style="width:' + pct + '%"></i></div><span class="sub" style="width:44px;text-align:right">' + pct + '%</span></div>';
      });
      h += '</div></div>';
    });
    var weak = Object.keys(all).filter(function (k) { return all[k].miss > 0; }).sort(function (a, b) { return all[b].miss - all[a].miss; }).slice(0, 8);
    h += '<div class="card"><h3>Most missed</h3><div class="list" style="margin-top:10px">' + (weak.length ? weak.map(function (k) {
      var p = k.split(':'), nm = (DD.byId[p[0]] || {}).name || p[0];
      return '<div class="li">' + img(p[0]) + '<b>' + esc(nm) + ' ' + p[1] + '</b><span class="spacer"></span><span class="sub">missed ' + all[k].miss + '\u00D7</span></div>';
    }).join('') : '<div class="sub">Nothing yet. Start a flashcard session.</div>') + '</div></div></div>';
    root.innerHTML = h;
  }
})();
