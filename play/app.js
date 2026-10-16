/* BK-005 Seal the Bunker — UI wiring only. Logic lives in Forge's game.js/state.js/disclosure.js. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var BP = window.BunkyPlay, BS = window.BunkyState;
  document.getElementById('status').textContent = "Loading today's bunker…";
  var SEALED = '\uD83D\uDD12', OPEN = '\uD83D\uDD13';

  // Disclosure: single source = disclosure.js. Shown in every state.
  var DISC = typeof window.BUNKY_DISCLOSURE === 'string' ? window.BUNKY_DISCLOSURE : '';
  $('disclosure').textContent = DISC;

  function show(el, on) { $(el).hidden = !on; }
  function status(t) { $('status').textContent = t; }
  function note(t) { var n = $('note'); n.textContent = t; n.hidden = false; }

  var UNAVAILABLE = "Today's puzzle is unavailable. Check back soon.";
  if (!BP || !BS || !DISC) { status(UNAVAILABLE); return; }

  var NOSAVE = "Progress can't be saved in this browser, but you can still play.";
  var cfg, puzzles, round, puzzle, today, storageOk = true, focusIdx = 0;

  // X weighted length: URLs = 23, code points above U+10FF = 2, else 1.
  function xLen(text) {
    var n = 0;
    text.split(/(https:\/\/\S+)/).forEach(function (part, i) {
      if (i % 2) { n += 23; return; }
      for (var ch of part) n += ch.codePointAt(0) > 0x10FF ? 2 : 1;
    });
    return n;
  }
  function xText(text) {
    if (xLen(text) <= 280) return text;
    var t = text.split('\n').filter(function (l) { return l !== cfg.play_url; }).join('\n');
    return t; // site_url + disclosure never dropped
  }

  function gridText(board) {
    var rows = [];
    for (var r = 0; r < 4; r++) {
      var s = ''; for (var c = 0; c < 4; c++) s += board[r * 4 + c] ? SEALED : OPEN;
      rows.push(s);
    }
    return rows.join('\n');
  }

  function buildBoard() {
    var b = $('board'); b.textContent = '';
    for (var i = 0; i < 16; i++) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'bolt'; btn.dataset.i = String(i);
      btn.tabIndex = i === 0 ? 0 : -1;
      b.appendChild(btn);
    }
    // pointer/click only once: use 'click' (fires for touch, mouse, Enter/Space on buttons)
    b.addEventListener('click', function (e) {
      var t = e.target.closest('.bolt'); if (!t || t.disabled) return;
      onTap(+t.dataset.i);
    });
    b.addEventListener('keydown', function (e) {
      var t = e.target.closest('.bolt'); if (!t) return;
      var i = +t.dataset.i, r = i >> 2, c = i & 3;
      var map = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      var d = map[e.key]; if (!d) return;
      e.preventDefault();
      r = Math.min(3, Math.max(0, r + d[0])); c = Math.min(3, Math.max(0, c + d[1]));
      moveFocus(r * 4 + c);
    });
  }
  function moveFocus(i) {
    var bolts = $('board').children;
    bolts[focusIdx].tabIndex = -1; focusIdx = i; bolts[i].tabIndex = 0; bolts[i].focus();
  }

  function render() {
    var bolts = $('board').children;
    for (var i = 0; i < 16; i++) {
      var s = !!round.board[i], btn = bolts[i];
      btn.textContent = s ? SEALED : OPEN;
      btn.dataset.s = s ? '1' : '0';
      btn.setAttribute('aria-label', 'Bolt row ' + ((i >> 2) + 1) + ' column ' + ((i & 3) + 1) + ', ' + (s ? 'sealed' : 'open'));
      btn.disabled = !!round.done;
    }
    $('count').textContent = 'Taps: ' + round.taps.length + '/' + cfg.max_taps;
    $('par').textContent = 'Par: ' + (Number.isInteger(round.par) ? round.par : 'unavailable');
    if (round.done) showResult(false);
  }

  function onTap(i) {
    var wasDone = round.done;
    round = BP.tap(round, i >> 2, i & 3);
    if (storageOk) { var s = BS.save(round); if (!s.ok) { storageOk = false; note(NOSAVE); } }
    render();
    if (!wasDone && round.done) showResult(true);
  }

  var shown = false;
  function showResult(focus) {
    if (shown) { if (focus) $('result-title').focus(); return; }
    shown = true;
    // Copy: Scribe 2026-10-16 14:45 draft, section 2 (pending DA)
    var n = round.taps.length, hasPar = Number.isInteger(round.par);
    $('result-line').textContent = !round.sealed
      ? 'The door held out after ' + cfg.max_taps + ' taps. A new bunker opens at midnight ET.'
      : !hasPar ? 'Sealed in ' + n + ' taps.'
      : n <= round.par ? 'Sealed in ' + n + ' taps. Par was ' + round.par + '. Nice work.'
      : 'Sealed in ' + n + ' taps. Par was ' + round.par + ". The door's shut, and that's what counts.";
    $('result-grid').textContent = gridText(round.board);
    var ld = BS.load();
    var st = ld.ok ? BS.streak(ld.data, today) : { streak: 0 };
    $('streak').textContent = 'Streak: ' + st.streak;
    setupShare();
    show('result', true);
    tick(); setInterval(tick, 30000);
    if (focus) $('result-title').focus();
  }

  function setupShare() {
    if (!BP.isHttps(cfg.play_url) || !BP.isHttps(cfg.site_url)) {
      show('share', false); show('share-off', true); return;
    }
    var text = BP.shareText(round, cfg);
    var links = BP.shareLinks(xText(text));
    var blinks = BP.shareLinks(text);
    if (BP.isHttps(links.x)) $('btn-x').href = links.x; else show('btn-x', false);
    if (BP.isHttps(blinks.bsky)) $('btn-bsky').href = blinks.bsky; else show('btn-bsky', false);
    $('btn-copy').addEventListener('click', function () {
      var ok = function () { $('copied').textContent = 'Copied.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, function () { fallback(text); });
      } else fallback(text);
    });
    if (typeof navigator.share === 'function') {
      show('btn-native', true);
      $('btn-native').addEventListener('click', function () {
        navigator.share({ text: text }).catch(function () {});
      });
    }
  }
  function fallback(text) {
    var ta = $('fallback-txt');
    $('fallback-lbl').textContent = /Mac|iPhone|iPad/.test(navigator.platform || '') && !('ontouchstart' in window) ? 'Press ⌘C to copy' : 'Press and hold to copy';
    ta.value = text; show('fallback', true); ta.focus(); ta.select();
  }

  function etParts(now) {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(now).forEach(function (x) { p[x.type] = +x.value; });
    return p;
  }
  function tick() {
    var p = etParts(new Date()), secs = 86400 - ((p.hour % 24) * 3600 + p.minute * 60 + p.second);
    var h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
    $('countdown').textContent = 'Next puzzle in ' + h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
    checkRollover();
  }
  function checkRollover() {
    if (today && BP.todayET() !== today) show('rollover', true); // never wipes the round
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkRollover(); });
  window.addEventListener('focus', checkRollover);

  function daysBetween(a, b) {
    return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
  }

  Promise.all([BP.loadConfig(), BP.loadPuzzles()]).then(function (res) {
    cfg = res[0]; puzzles = res[1];
    today = BP.todayET();
    puzzle = BP.puzzleFor(today, puzzles, cfg);
    if (!puzzle || !Array.isArray(puzzle.start) || puzzle.start.length !== 16) throw { code: 'invalid' };

    var list = puzzles.puzzles || [];
    var d = daysBetween(cfg.epoch_et, today);
    var stale = (puzzles.generated && daysBetween(puzzles.generated, today) > 45) || (d >= 0 && d >= list.length);
    if (stale) { var bd = $('badge'); bd.textContent = 'puzzle list is STALE'; bd.hidden = false; }

    var ld = BS.load(), saved = null;
    if (!ld.ok) {
      if (ld.error === 'unavailable') { storageOk = false; note(NOSAVE); }
      else note('Saved progress was reset.');
    } else if (ld.data && ld.data.days && ld.data.days[today] && ld.data.days[today].n === puzzle.n) {
      saved = ld.data.days[today];
    }
    round = BP.newRound(today, puzzle, saved); // taps replayed by game.js

    $('pnum').textContent = 'Puzzle #' + (Number.isInteger(puzzle.n) ? puzzle.n : 'unavailable');
    show('preview', !!puzzle.preview); show('preview-line', !!puzzle.preview);
    status('');
    if (round.done) status("You've played today's bunker. Come back after midnight ET for the next one.");
    buildBoard(); show('play', true); render();
  }).catch(function () {
    status(UNAVAILABLE);
    show('play', false); show('result', false);
  });
})();
