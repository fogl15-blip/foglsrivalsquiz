// ══════════════════════════════════════════════════
//  QuizBuzz – Firebase Bridge (shared)
//  Loaded after firebase-config.js on every page
// ══════════════════════════════════════════════════

// Firebase SDK (compat mode via CDN – loaded in HTML)
let db = null;

function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  db = firebase.database();
  // Anonymous auth so the database rules can require auth != null,
  // keeping bots/scanners without a Firebase session out.
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
  db.ref(path).on('value', snap => cb(snap.val()));
}
function once(path) {
  return db.ref(path).once('value').then(s => s.val());
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
    players: {
      p1: { id:'p1', name:'Spieler 1', score:0, answer:'', connected:false, color:'#f5a623' },
      p2: { id:'p2', name:'Spieler 2', score:0, answer:'', connected:false, color:'#4fc3f7' },
      p3: { id:'p3', name:'Spieler 3', score:0, answer:'', connected:false, color:'#66bb6a' },
      p4: { id:'p4', name:'Spieler 4', score:0, answer:'', connected:false, color:'#ef5350' },
    }
  };
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
