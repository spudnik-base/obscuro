/* ============================================================
   OBSCURO - logic, session flow, init, event wiring
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     Session queue building
     Priority: weak queue (yesterday's misses) > unseen > seen
     ============================================================ */

  function buildSessionQueue(extra) {
    const S = window.OB_STORE.state;
    const pool = window.OB_STORE.pool();
    const seen = S.progress;
    const weakSet = new Set(S.weakQueue);

    const weak = pool.filter((q) => weakSet.has(q.id));
    const unseen = pool.filter((q) => !seen[q.id]?.seen && !weakSet.has(q.id));
    const seenList = pool
      .filter((q) => seen[q.id]?.seen && !weakSet.has(q.id))
      .sort((a, b) => {
        const aAcc = seen[a.id]?.correct ? 1 : 0;
        const bAcc = seen[b.id]?.correct ? 1 : 0;
        if (aAcc !== bAcc) return aAcc - bAcc;
        const aLast = seen[a.id]?.lastSeen || '';
        const bLast = seen[b.id]?.lastSeen || '';
        return aLast.localeCompare(bLast);
      });

    // Lightly shuffle unseen so it's not always the same order
    shuffle(unseen);

    const target = extra ? 5 : Math.max(1, 5 - (S.daily.done % 5));
    const ordered = [...weak, ...unseen, ...seenList];
    return ordered.slice(0, target);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ============================================================
     Session control - start, advance, finish
     ============================================================ */

  function startSession(extra) {
    const S = window.OB_STORE.state;
    const queue = buildSessionQueue(!!extra);
    if (queue.length === 0) {
      window.OB_SCREENS.showScreen('dashboard');
      return;
    }
    S.session = { queue, index: 0, results: [] };
    window.OB_SCREENS.showScreen('question');
  }

  function startStarredSession() {
    const S = window.OB_STORE.state;
    const starredIds = S.starred || [];
    if (starredIds.length === 0) {
      window.OB_SCREENS.showScreen('dashboard');
      return;
    }
    const queue = S.questions.filter((q) => starredIds.indexOf(q.id) !== -1);
    if (queue.length === 0) {
      window.OB_SCREENS.showScreen('dashboard');
      return;
    }
    shuffle(queue);
    S.session = { queue, index: 0, results: [], starredOnly: true };
    window.OB_SCREENS.showScreen('question');
  }

  function confirmReset() {
    // Build modal on the fly using existing modal styles
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '95';

    const box = document.createElement('div');
    box.className = 'modal-box';

    const title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = 'RESET THE MACHINE';
    box.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'modal-sub';
    sub.textContent = 'This wipes all progress, streak, starred questions, and level setting. Cannot be undone.';
    box.appendChild(sub);

    const btnRow = document.createElement('div');
    btnRow.className = 'reset-modal-buttons';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn-secondary';
    cancel.textContent = 'CANCEL';
    cancel.addEventListener('click', () => overlay.remove());
    btnRow.appendChild(cancel);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'btn-primary';
    reset.textContent = 'RESET';
    reset.addEventListener('click', () => {
      window.OB_STORE.resetAll();
      window.location.reload();
    });
    btnRow.appendChild(reset);

    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function recordAnswerAndAdvance(question, userAnswer, isCorrect) {
    const S = window.OB_STORE.state;

    // Update progress map
    const prev = S.progress[question.id] || {};
    S.progress[question.id] = {
      seen: true,
      correct: isCorrect,
      lastSeen: window.OB_STORE.todayISO(),
      timesAnswered: (prev.timesAnswered || 0) + 1,
    };

    // Manage weak queue
    if (!isCorrect) {
      if (!S.weakQueue.includes(question.id)) S.weakQueue.push(question.id);
    } else {
      const i = S.weakQueue.indexOf(question.id);
      if (i !== -1) S.weakQueue.splice(i, 1);
    }

    // Daily counter
    S.daily.done = (S.daily.done || 0) + 1;
    S.daily.date = window.OB_STORE.todayISO();

    // Add to session results
    S.session.results.push({
      question: question,
      userAnswer: userAnswer,
      correct: isCorrect,
    });

    window.OB_STORE.persistAll();
    window.OB_SCREENS.showScreen('answer');
  }

  function advanceFromAnswer() {
    const S = window.OB_STORE.state;
    S.session.index += 1;

    // If we've finished a 5-question set, show synopsis
    const completedSet = S.session.results.length >= 5 && S.session.index >= S.session.queue.length;
    const finishedQueue = S.session.index >= S.session.queue.length;

    if (finishedQueue) {
      // Update streak now that a set is complete
      if (S.session.results.length >= 5) {
        S.streak = updateStreak(S.streak);
        window.OB_STORE.persistAll();
      }
      window.OB_SCREENS.showScreen('synopsis');
    } else {
      window.OB_SCREENS.showScreen('question');
    }
  }

  /* ============================================================
     Streak update - consecutive days, resets if a day skipped
     ============================================================ */

  function updateStreak(streak) {
    const today = window.OB_STORE.todayISO();
    if (streak.lastDate === today) return streak;
    const yesterday = (() => {
      const d = new Date(today + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    })();
    if (streak.lastDate === yesterday) return { lastDate: today, count: (streak.count || 0) + 1 };
    return { lastDate: today, count: 1 };
  }

  /* ============================================================
     Synopsis builder - template-based, no API
     ============================================================ */

  function buildSynopsis(results) {
    const correct = results.filter((r) => r.correct);
    const wrong = results.filter((r) => !r.correct);
    const topics = [...new Set(correct.map((r) => r.question.topic).filter(Boolean))];

    const lines = [];

    if (correct.length === results.length && results.length > 0) {
      lines.push('Clean sweep. Every detail nailed:');
      topics.slice(0, 4).forEach((t) => lines.push(`  > ${t}`));
      lines.push('');
      lines.push('The machine runs smooth today.');
    } else if (correct.length === 0) {
      lines.push('Rough run. Five slips:');
      lines.push('');
      wrong.forEach((r) => {
        const key = (r.question.explanation || '').split(/[\.!?]/)[0] + '.';
        lines.push(`  > Q${r.question.id} - ${r.question.topic || ''}`);
        lines.push(`    ${key.trim()}`);
        lines.push('    Queued for tomorrow.');
        lines.push('');
      });
    } else {
      lines.push(`You nailed: ${topics.join(', ') || 'a few things'}.`);
      lines.push('');
      lines.push(`${wrong.length} slip${wrong.length > 1 ? 's' : ''}:`);
      lines.push('');
      wrong.forEach((r) => {
        const key = (r.question.explanation || '').split(/[\.!?]/)[0] + '.';
        lines.push(`  > Q${r.question.id} - ${r.question.topic || ''}`);
        lines.push(`    ${key.trim()}`);
        lines.push('    Queued for tomorrow.');
        lines.push('');
      });
    }
    return lines.join('\n');
  }

  /* ============================================================
     First-launch setup flow
     ============================================================ */

  function showSetupModal() {
    const modal = document.getElementById('modal-setup');
    modal.classList.remove('hidden');

    // Mode toggle
    document.querySelectorAll('#setup-mode .mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#setup-mode .mode-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('setup-submit').addEventListener('click', () => {
      const S = window.OB_STORE.state;
      const activeMode = document.querySelector('#setup-mode .mode-btn.active');
      const mode = activeMode ? activeMode.dataset.mode : 'both';
      S.examDate = window.OB_STORE.defaultExamDate();
      S.mode = mode;
      window.OB_STORE.markSetupDone();
      window.OB_STORE.persistAll();
      modal.classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      window.OB_SCREENS.showScreen('dashboard');
    });
  }

  /* ============================================================
     Init - load data, hydrate, render shell
     ============================================================ */

  async function init() {
    // Render header machine + boot gear
    if (window.OB_GEARS) {
      window.OB_GEARS.renderBootGear(document.getElementById('boot-gear-g'));
      window.OB_GEARS.renderHeaderMachine(document.getElementById('header-machine'));
    }

    // Hydrate persisted state, then load data
    window.OB_STORE.hydrate();
    window.OB_STORE.applyDisplay();
    window.OB_STORE.applyTheme();
    try {
      await window.OB_STORE.loadData();
    } catch (err) {
      console.error('Data load failed', err);
      const boot = document.getElementById('boot');
      if (boot) boot.querySelector('.boot-label').textContent = 'failed to load - reload the page';
      return;
    }

    // Hide boot screen
    const boot = document.getElementById('boot');
    if (boot) boot.classList.add('gone');

    // Wire up nav
    document.querySelectorAll('#bottom-nav .nav-item').forEach((n) => {
      n.addEventListener('click', () => {
        const target = n.dataset.screen;
        if (target) window.OB_SCREENS.showScreen(target);
      });
    });

    // First launch?
    if (!window.OB_STORE.isSetupDone()) {
      showSetupModal();
    } else {
      document.getElementById('app').classList.remove('hidden');
      window.OB_SCREENS.showScreen('dashboard');
    }
  }

  // Export
  window.OB_APP = {
    startSession,
    startStarredSession,
    recordAnswerAndAdvance,
    advanceFromAnswer,
    buildSynopsis,
    updateStreak,
    confirmReset,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
