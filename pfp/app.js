(function () {
  'use strict';

  var SIZE = 1080;
  var BADGE_FRAC = 0.14; // ~14% of canvas
  var RING_OUTER = 48;
  var RING_GAP = 10;
  var RING_INNER = 22;

  var fileInput = document.getElementById('file');
  var chooseBtn = document.getElementById('choose');
  var downloadBtn = document.getElementById('download');
  var canvas = document.getElementById('out');
  var ctx = canvas.getContext('2d');
  var statusEl = document.getElementById('status');
  var dropzone = document.getElementById('dropzone');
  var sealImg = new Image();
  var userImg = null;
  var ready = false;

  canvas.width = SIZE;
  canvas.height = SIZE;

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function drawPlaceholder() {
    ctx.fillStyle = '#f6e3b0';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, SIZE - 48, SIZE - 48);
    ctx.fillStyle = '#1b1b1b';
    ctx.font = '600 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Pick an image to wear the bunker ring', SIZE / 2, SIZE / 2);
  }

  function coverDraw(img) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var scale = Math.max(SIZE / iw, SIZE / ih);
    var dw = iw * scale;
    var dh = ih * scale;
    var dx = (SIZE - dw) / 2;
    var dy = (SIZE - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawFanRing() {
    var cx = SIZE / 2;
    var cy = SIZE / 2;
    var rOuter = SIZE / 2 - RING_OUTER / 2 - 4;

    // Thick amber outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.strokeStyle = '#E8A70C';
    ctx.lineWidth = RING_OUTER;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Ink edge on outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter + RING_OUTER / 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter - RING_OUTER / 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Green dashed inner ring (decorative FAN style — not staff chrome)
    var rInner = rOuter - RING_OUTER / 2 - RING_GAP - RING_INNER / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.strokeStyle = '#4b5d2a';
    ctx.lineWidth = RING_INNER;
    ctx.setLineDash([28, 18]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Thin double accent inside dashed ring
    ctx.beginPath();
    ctx.arc(cx, cy, rInner - RING_INNER / 2 - 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#E8A70C';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, rInner - RING_INNER / 2 - 16, 0, Math.PI * 2);
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawSealBadge() {
    var badgeSize = Math.round(SIZE * BADGE_FRAC);
    var pad = 28;
    var x = SIZE - badgeSize - pad;
    var y = SIZE - badgeSize - pad;

    // Plate behind badge
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 5;
    roundRect(ctx, x - 8, y - 8, badgeSize + 16, badgeSize + 16, 18);
    ctx.fill();
    ctx.stroke();

    if (sealImg.complete && sealImg.naturalWidth) {
      ctx.save();
      roundClip(ctx, x, y, badgeSize, badgeSize, 14);
      ctx.drawImage(sealImg, x, y, badgeSize, badgeSize);
      ctx.restore();
    }

    // Tiny "fan" label — fans stay fans, not staff
    ctx.fillStyle = '#4b5d2a';
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 3;
    var labelW = 56;
    var labelH = 28;
    var lx = x + badgeSize - labelW + 4;
    var ly = y + badgeSize - labelH + 4;
    roundRect(ctx, lx, ly, labelW, labelH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('fan', lx + labelW / 2, ly + labelH / 2 + 1);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function roundClip(c, x, y, w, h, r) {
    roundRect(c, x, y, w, h, r);
    c.clip();
  }

  function compose() {
    if (!userImg) {
      drawPlaceholder();
      return;
    }
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(0, 0, SIZE, SIZE);
    coverDraw(userImg);
    drawFanRing();
    drawSealBadge();
    // Hard floor: no contract address, no %, no price/buy/sell text drawn on image
  }

  function enableDownload(on) {
    ready = !!on;
    downloadBtn.disabled = !on;
  }

  function loadUserFile(file) {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) {
      setStatus('Please choose an image file (PNG, JPEG, WebP, etc.).');
      return;
    }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      userImg = img;
      compose();
      URL.revokeObjectURL(url);
      enableDownload(true);
      setStatus('Image loaded. Download PNG is ready — all processing stayed in your browser.');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      setStatus('Could not read that image. Try another file.');
      enableDownload(false);
    };
    img.src = url;
  }

  chooseBtn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    if (f) loadUserFile(f);
  });

  downloadBtn.addEventListener('click', function () {
    if (!ready) return;
    canvas.toBlob(function (blob) {
      if (!blob) {
        setStatus('Download failed. Try again.');
        return;
      }
      var a = document.createElement('a');
      var u = URL.createObjectURL(blob);
      a.href = u;
      a.download = 'bunky-fan-ring.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(u);
      setStatus('PNG downloaded. No upload. No server save. No wallet. No CA on the image.');
    }, 'image/png');
  });

  // Drag-drop
  ;['dragenter', 'dragover'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('is-drag');
    });
  });
  ;['dragleave', 'drop'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('is-drag');
    });
  });
  dropzone.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadUserFile(f);
  });

  sealImg.onload = function () {
    compose();
  };
  sealImg.onerror = function () {
    setStatus('Seal badge asset missing locally; ring still works.');
    compose();
  };
  sealImg.src = 'seal-badge.png';

  drawPlaceholder();
  enableDownload(false);
  setStatus('Waiting for an image. Everything stays on your device.');
})();
