/* BK-065: one official-list footer. Copy of record: Scribe ef136712 (v-b, 11:30 ET; BK-072 invite line). Built by script; do not hand-edit. */
(function () {
  'use strict';
  var el = document.getElementById('bk-official');
  if (!el) return;
  var P = [["Official $BUNKY places (this is the whole list): ", ["this site", "https://timteh.github.io/bunkyseal/"], " \u00b7 ", ["X @BunkySeal", "https://x.com/BunkySeal"], " \u00b7 ", ["Telegram t.me/bunkyseal", "https://t.me/bunkyseal"], " \u00b7 ", ["Bluesky bunkyseal.bsky.social", "https://bsky.app/profile/bunkyseal.bsky.social"], " \u00b7 ", ["Discord discord.gg/SD8qGkbw6U", "https://discord.gg/SD8qGkbw6U"], ". Telegram invite links (t.me/+\u2026) count as ours only when @BunkySeal or this site posts them. Any other account, group or invite using the name isn't us."], ["Contract address (Solana): GPojeXRcXthWBMWxWC6iY5TMjY8dLf25Q2Ft4kMVRwD4"], [["Updates to our founder line", "https://timteh.github.io/bunkyseal/corrections/"]]];
  el.style.overflowWrap = 'anywhere';
  P.forEach(function (segs) {
    var p = document.createElement('p');
    segs.forEach(function (s) {
      if (typeof s === 'string') { p.appendChild(document.createTextNode(s)); return; }
      var a = document.createElement('a'); a.href = s[1]; a.rel = 'noopener'; a.textContent = s[0]; p.appendChild(a);
    });
    el.appendChild(p);
  });
})();
