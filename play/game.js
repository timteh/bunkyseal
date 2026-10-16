/* BK-005 game logic (Forge). Pure, no DOM. UMD: window.BunkyPlay / module.exports. */
(function (root) {
  var DISC = (typeof module !== 'undefined' && module.exports) ? require('./disclosure.js').BUNKY_DISCLOSURE : root.BUNKY_DISCLOSURE;
  var STALE_DAYS = 45, X_LIMIT = 280, X_URL_WEIGHT = 23;

  function isHttps(u) {
    if (typeof u !== 'string') return false;
    try { var p = new URL(u); return p.protocol === 'https:' && !!p.hostname; } catch (e) { return false; }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function validConfig(c) {
    return !!c && typeof c === 'object' && isHttps(c.site_url) && isHttps(c.play_url) &&
      typeof c.epoch_et === 'string' && DATE_RE.test(c.epoch_et) &&
      Number.isInteger(c.max_taps) && c.max_taps > 0;
  }
  function validPuzzles(d) {
    if (!d || d.version !== 1 || typeof d.generated !== 'string' || !DATE_RE.test(d.generated) || !Array.isArray(d.puzzles) || !d.puzzles.length) return false;
    return d.puzzles.every(function (p, i) {
      return p && p.n === i + 1 && Number.isInteger(p.par) && p.par >= 3 && p.par <= 7 && Array.isArray(p.taps) &&
        p.taps.every(function (t) { return Array.isArray(t) && t.length === 2 && t.every(function (v) { return Number.isInteger(v) && v >= 0 && v <= 3; }); });
    });
  }
  function fetchLocal(path, validate) {
    if (typeof fetch !== 'function') return Promise.reject({ code: 'missing' });
    return fetch(path, { cache: 'no-store' }).then(function (r) {
      if (!r || !r.ok) throw { code: 'missing' };
      return r.json().catch(function () { throw { code: 'invalid' }; });
    }, function () { throw { code: 'missing' }; }).then(function (j) {
      if (!validate(j)) throw { code: 'invalid' };
      return j;
    });
  }
  function loadConfig() { return fetchLocal('./config.json', validConfig); }
  function loadPuzzles() { return fetchLocal('./puzzles.json', validPuzzles); }

  function todayET(now) {
    if (now == null) now = Date.now();
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  }
  function dayNum(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }
  function daysBetween(a, b) { return Math.round(dayNum(b) - dayNum(a)); }

  function applyTap(board, r, c) {
    var b = board.slice();
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      var rr = r + d[0], cc = c + d[1];
      if (rr >= 0 && rr < 4 && cc >= 0 && cc < 4) b[rr * 4 + cc] = !b[rr * 4 + cc];
    });
    return b;
  }
  function isSealed(board) { return board.length === 16 && board.every(function (x) { return x === true; }); }
  function sealedBoard() { var b = []; for (var i = 0; i < 16; i++) b.push(true); return b; }

  /* puzzles = parsed puzzles.json doc (or its .puzzles array). Extra fields: stale, wrapped, index. */
  function puzzleFor(dateET, puzzles, cfg) {
    var list = Array.isArray(puzzles) ? puzzles : puzzles.puzzles;
    var days = daysBetween(cfg.epoch_et, dateET), preview = days < 0;
    var idx = preview ? 0 : days % list.length, wrapped = !preview && days >= list.length;
    if (wrapped && typeof console !== 'undefined') console.warn('BunkyPlay: puzzle list wrapped; add puzzles');
    var p = list[idx], start = sealedBoard();
    p.taps.forEach(function (t) { start = applyTap(start, t[0], t[1]); });
    var gen = Array.isArray(puzzles) ? null : puzzles.generated;
    var stale = wrapped || (!!gen && daysBetween(gen, dateET) > STALE_DAYS);
    return { n: preview ? 1 : days + 1, date: dateET, start: start, par: p.par, preview: preview, stale: stale, wrapped: wrapped, index: idx, max_taps: cfg.max_taps };
  }

  function newRound(dateET, puzzle, saved) {
    var r = { n: puzzle.n, date: dateET, board: puzzle.start.slice(), taps: [], done: false, sealed: false, par: puzzle.par, max_taps: puzzle.max_taps || 12 };
    if (saved && saved.n === puzzle.n && Array.isArray(saved.taps)) {
      saved.taps.forEach(function (t) {
        if (Array.isArray(t) && t.length === 2) r = tap(r, t[0], t[1]);
      });
    }
    return r;
  }
  function tap(round, r, c) {
    if (round.done || !(Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < 4 && c >= 0 && c < 4)) return round;
    var board = applyTap(round.board, r, c), taps = round.taps.concat([[r, c]]), sealed = isSealed(board);
    return { n: round.n, date: round.date, board: board, taps: taps, done: sealed || taps.length >= round.max_taps, sealed: sealed, par: round.par, max_taps: round.max_taps };
  }

  function grid(board) {
    var rows = [];
    for (var r = 0; r < 4; r++) { var s = ''; for (var c = 0; c < 4; c++) s += board[r * 4 + c] ? '\uD83D\uDD12' : '\uD83D\uDD13'; rows.push(s); }
    return rows.join('\n');
  }
  function header(round, cfg) {
    var max = cfg.max_taps;
    return 'Seal the Bunker #' + round.n + ' \u2014 ' + (round.sealed ? round.taps.length + '/' + max + ' taps' : 'not sealed') + ' (par ' + round.par + ')';
  }
  function shareText(round, cfg, opts) {
    var lines = [header(round, cfg), grid(round.board)];
    if (!(opts && opts.dropPlayUrl)) lines.push(cfg.play_url);
    lines.push(cfg.site_url, DISC);
    return lines.join('\n');
  }
  /* X weighted length (twitter-text v3 style): URLs = 23, chars in light ranges = 1, else 2 (emoji = 2). */
  function xWeightedLength(text) {
    var n = 0, t = text.replace(/https?:\/\/\S+/g, function () { n += X_URL_WEIGHT; return ''; });
    for (var ch of t) {
      var cp = ch.codePointAt(0);
      var light = cp <= 4351 || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247);
      n += light ? 1 : 2;
    }
    return n;
  }
  /* X variant: full text if it fits, else play_url dropped (site_url + disclosure never dropped). */
  function shareTextX(round, cfg, limit) {
    limit = limit || X_LIMIT;
    var full = shareText(round, cfg);
    return xWeightedLength(full) <= limit ? full : shareText(round, cfg, { dropPlayUrl: true });
  }
  /* shareLinks(text[, xText]): xText defaults to text; UI should pass shareTextX(...) as xText. */
  function shareLinks(text, xText) {
    return {
      x: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(xText == null ? text : xText),
      bsky: 'https://bsky.app/intent/compose?text=' + encodeURIComponent(text)
    };
  }

  var api = { loadConfig: loadConfig, loadPuzzles: loadPuzzles, validConfig: validConfig, validPuzzles: validPuzzles,
    todayET: todayET, daysBetween: daysBetween, puzzleFor: puzzleFor, applyTap: applyTap, isSealed: isSealed,
    newRound: newRound, tap: tap, shareText: shareText, shareTextX: shareTextX, xWeightedLength: xWeightedLength,
    shareLinks: shareLinks, esc: esc, isHttps: isHttps, X_LIMIT: X_LIMIT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BunkyPlay = api;
})(typeof window !== 'undefined' ? window : globalThis);
