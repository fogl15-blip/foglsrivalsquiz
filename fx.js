// ══════════════════════════════════════════════════
//  QuizBuzz – Animationen (Host, Spieler, Overlay)
//  Wird nach shared.js geladen.
// ══════════════════════════════════════════════════
const FX_REDUCED = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

(function fxInjectStyles() {
  const st = document.createElement('style');
  st.textContent = `
  @keyframes fxSlideIn { from { opacity:0; transform:translateY(18px) scale(.98); } to { opacity:1; transform:none; } }
  @keyframes fxFade    { from { opacity:0; } to { opacity:1; } }
  @keyframes fxPulse   { 0% { box-shadow:0 0 0 0 var(--fxc,#ffd700); } 100% { box-shadow:0 0 0 24px transparent; } }
  @keyframes fxGlow    { 0%,100% { box-shadow:0 0 0 0 transparent; } 30% { box-shadow:0 0 26px 6px var(--fxc,#22c55e); } }
  @keyframes fxShake   { 0%,100% { transform:translateX(0); } 20% { transform:translateX(-9px); } 40% { transform:translateX(8px); } 60% { transform:translateX(-5px); } 80% { transform:translateX(3px); } }
  @keyframes fxPop     { 0% { transform:scale(.6); opacity:0; } 60% { transform:scale(1.08); opacity:1; } 100% { transform:scale(1); } }
  @keyframes fxFlash   { 0% { opacity:.6; } 100% { opacity:0; } }
  @keyframes fxEdge    { 0% { box-shadow:inset 0 0 0 0 transparent; } 30% { box-shadow:inset 0 0 70px 14px var(--fxc); } 100% { box-shadow:inset 0 0 0 0 transparent; } }
  @keyframes fxFloat   { 0% { opacity:0; transform:translate(-50%,0) scale(.7); } 15% { opacity:1; transform:translate(-50%,-12px) scale(1.2); } 100% { opacity:0; transform:translate(-50%,-70px) scale(1); } }
  @keyframes fxRise    { from { opacity:0; transform:translateY(26px) scale(.97); } to { opacity:1; transform:none; } }
  .fx-slide-in { animation: fxSlideIn .45s cubic-bezier(.2,.8,.2,1) both; }
  .fx-pulse    { animation: fxPulse .7s ease-out 2; }
  .fx-glow     { animation: fxGlow 1.1s ease-out; }
  .fx-shake    { animation: fxShake .5s ease; }
  .fx-pop      { animation: fxPop .4s cubic-bezier(.2,.9,.3,1.3) both; }
  .fx-rise     { animation: fxRise .5s cubic-bezier(.2,.8,.2,1) both; }
  .fx-flash    { position:fixed; inset:0; pointer-events:none; z-index:9998; animation: fxFlash .8s ease-out forwards; }
  .fx-edge     { position:fixed; inset:0; pointer-events:none; z-index:9997; animation: fxEdge 1.1s ease-out forwards; }
  .fx-float    { position:fixed; z-index:9999; pointer-events:none; font-family:'Rajdhani',sans-serif; font-weight:700;
                 font-size:1.7rem; text-shadow:0 2px 10px rgba(0,0,0,.7); animation: fxFloat 1.3s ease-out forwards; }
  @media (prefers-reduced-motion: reduce) {
    .fx-slide-in, .fx-rise, .fx-pop { animation-name: fxFade; }
    .fx-shake, .fx-pulse, .fx-edge { animation: none; }
  }`;
  document.head.appendChild(st);
})();

// Restart a CSS animation class on an element that stays in the DOM
function fxReplay(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

// For elements rebuilt via innerHTML on every session update: remember the start,
// renders re-apply the class with a negative delay so the animation keeps running.
const fxMarks = {};
function fxMark(key, cls, ms) { fxMarks[key] = { cls, start: performance.now(), ms }; }
function fxAttrs(key) {
  const m = fxMarks[key];
  if (!m) return { cls: '', style: '' };
  const elapsed = performance.now() - m.start;
  if (elapsed > m.ms) { delete fxMarks[key]; return { cls: '', style: '' }; }
  return { cls: ' ' + m.cls, style: `animation-delay:-${Math.round(elapsed)}ms;` };
}

function fxFlash(color) {
  const d = document.createElement('div');
  d.className = 'fx-flash';
  d.style.background = `radial-gradient(circle at 50% 45%, ${color} 0%, transparent 70%)`;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 900);
}

