/* ============================================================
   OBSCURO - localStorage helpers, app state, data loading
   ============================================================ */

(function () {
  'use strict';

  /* ---- localStorage wrapper ---- */
  const Store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === undefined) return fallback;
        const parsed = JSON.parse(raw);
        return parsed === null || parsed === undefined ? fallback : parsed;
      } catch (e) {
        return fallback;
      }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) {}
    },
  };

  /* ---- Storage keys ---- */
  const KEYS = {
    SETUP_DONE: 'obscuro_setup_done',
    EXAM_DATE:  'obscuro_exam_date',
    MODE:       'obscuro_mode',
    DISPLAY:    'obscuro_display',
    PROGRESS:   'obscuro_progress',
    STREAK:     'obscuro_streak',
    QUEUE:      'obscuro_queue',
    DAILY_DATE: 'obscuro_daily_date',
    DAILY_DONE: 'obscuro_daily_done',
  };

  /* ---- Date helpers ---- */
  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function daysBetween(fromISO, toISO) {
    const a = new Date(fromISO + 'T00:00:00');
    const b = new Date(toISO + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function defaultExamDate() {
    return '2026-05-11';
  }

  /* ---- App state - in-memory ---- */
  const state = {
    questions: [],
    syllabus:  [],
    mode:      'both',          // 'SL' | 'HL' | 'both'
    display:   'machine',       // 'machine' | 'reader'
    examDate:  null,
    progress:  {},              // { id: { seen, correct, lastSeen, timesAnswered } }
    streak:    { lastDate: null, count: 0 },
    weakQueue: [],              // ids queued for tomorrow
    daily:     { date: null, done: 0 },
    session:   {                // current session
      queue: [],
      index: 0,
      results: [],              // { qid, level, topic, correct, explanation }
    },
    currentScreen: 'dashboard',
  };

  /* ---- Persisted-state hydration ---- */
  function hydrate() {
    state.mode      = Store.get(KEYS.MODE, 'both');
    state.display   = Store.get(KEYS.DISPLAY, 'machine');
    state.examDate  = Store.get(KEYS.EXAM_DATE, null);
    state.progress  = Store.get(KEYS.PROGRESS, {});
    state.streak    = Store.get(KEYS.STREAK, { lastDate: null, count: 0 });
    state.weakQueue = Store.get(KEYS.QUEUE, []);
    const dDate     = Store.get(KEYS.DAILY_DATE, null);
    const dDone     = Store.get(KEYS.DAILY_DONE, 0);
    if (dDate === todayISO()) {
      state.daily = { date: dDate, done: dDone };
    } else {
      state.daily = { date: todayISO(), done: 0 };
      Store.set(KEYS.DAILY_DATE, state.daily.date);
      Store.set(KEYS.DAILY_DONE, 0);
    }
  }

  function persistAll() {
    Store.set(KEYS.MODE,       state.mode);
    Store.set(KEYS.DISPLAY,    state.display);
    Store.set(KEYS.EXAM_DATE,  state.examDate);
    Store.set(KEYS.PROGRESS,   state.progress);
    Store.set(KEYS.STREAK,     state.streak);
    Store.set(KEYS.QUEUE,      state.weakQueue);
    Store.set(KEYS.DAILY_DATE, state.daily.date);
    Store.set(KEYS.DAILY_DONE, state.daily.done);
  }

  function isSetupDone() { return Store.get(KEYS.SETUP_DONE, false) === true; }
  function markSetupDone() { Store.set(KEYS.SETUP_DONE, true); }

  /* ---- Data loading - fetches questions and syllabus JSON ---- */
  async function loadData() {
    const [qRes, sRes] = await Promise.all([
      fetch('docs/questions_bank.json'),
      fetch('docs/syllabus.json'),
    ]);
    if (!qRes.ok) throw new Error('Failed to load questions');
    if (!sRes.ok) throw new Error('Failed to load syllabus');
    const [questions, syllabus] = await Promise.all([qRes.json(), sRes.json()]);
    state.questions = questions;
    state.syllabus  = syllabus;
    return { questions, syllabus };
  }

  /* ---- Mode-aware question pool ---- */
  function pool() {
    if (state.mode === 'both') return state.questions.slice();
    return state.questions.filter((q) => q.level === state.mode);
  }

  /* ---- Counts for the dashboard ---- */
  function counts() {
    const p = pool();
    let answered = 0;
    let correct = 0;
    p.forEach((q) => {
      const r = state.progress[q.id];
      if (r && r.seen) {
        answered += 1;
        if (r.correct) correct += 1;
      }
    });
    return {
      total:    p.length,
      answered: answered,
      correct:  correct,
      remaining: p.length - answered,
    };
  }

  function applyDisplay() {
    document.body.classList.toggle('reader-mode', state.display === 'reader');
  }

  // Export
  window.OB_STORE = {
    Store,
    KEYS,
    state,
    hydrate,
    persistAll,
    isSetupDone,
    markSetupDone,
    loadData,
    pool,
    counts,
    todayISO,
    daysBetween,
    defaultExamDate,
    applyDisplay,
  };
})();
