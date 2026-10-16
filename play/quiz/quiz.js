/* BK-007 quiz. Answers live only in this page's memory; nothing is stored or sent. */
(function (root) {
  'use strict';
  // Scribe 1a: each answer adds 1 point to one seal. Highest total wins.
  // Tie: the seal picked on Q6 wins; if Q6's pick isn't among the tied seals, the tied seal listed first in `order` wins.
  function score(picks, order) {
    var t = {}; order.forEach(function (k) { t[k] = 0; });
    picks.forEach(function (k) { if (k in t) t[k] += 1; });
    var max = Math.max.apply(null, order.map(function (k) { return t[k]; }));
    var tied = order.filter(function (k) { return t[k] === max; });
    var q6 = picks[5];
    return tied.length === 1 ? tied[0] : (tied.indexOf(q6) !== -1 ? q6 : tied[0]);
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { score: score }; return; }
  root.BK007score = score;
  var D = root.BK007, doc = root.document;
  if (!D || !doc) return;
  var $ = function (id) { return doc.getElementById(id); };
  var picks = [null, null, null, null, null, null], cur = 0;

  function render() {
    var q = D.questions[cur];
    $('q-prog').textContent = D.ui.progress.replace('<n>', String(cur + 1));
    $('q-text').textContent = q.q;
    var box = $('answers'); box.textContent = '';
    q.a.forEach(function (a) {
      var b = doc.createElement('button');
      b.type = 'button'; b.textContent = a.t; b.setAttribute('data-k', a.k);
      b.setAttribute('aria-pressed', picks[cur] === a.k ? 'true' : 'false');
      b.addEventListener('click', function () { pick(a.k); });
      box.appendChild(b);
    });
    $('btn-see').hidden = !(cur === 5 && picks[5]);
  }
  function go(i) {
    cur = i; $('start').hidden = true; $('quiz').hidden = false; render(); $('q-text').focus();
  }
  function pick(k) {
    picks[cur] = k;
    if (cur < 5) { go(cur + 1); return; }
    render(); $('btn-see').focus();
  }
  $('btn-start').hidden = false;
  $('btn-start').addEventListener('click', function () { go(0); });
  $('btn-back').addEventListener('click', function () {
    if (cur === 0) { $('quiz').hidden = true; $('start').hidden = false; $('btn-start').focus(); return; }
    go(cur - 1);
  });
  $('btn-see').addEventListener('click', function () {
    if (picks.indexOf(null) !== -1) return;
    root.location.href = 'r/' + D.slugs[score(picks, D.order)] + '.html';
  });
})(typeof window !== 'undefined' ? window : globalThis);
