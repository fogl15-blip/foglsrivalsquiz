// ══════════════════════════════════════════════════
//  QuizBuzz – Firebase Bridge (shared)
//  Loaded after firebase-config.js on every page
// ══════════════════════════════════════════════════

// Firebase SDK (compat mode via CDN – loaded in HTML)
let db = null;
let authReady = null;   // resolves once the anonymous login is done

function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  db = firebase.database();
  // Anonymous auth so the database rules can require auth != null,
  // keeping bots/scanners without a Firebase session out.
  // On a device's very first visit there is no stored login yet: listeners
  // registered before sign-in finishes get rejected by the rules and never
  // retry, so on()/once() wait for authReady.
  authReady = new Promise(resolve => {
    const stop = firebase.auth().onAuthStateChanged(user => {
      if (user) { stop(); resolve(user); }
    });
  });
  firebase.auth().signInAnonymously().catch(err => console.error('Anonymous sign-in failed:', err));
  return db;
}

// ── Helpers ──────────────────────────────────────

function ref(path) { return db.ref(path); }

function set(path, val)   { return db.ref(path).set(val); }
function push(path, val)  { return db.ref(path).push(val); }
function update(path, val){ return db.ref(path).update(val); }
function remove(path)     { return db.ref(path).remove(); }

function on(path, cb) {
  authReady.then(() => db.ref(path).on('value', snap => cb(snap.val())));
}
function once(path) {
  return authReady.then(() => db.ref(path).once('value')).then(s => s.val());
}

// ── State paths ──────────────────────────────────
const PATHS = {
  session:    'session',
  players:    'session/players',
  buzzer:     'session/buzzer',
  question:   'session/question',
  locked:     'session/locked',
  phase:      'session/phase',      // 'lobby' | 'question' | 'reveal' | 'scoreboard'
  questions:  'questions',
  categories: 'categories',
};

// ── Session defaults ─────────────────────────────
function defaultSession() {
  return {
    phase:    'lobby',
    locked:   false,
    question: null,
    buzzer:   { order: [], firstId: null },
    players: Object.fromEntries(ALL_PIDS.map((pid, i) => [pid,
      { id: pid, name: 'Spieler ' + (i + 1), score: 0, answer: '', connected: false, color: PLAYER_COLORS[i] }]))
  };
}

// ── Spieler-Slots (max. 6) ───────────────────────
const ALL_PIDS = ['p1','p2','p3','p4','p5','p6'];

function pidColor(pid) { return PLAYER_COLORS[parseInt(pid.slice(1)) - 1] || '#fff'; }

// Slots that take part this round: online, joined once, or already holding points
function activePids(s) {
  const ps = s?.players || {};
  return ALL_PIDS.filter(pid => {
    const p = ps[pid];
    return p && (p.connected || p.joined || (p.score || 0) !== 0);
  });
}

// Slots that exist in the session (avoid creating half-empty player nodes)
function existingPids(s) {
  return ALL_PIDS.filter(pid => s?.players?.[pid]);
}

// ── Toast util ───────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show', 'ok', 'err'), 2500);
}

// ── HTML escape ──────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Format seconds ───────────────────────────────
function fmtTime(ms) {
  const s = (ms / 1000).toFixed(2);
  return s + 's';
}

// ── Clips (z. B. Musik 5/10/15 s): q.clips = "5, 10, 15", q.clipStart = Sekunden ──
function parseClips(v) {
  return String(v ?? '').split(/[,;\s]+/).map(Number).filter(n => n > 0);
}

// Pauses el once it reaches stopAt (seconds); stopAt null/0 = play freely.
// Call after play(), the watcher ends as soon as el is paused.
function setClipStop(el, stopAt) {
  if (!el) return;
  clearInterval(el._clipTimer);
  el._clipTimer = null;
  el._clipStopAt = stopAt > 0 ? stopAt : null;
  if (!el._clipStopAt) return;
  el._clipTimer = setInterval(() => {
    if (!el.paused && !el.ended && el.currentTime < stopAt) return;
    clearInterval(el._clipTimer);
    el._clipTimer = null;
    if (!el.paused) el.pause();
  }, 40);
}

// ── Rundenstatistik (session/stats/<pid>: buzzes, first, correct, wrong) ──
function incStat(pid, key) {
  if (!pid) return;
  return db.ref(`session/stats/${pid}/${key}`).transaction(v => (v || 0) + 1);
}

function buildStatsHtml(session) {
  const players = session?.players || {};
  const stats = session?.stats || {};
  const rows = ALL_PIDS
    .filter(pid => players[pid] && (activePids(session).includes(pid) || stats[pid]))
    .map(pid => {
      const p = players[pid], s = stats[pid] || {};
      const correct = s.correct || 0, wrong = s.wrong || 0;
      return {
        name: p.name || pid, color: p.color || '#fff', score: p.score || 0,
        buzzes: s.buzzes || 0, first: s.first || 0, correct, wrong,
        quote: correct + wrong ? Math.round(correct / (correct + wrong) * 100) + ' %' : '–'
      };
    })
    .sort((a, b) => b.score - a.score);
  if (!rows.length) return '<div class="stats-empty">Noch keine Daten.</div>';
  const medals = ['🥇', '🥈', '🥉'];
  return '<div class="stats-list">' + rows.map((r, i) => `
    <div class="stats-card" style="--pc:${esc(r.color)};">
      <div class="stats-head">
        <span class="stats-rank">${medals[i] || '#' + (i + 1)}</span>
        <span class="stats-name">${esc(r.name)}</span>
        <span class="stats-score">${r.score} Pkt.</span>
      </div>
      <div class="stats-chips">
        <span>🔔 Buzzer: <b>${r.buzzes}</b></span>
        <span>⚡ Erster: <b>${r.first}</b></span>
        <span>✅ Richtig: <b>${r.correct}</b></span>
        <span>❌ Falsch: <b>${r.wrong}</b></span>
        <span>🎯 Quote: <b>${r.quote}</b></span>
      </div>
    </div>`).join('') + '</div>';
}
