/* BK-005 localStorage state (Forge). Key bunky.play.v1. Nothing leaves the device. UMD: window.BunkyState. */
(function (root) {
/* load() -> {ok:true,data} | {ok:false,data:fresh,error}. error is exactly one of:
   'unavailable' = localStorage blocked/absent/throws (Safari private etc.); game plays, show "Progress can't be saved in this browser".
   'reset'       = stored JSON corrupt or wrong version; discarded, show "saved progress was reset".
   save() -> {ok:true} | {ok:false,error:'unavailable'}. */
  var KEY = 'bunky.play.v1', KEEP_DAYS = 14, DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var storage = null; /* override for tests via BunkyState._setStorage */
  function store() {
    if (storage) return storage;
    try { return root.localStorage || null; } catch (e) { return null; }
  }
  function fresh() { return { v: 1, days: {}, streak: 0, best_streak: 0, last_sealed: null }; }
  function dayNum(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }
  function addDays(s, k) { return new Date((dayNum(s) + k) * 86400000).toISOString().slice(0, 10); }
  function validTaps(t) { return Array.isArray(t) && t.every(function (x) { return Array.isArray(x) && x.length === 2 && x.every(function (v) { return Number.isInteger(v) && v >= 0 && v <= 3; }); }); }
  function valid(d) {
    if (!d || typeof d !== 'object' || d.v !== 1 || !d.days || typeof d.days !== 'object' || Array.isArray(d.days)) return false;
    if (!Number.isInteger(d.streak) || !Number.isInteger(d.best_streak)) return false;
    if (!(d.last_sealed === null || (typeof d.last_sealed === 'string' && DATE_RE.test(d.last_sealed)))) return false;
    return Object.keys(d.days).every(function (k) {
      var e = d.days[k];
      return DATE_RE.test(k) && e && Number.isInteger(e.n) && validTaps(e.taps) && typeof e.done === 'boolean' && typeof e.sealed === 'boolean';
    });
  }
  function load() {
    var s = store();
    if (!s) return { ok: false, data: fresh(), error: 'unavailable' };
    var raw;
    try { raw = s.getItem(KEY); } catch (e) { return { ok: false, data: fresh(), error: 'unavailable' }; }
    if (raw == null) return { ok: true, data: fresh() };
    try { var d = JSON.parse(raw); if (valid(d)) return { ok: true, data: d }; } catch (e) {}
    try { s.removeItem(KEY); } catch (e) {}
    return { ok: false, data: fresh(), error: 'reset' };
  }
  function streak(data, todayET) {
    var days = (data && data.days) || {}, best = (data && data.best_streak) || 0;
    var cur = days[todayET] && days[todayET].sealed ? todayET : addDays(todayET, -1), n = 0;
    while (days[cur] && days[cur].sealed) { n++; cur = addDays(cur, -1); }
    return { streak: n, best: Math.max(best, n) };
  }
  function save(round) {
    var s = store(), d = load().data;
    d.days[round.date] = { n: round.n, taps: round.taps.map(function (t) { return [t[0], t[1]]; }), done: !!round.done, sealed: !!round.sealed };
    var cutoff = dayNum(round.date) - (KEEP_DAYS - 1);
    Object.keys(d.days).forEach(function (k) { if (dayNum(k) < cutoff) delete d.days[k]; });
    if (round.sealed && (!d.last_sealed || d.last_sealed < round.date)) d.last_sealed = round.date;
    var st = streak(d, round.date);
    d.streak = st.streak; d.best_streak = st.best;
    if (!s) return { ok: false, error: 'unavailable' };
    try { s.setItem(KEY, JSON.stringify(d)); return { ok: true }; } catch (e) { return { ok: false, error: 'unavailable' }; }
  }
  var api = { KEY: KEY, load: load, save: save, streak: streak, _setStorage: function (x) { storage = x; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BunkyState = api;
})(typeof window !== 'undefined' ? window : globalThis);
