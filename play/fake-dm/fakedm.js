/* BK-006 Spot the Fake DM. Score lives only in this page's memory; nothing is stored or sent. */
(function (root) {
  'use strict';
  var REDACT = /(\[(?:link|address) removed for training\])/;
  function endText(tpl, n) { return tpl.replace('<n>', String(n)); }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { endText: endText, REDACT: REDACT }; return; }
  var D = root.BK006, doc = root.document;
  if (!D || !doc) return;
  var $ = function (id) { return doc.getElementById(id); };
  var cur = 0, score = 0, answered = false;
  var total = D.cards.length;

  function el(tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  // Message body: plain text; "[link removed for training]" / "[address removed for training]" become grey spans (DA 3).
  function fillMsg(box, msg) {
    box.textContent = '';
    msg.split(REDACT).forEach(function (part) {
      if (!part) return;
      if (REDACT.test(part)) box.appendChild(el('span', 'redact', part));
      else box.appendChild(doc.createTextNode(part));
    });
  }
  // Same DOM for every card (name span, handle span, tail span) so the who-line never hints at the answer.
  function fillWho(box, c) {
    box.textContent = '';
    var head, tail;
    if (c.kind === 'fake') { head = c.name; tail = ''; }
    else { var i = c.context.indexOf(c.handle); head = c.context.slice(0, i).trim(); tail = c.context.slice(i + c.handle.length).trim(); }
    box.appendChild(el('span', 'name', head));
    box.appendChild(doc.createTextNode(' '));
    box.appendChild(el('span', 'handle', c.handle));
    box.appendChild(doc.createTextNode(' '));
    var t = el('span', 'tail'); t.appendChild(doc.createTextNode(tail)); box.appendChild(t);
  }
  function render() {
    var c = D.cards[cur], card = $('card');
    answered = false;
    $('prog').textContent = 'Card ' + (cur + 1) + ' of ' + total;
    // No kind class / data-n / kind-specific aria before answering (DA: nothing may hint the answer).
    $('card').querySelector('.avatar').textContent = (c.kind === 'fake' ? c.name : 'Bunky').charAt(0);
    fillWho($('who'), c);
    fillMsg($('msg'), c.msg);
    // Neutral TRAINING EXAMPLE stamp is static in index.html and identical on every card.
    ['btn-scam', 'btn-legit'].forEach(function (id) { $(id).disabled = false; $(id).setAttribute('aria-pressed', 'false'); });
    $('reveal').textContent = '';
    $('reveal').className = 'reveal';
    $('btn-next').hidden = true;
  }
  function answer(a) {
    if (answered) return;
    answered = true;
    var c = D.cards[cur], ok = a === c.kind;
    if (ok) score += 1;
    ['btn-scam', 'btn-legit'].forEach(function (id) {
      var b = $(id); b.disabled = true; b.setAttribute('aria-pressed', b.getAttribute('data-a') === a ? 'true' : 'false');
    });
    var r = $('reveal');
    r.textContent = '';
    r.className = 'reveal ' + (ok ? 'ok' : 'no');
    r.appendChild(el('p', 'label ' + (c.kind === 'fake' ? 'is-fake' : 'is-real'), c.kind === 'fake' ? 'FAKE' : 'REAL'));
    r.appendChild(el('p', 'verdict', (ok ? 'Correct. ' : 'Not quite. ') + (c.kind === 'fake' ? 'This one is a scam.' : 'This one is legit.')));
    var p = el('p', 'why');
    p.appendChild(el('strong', null, c.whyLabel));
    p.appendChild(doc.createTextNode(' ' + c.why));
    r.appendChild(p);
    if (c.linkWas) r.appendChild(el('p', 'linkwas', c.linkWas)); // plain text, never a link
    $('btn-next').hidden = false;
    r.focus();
  }
  function show(id) {
    ['intro', 'game', 'end'].forEach(function (s) { $(s).hidden = s !== id; });
  }
  function start() { cur = 0; score = 0; show('game'); render(); $('prog').focus(); }
  function next() {
    if (!answered) return;
    if (cur < total - 1) { cur += 1; render(); $('prog').focus(); return; }
    var t = endText(D.ui.end, score), cut = t.indexOf('. ') + 1; // "You spotted <n> of 8." heading + rule line
    $('end-title').textContent = t.slice(0, cut);
    $('end-rule').textContent = t.slice(cut + 1);
    show('end');
    $('end-title').focus();
  }
  $('btn-scam').addEventListener('click', function () { answer('fake'); });
  $('btn-legit').addEventListener('click', function () { answer('legit'); });
  $('btn-next').addEventListener('click', next);
  $('btn-start').addEventListener('click', start);
  $('btn-again').addEventListener('click', start);
  $('btn-start').hidden = false;
})(typeof window !== 'undefined' ? window : globalThis);