function fxEdge(color) {
  if (FX_REDUCED) return;
  const d = document.createElement('div');
  d.className = 'fx-edge';
  d.style.setProperty('--fxc', color);
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1200);
}

function fxFloatOver(el, text, color) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  const d = document.createElement('div');
  d.className = 'fx-float';
  d.textContent = text;
  d.style.color = color || '#fff';
  d.style.left = (r.left + r.width / 2) + 'px';
  d.style.top = (r.top - 6) + 'px';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1400);
}

function fxConfetti({ x, y, color = '#ffd700', count = 90, power = 1 } = {}) {
  if (FX_REDUCED) return;
  const dpr = window.devicePixelRatio || 1;
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const ox = x ?? innerWidth / 2, oy = y ?? innerHeight * 0.35;
  const colors = [color, color, '#ffffff', '#ffd700'];
  const parts = Array.from({ length: count }, () => ({
    x: ox, y: oy,
    vx: (Math.random() - 0.5) * 13 * power,
    vy: (-Math.random() * 11 - 4) * power,
    s: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    c: colors[Math.floor(Math.random() * colors.length)]
  }));
  const t0 = performance.now(), dur = 1700;
  (function frame(t) {
    const k = (t - t0) / dur;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = k > 0.7 ? Math.max(0, (1 - k) / 0.3) : 1;
    for (const p of parts) {
      p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}

function fxConfettiFrom(el, color, count, power) {
  const r = el?.getBoundingClientRect();
  fxConfetti(r && r.width
    ? { x: r.left + r.width / 2, y: r.top + r.height / 3, color, count, power }
    : { color, count, power });
}

// Scores count up instead of jumping. Renders call fxScoreText(key, score, color)
// and put data-fx-score="key" (optional data-fx-suffix) on the number element.
const fxScores = {};
function fxScoreText(key, actual, color) {
  actual = actual || 0;
  const s = fxScores[key];
  if (!s) { fxScores[key] = { from: actual, to: actual, start: 0, shown: actual }; return actual; }
  if (s.to !== actual) {
    const delta = actual - s.to;
    s.from = s.shown; s.to = actual; s.start = performance.now();
    // small deltas get a floating "+3"; a session reset (big jump) just counts
    if (Math.abs(delta) <= 20) requestAnimationFrame(() =>
      fxFloatOver(document.querySelector(`[data-fx-score="${key}"]`),
        (delta > 0 ? '+' : '') + delta, delta > 0 ? (color || '#22c55e') : '#ef4444'));
    fxRunScores();
  }
  return Math.round(s.shown);
}

let fxScoreLoop = false;
function fxRunScores() {
  if (fxScoreLoop) return;
  fxScoreLoop = true;
  (function step(t) {
    let busy = false;
    for (const [key, s] of Object.entries(fxScores)) {
      if (s.shown === s.to) continue;
      const k = FX_REDUCED ? 1 : Math.min(1, (t - s.start) / 900);
      s.shown = k >= 1 ? s.to : s.from + (s.to - s.from) * (1 - Math.pow(1 - k, 3));
      if (k < 1) busy = true;
      document.querySelectorAll(`[data-fx-score="${key}"]`).forEach(el => {
        el.textContent = Math.round(s.shown) + (el.dataset.fxSuffix || '');
      });
    }
    if (busy) requestAnimationFrame(step); else fxScoreLoop = false;
  })(performance.now());
}

// What happened since the last session update (first call only stores the state)
let fxPrevState = null;
function fxEvents(s) {
  const now = {
    qid: s?.currentQuestion?.id || null,
    first: s?.buzzer?.order?.[0] || null,
    awardTs: s?.lastAward?.ts || 0,
  };
  const ev = {};
  if (fxPrevState) {
    if (now.qid && now.qid !== fxPrevState.qid) ev.newQuestion = now.qid;
    if (now.first && now.first !== fxPrevState.first) ev.firstBuzz = now.first;
    if (now.awardTs && now.awardTs !== fxPrevState.awardTs) ev.award = s.lastAward;
  }
  fxPrevState = now;
  return ev;
}
