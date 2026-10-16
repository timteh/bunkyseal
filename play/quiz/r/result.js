/* BK-007 result page: Copy button (clipboard with select-text fallback). No network, no storage. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ta = $('share-txt'), btn = $('btn-copy');
  if (!ta || !btn) return;
  var text = ta.value;
  function fallback() {
    $('fallback-lbl').textContent = /Mac|iPhone|iPad/.test(navigator.platform || '') && !('ontouchstart' in window) ? 'Press ⌘C to copy' : 'Press and hold to copy';
    $('fallback').hidden = false; ta.focus(); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    if (ok) $('copied').textContent = 'Copied.';
  }
  btn.hidden = false;
  btn.addEventListener('click', function () {
    var ok = function () { $('copied').textContent = 'Copied.'; };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else fallback();
  });
})();
