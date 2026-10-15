/* ================================================================
 * Screen Resolution Tool v1.0 — ปรับ "ความละเอียดที่เว็บเห็น" ได้อิสระ
 * หลักการ: แก้ <meta name="viewport"> + zoom → เว็บ/layout/media query
 * ตอบสนองเหมือนจอนั้นจริง ๆ (window.innerWidth เปลี่ยนตาม)
 * ข้อจำกัด: window.screen.width อ่านค่าจริงเสมอ (browser ห้ามแก้ไข)
 * ================================================================ */
(function () {
'use strict';

var CSS = `
#rs-root{font-family:'Segoe UI',Tahoma,sans-serif;width:300px;max-width:92vw;user-select:none;-webkit-user-select:none}
#rs-root *{box-sizing:border-box}
.rs-handle{height:22px;line-height:22px;cursor:grab;text-align:center;font-size:12px;color:#8a8a92;letter-spacing:4px;touch-action:none;background:linear-gradient(#efeff3,#e3e3e9);border-radius:10px 10px 0 0;margin-bottom:8px}
.rs-handle:active{cursor:grabbing}
.rs-row{display:flex;gap:6px;margin-bottom:8px;align-items:center;flex-wrap:wrap}
.rs-lbl{font-size:12px;color:#666;width:100%}
.rs-select,.rs-in{flex:1;min-width:0;border:1px solid #c9c9cf;border-radius:8px;padding:8px;font-size:14px;background:#fff;color:#222;font-family:inherit}
.rs-in{width:70px;flex:none;text-align:center}
.rs-seg{display:flex;flex:1;border:1px solid #c9c9cf;border-radius:8px;overflow:hidden}
.rs-seg button{flex:1;border:none;background:#fff;padding:8px 4px;font-size:12px;cursor:pointer;color:#222;font-family:inherit}
.rs-seg button.on{background:#1a73e8;color:#fff}
.rs-btn{border:1px solid #c9c9cf;background:#fff;border-radius:8px;padding:8px 10px;font-size:13px;cursor:pointer;color:#222;flex:1;font-family:inherit}
.rs-btn:hover{background:#f0f0f3}
.rs-btn.pri{background:#188038;color:#fff;border-color:#188038}
.rs-btn.danger{background:#d93025;color:#fff;border-color:#d93025}
.rs-range{flex:1;min-width:0}
.rs-info{font-size:11px;color:#888;font-style:italic;margin-bottom:6px;word-break:break-all}
.rs-status{font-size:11px;color:#1a73e8;min-height:14px;margin-bottom:4px}
.rs-x{flex:none;width:30px;padding:8px 0}
`;

var PRESETS = [
  [1920, 1080, '1920 × 1080 (Full HD)'],
  [1600, 900,  '1600 × 900'],
  [1366, 768,  '1366 × 768 (โน้ตบุ๊ก)'],
  [1280, 720,  '1280 × 720 (HD)'],
  [1024, 768,  '1024 × 768 (iPad)'],
  [800, 600,   '800 × 600'],
  [485, 402,   '485 × 402 (Scratch stage)'],
  [360, 800,   '360 × 800 (มือถือทั่วไป)']
];

var state = { saved: false, origVp: null, createdVp: false, w: 1920, h: 1080, mode: 'fit', zoom: 100 };
var root, els = {};

function key() { try { return 'rs-' + location.hostname; } catch (e) { return 'rs'; } }
function status(t) { if (els.status) els.status.textContent = t; }
function info() {
  if (!els.info) return;
  var s = (window.visualViewport && window.visualViewport.scale) || 1;
  els.info.textContent = 'จริง ' + window.screen.width + '×' + window.screen.height +
    ' → layout ' + window.innerWidth + '×' + window.innerHeight + ' @×' + s.toFixed(2);
}
window.addEventListener('resize', info);

function ensureVp() {
  var vp = document.querySelector('meta[name="viewport"]');
  if (!vp) {
    vp = document.createElement('meta');
    vp.setAttribute('name', 'viewport');
    document.head.appendChild(vp);
    state.createdVp = true;
  }
  return vp;
}
function saveOrig() {
  if (state.saved) return;
  var vp = document.querySelector('meta[name="viewport"]');
  state.origVp = vp ? vp.getAttribute('content') : null;
  state.saved = true;
}
function apply() {
  saveOrig();
  var w = state.w | 0, h = state.h | 0;
  if (w < 100) w = 100;
  if (h < 100) h = 100;
  state.w = w; state.h = h;
  var vp = ensureVp();
  var sw = window.screen.width, sh = window.screen.height;
  var parts = ['width=' + w, 'height=' + h, 'user-scalable=yes', 'minimum-scale=0.05', 'maximum-scale=20'];
  if (state.mode === 'fit') {
    var s = Math.min(sw / w, sh / h);
    s = Math.max(0.05, Math.min(20, s));
    parts.push('initial-scale=' + s.toFixed(3));
    document.documentElement.style.zoom = '';
  } else if (state.mode === 'native') {
    parts.push('initial-scale=1');
    document.documentElement.style.zoom = '';
  } else {
    parts.push('initial-scale=1');
    document.documentElement.style.zoom = state.zoom / 100;
  }
  vp.setAttribute('content', parts.join(', '));
  persist();
  info();
  status('✅ ตั้ง ' + w + '×' + h + ' แล้ว — บางเว็บต้องกด "ใช้" ซ้ำหลังโหลดเสร็จ');
}
function reset() {
  var vp = document.querySelector('meta[name="viewport"]');
  if (state.createdVp && vp) vp.remove();
  else if (vp) {
    if (state.origVp) vp.setAttribute('content', state.origVp);
    else vp.remove();
  }
  document.documentElement.style.zoom = '';
  try { localStorage.removeItem(key()); } catch (e) {}
  info();
  status('↩️ คืนค่าเดิมแล้ว');
}
function persist() {
  try { localStorage.setItem(key(), JSON.stringify({ w: state.w, h: state.h, mode: state.mode, zoom: state.zoom })); } catch (e) {}
}
function restore() {
  try {
    var d = JSON.parse(localStorage.getItem(key()) || 'null');
    if (d && d.w) { state.w = d.w; state.h = d.h; state.mode = d.mode || 'fit'; state.zoom = d.zoom || 100; return true; }
  } catch (e) {}
  return false;
}
function goFs() {
  var el = document.documentElement;
  var req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) { status('เต็มจอไม่รองรับ'); return; }
  Promise.resolve(req.call(el)).then(function () {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
    status('🖥️ เต็มจอแล้ว');
  }).catch(function () { status('🖥️ เต็มจอไม่สำเร็จ (เว็บนี้ห้าม) — ลองแตะที่ตัวเกมก่อน'); });
}
function syncUI() {
  els.w.value = state.w; els.h.value = state.h;
  els.zoom.value = state.zoom;
  els.zoomVal.textContent = state.zoom + '%';
  var btns = els.seg.querySelectorAll('button');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('on', btns[i].dataset.m === state.mode);
  els.rangeRow.style.display = state.mode === 'custom' ? 'flex' : 'none';
}

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function init(opts) {
  opts = opts || {};
  if (!document.getElementById('rs-style')) {
    var st = document.createElement('style');
    st.id = 'rs-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  var container = opts.container || document.getElementById('rs-root');
  if (!container) { console.error('ScreenRes: ไม่เจอ container'); return; }
  if (container.dataset.rs) return;
  container.dataset.rs = '1';
  root = container;
  restore();

  var handle = el('div', 'rs-handle', '⠿  ปรับ Resolution  ⠿');
  root.appendChild(handle);

  var infoE = el('div', 'rs-info'); els.info = infoE;
  var statusE = el('div', 'rs-status'); els.status = statusE;
  root.appendChild(infoE);
  root.appendChild(statusE);

  /* preset + custom */
  var row1 = el('div', 'rs-row');
  var sel = el('select', 'rs-select');
  PRESETS.forEach(function (p) {
    var o = el('option', '', p[2]);
    o.value = p[0] + 'x' + p[1];
    sel.appendChild(o);
  });
  var other = el('option', '', '— กำหนดเอง —'); other.value = 'custom';
  sel.appendChild(other);
  sel.value = state.w + 'x' + state.h;
  if (sel.value !== state.w + 'x' + state.h) sel.value = 'custom';
  var wIn = el('input', 'rs-in'); wIn.type = 'number'; wIn.min = 100; wIn.max = 9999;
  var hIn = el('input', 'rs-in'); hIn.type = 'number'; hIn.min = 100; hIn.max = 9999;
  els.w = wIn; els.h = hIn;
  row1.appendChild(sel); row1.appendChild(el('span', '', 'W')); row1.appendChild(wIn);
  row1.appendChild(el('span', '', 'H')); row1.appendChild(hIn);
  root.appendChild(row1);

  sel.addEventListener('change', function () {
    if (sel.value !== 'custom') {
      var p = sel.value.split('x');
      state.w = +p[0]; state.h = +p[1];
      syncUI();
    }
  });
  wIn.addEventListener('input', function () { sel.value = 'custom'; state.w = +wIn.value || state.w; });
  hIn.addEventListener('input', function () { sel.value = 'custom'; state.h = +hIn.value || state.h; });

  /* mode segment */
  var row2 = el('div', 'rs-row');
  var seg = el('div', 'rs-seg'); els.seg = seg;
  [['fit', 'พอดีจอ'], ['native', '1:1'], ['custom', 'ซูมเอง']].forEach(function (m) {
    var b = el('button', '', m[1]);
    b.dataset.m = m[0];
    b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); });
    b.addEventListener('click', function () { state.mode = m[0]; syncUI(); });
    seg.appendChild(b);
  });
  row2.appendChild(seg);
  root.appendChild(row2);

  /* zoom slider */
  var row3 = el('div', 'rs-row'); els.rangeRow = row3;
  var rng = el('input', 'rs-range'); rng.type = 'range'; rng.min = 10; rng.max = 300; rng.step = 5;
  var zv = el('span', '', '100%'); els.zoomVal = zv; els.zoom = rng;
  rng.addEventListener('input', function () { state.zoom = +rng.value; zv.textContent = rng.value + '%'; });
  row3.appendChild(rng); row3.appendChild(zv);
  root.appendChild(row3);

  /* actions */
  var row4 = el('div', 'rs-row');
  var applyB = el('button', 'rs-btn pri', '✅ ใช้'); applyB.style.flex = '2';
  var resetB = el('button', 'rs-btn danger', '↩️ คืนค่า');
  var fsB = el('button', 'rs-btn', '🖥️ เต็มจอ');
  [applyB, resetB, fsB].forEach(function (b) {
    b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); });
  });
  applyB.addEventListener('click', apply);
  resetB.addEventListener('click', reset);
  fsB.addEventListener('click', goFs);
  row4.appendChild(applyB); row4.appendChild(resetB); row4.appendChild(fsB);
  root.appendChild(row4);

  var row5 = el('div', 'rs-row');
  var tip = el('div', 'rs-lbl', '💡 ใช้กับเกม: เลือก preset "485×402 (Scratch)" แล้วกด ✕ ปิดแผงได้เลย ค่าจำไว้ให้อัตโนมัติ');
  row5.appendChild(tip);
  var xB = el('button', 'rs-btn rs-x', '✕');
  xB.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); });
  xB.addEventListener('click', function () { root.style.display = 'none'; });
  row5.appendChild(xB);
  root.appendChild(row5);

  /* drag */
  var drag = null;
  handle.addEventListener('pointerdown', function (ev) {
    ev.preventDefault(); ev.stopPropagation();
    var cs = getComputedStyle(root);
    if (cs.position !== 'fixed') root.style.position = 'fixed';
    var r = root.getBoundingClientRect();
    root.style.left = r.left + 'px'; root.style.top = r.top + 'px';
    drag = { dx: ev.clientX - r.left, dy: ev.clientY - r.top };
    try { handle.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  handle.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    root.style.left = Math.max(0, Math.min(window.innerWidth - 60, ev.clientX - drag.dx)) + 'px';
    root.style.top = Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - drag.dy)) + 'px';
  });
  handle.addEventListener('pointerup', function () { drag = null; });
  handle.addEventListener('pointercancel', function () { drag = null; });

  syncUI();
  info();
  if (restore.applied !== true) {
    /* ถ้าเคยบันทึกไว้ → ใช้ให้อัตโนมัติ */
    var had = false;
    try { had = !!localStorage.getItem(key()); } catch (e) {}
    if (had) { syncUI(); apply(); status('🔄 ใช้ค่าที่จำไว้ให้อัตโนมัติ'); }
  }
}

window.ScreenRes = { init: init, apply: apply, reset: reset, state: state };
})();
