/* ============================================================
   OBSCURO - screen rendering. All six screens are rendered into
   their respective <section> placeholders in obscuro.html.
   ============================================================ */

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SCREENS = ['dashboard', 'question', 'answer', 'synopsis', 'papers', 'syllabus'];
  const NAV_SCREENS = ['dashboard', 'papers', 'syllabus'];

  function $(id) { return document.getElementById(id); }

  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null) return;
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      });
    }
    return e;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ============================================================
     showScreen - swap visible screen, update nav, scroll to top
     ============================================================ */

  function showScreen(name) {
    if (!SCREENS.includes(name)) return;
    const S = window.OB_STORE.state;

    SCREENS.forEach((s) => {
      const node = $(`screen-${s}`);
      if (!node) return;
      if (s === name) node.classList.remove('hidden');
      else node.classList.add('hidden');
    });

    document.querySelectorAll('.nav-item').forEach((n) => {
      const target = n.dataset.screen;
      if (NAV_SCREENS.includes(target)) {
        n.classList.toggle('active', target === name || (name === 'question' && target === 'dashboard') || (name === 'answer' && target === 'dashboard') || (name === 'synopsis' && target === 'dashboard'));
      }
    });

    S.currentScreen = name;
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.OB_RENDERERS && typeof window.OB_RENDERERS[name] === 'function') {
      window.OB_RENDERERS[name]();
    }
  }

  /* ============================================================
     Dashboard - countdown ring, streak chain, conveyor belt,
     mode toggle, Fire Up The Machine button
     ============================================================ */

  function buildCountdownRing(daysRemaining, totalDays) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'countdown-ring');
    svg.setAttribute('width', '54');
    svg.setAttribute('height', '54');
    svg.setAttribute('viewBox', '0 0 44 44');

    const bg = document.createElementNS(SVG_NS, 'circle');
    bg.setAttribute('cx', '22');
    bg.setAttribute('cy', '22');
    bg.setAttribute('r', '18');
    bg.setAttribute('fill', 'none');
    bg.setAttribute('stroke', '#E8E0CE');
    bg.setAttribute('stroke-width', '3');
    svg.appendChild(bg);

    const circ = 2 * Math.PI * 18;
    const ratio = totalDays > 0 ? Math.max(0, Math.min(1, daysRemaining / totalDays)) : 0;
    const offset = circ * (1 - ratio);

    const fg = document.createElementNS(SVG_NS, 'circle');
    fg.setAttribute('cx', '22');
    fg.setAttribute('cy', '22');
    fg.setAttribute('r', '18');
    fg.setAttribute('fill', 'none');
    fg.setAttribute('stroke', '#C8341A');
    fg.setAttribute('stroke-width', '3');
    fg.setAttribute('stroke-dasharray', circ.toFixed(2));
    fg.setAttribute('stroke-dashoffset', offset.toFixed(2));
    fg.setAttribute('stroke-linecap', 'round');
    fg.setAttribute('transform', 'rotate(-90 22 22)');
    svg.appendChild(fg);

    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('x', '22');
    txt.setAttribute('y', '26');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-family', "'Courier New', monospace");
    txt.setAttribute('font-weight', 'bold');
    txt.setAttribute('font-size', '14');
    txt.setAttribute('fill', '#1A1705');
    txt.textContent = String(daysRemaining);
    svg.appendChild(txt);

    return svg;
  }

  function buildPulley(spinClass) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'belt-pulley');
    svg.setAttribute('viewBox', '0 0 14 14');
    const g = window.OB_GEARS.buildGear(7, 7, {
      teeth: 8,
      outerR: 5.5,
      innerR: 4,
      bodyFill: '#1A1705',
      accentFill: '#C8341A',
      hubFill: '#FAF6EE',
      spokeHoles: 0,
      showTick: false,
      spinClass: spinClass,
    });
    svg.appendChild(g);
    return svg;
  }

  function buildChain(streakCount) {
    const wrap = el('div', { class: 'chain' });
    // Show last 7 done + today + 2 future = 10 total
    const done = Math.max(0, Math.min(7, streakCount - 1));
    const empties = 10 - done - 1;
    for (let i = 0; i < done; i++) wrap.appendChild(el('div', { class: 'chain-link done' }));
    if (streakCount > 0) wrap.appendChild(el('div', { class: 'chain-link today' }));
    else wrap.appendChild(el('div', { class: 'chain-link' }));
    for (let i = 0; i < empties; i++) wrap.appendChild(el('div', { class: 'chain-link' }));
    return wrap;
  }

  function renderDashboard() {
    const S = window.OB_STORE.state;
    const root = $('screen-dashboard');
    root.innerHTML = '';

    // Countdown
    const today = window.OB_STORE.todayISO();
    const examDate = S.examDate || window.OB_STORE.defaultExamDate();
    const daysRemaining = Math.max(0, window.OB_STORE.daysBetween(today, examDate));
    const totalSpan = Math.max(daysRemaining, 14);

    const c = window.OB_STORE.counts();

    const countdownSection = el('div', { class: 'section' }, [
      el('div', { class: 'label-sm', text: 'Days until exam' }),
      (() => {
        const row = el('div', { class: 'countdown-row' });
        row.appendChild(buildCountdownRing(daysRemaining, totalSpan));
        row.appendChild(el('div', { class: 'countdown-text' }, [
          el('div', { class: 'big-num', text: String(daysRemaining) }),
          el('div', { class: 'sub-num', text: 'days remaining' }),
        ]));
        const right = el('div', { class: 'q-left-block' });
        right.appendChild(el('div', { class: 'sub-num', text: 'questions left' }));
        const numNode = el('div', { class: 'q-left-num' });
        numNode.innerHTML = `${c.remaining}<span class="denom">/${c.total}</span>`;
        right.appendChild(numNode);
        row.appendChild(right);
        return row;
      })(),
    ]);
    root.appendChild(countdownSection);

    // Streak
    const streakSection = el('div', { class: 'section' }, [
      el('div', { class: 'label-sm', text: 'Streak' }),
      buildChain(S.streak.count || 0),
      el('div', { class: 'chain-sub', text: `${S.streak.count || 0} day${S.streak.count === 1 ? '' : 's'} - keep the chain going` }),
    ]);
    root.appendChild(streakSection);

    // Today's session belt
    const dailyDone = S.daily.done || 0;
    const dailyMore = Math.max(0, 5 - dailyDone);
    const beltSection = el('div', { class: 'section' });
    beltSection.appendChild(el('div', { class: 'label-sm', text: "Today's session" }));
    const sessionLine = el('div', { class: 'session-text' });
    if (dailyDone < 5) {
      sessionLine.innerHTML = `Completed <strong>${dailyDone}/5</strong> today - ${dailyMore} more for your daily set`;
    } else {
      sessionLine.innerHTML = `Daily set complete - <strong>${dailyDone}</strong> answered today`;
    }
    beltSection.appendChild(sessionLine);

    const beltWrap = el('div', { class: 'belt-wrap' });
    beltWrap.appendChild(buildPulley('gear-pulley'));
    const track = el('div', { class: 'belt-track' });
    const car = el('div', { class: 'belt-car' });
    const totalAnswered = c.answered;
    const beltRatio = c.total > 0 ? Math.min(1, totalAnswered / c.total) : 0;
    // Place car: account for car width 26px + track inset
    car.style.left = `calc(${(beltRatio * 100).toFixed(2)}% - ${(beltRatio * 28).toFixed(2)}px + 1px)`;
    track.appendChild(car);
    beltWrap.appendChild(track);
    beltWrap.appendChild(buildPulley('gear-pulley-rev'));
    beltSection.appendChild(beltWrap);

    const scale = el('div', { class: 'belt-scale' }, [
      el('span', { text: '0' }),
      el('span', { text: '5 daily' }),
      el('span', { text: `${c.total} total` }),
    ]);
    beltSection.appendChild(scale);
    root.appendChild(beltSection);

    // Mode toggle
    const modeSection = el('div', { class: 'section' });
    modeSection.appendChild(el('div', { class: 'label-sm', text: 'Level' }));
    const toggle = el('div', { class: 'mode-toggle' });
    [['SL', 'SL only'], ['both', 'SL + HL'], ['HL', 'HL only']].forEach(([val, label]) => {
      const btn = el('button', {
        type: 'button',
        class: 'mode-btn' + (S.mode === val ? ' active' : ''),
        'data-mode': val,
        text: label,
        onclick: () => {
          S.mode = val;
          window.OB_STORE.persistAll();
          renderDashboard();
        },
      });
      toggle.appendChild(btn);
    });
    modeSection.appendChild(toggle);
    root.appendChild(modeSection);

    // Display toggle - Machine vs Reader (font + size mode)
    const dispSection = el('div', { class: 'section' });
    dispSection.appendChild(el('div', { class: 'label-sm', text: 'Display' }));
    const dispToggle = el('div', { class: 'mode-toggle' });
    [['machine', 'Machine'], ['reader', 'Reader']].forEach(([val, label]) => {
      const btn = el('button', {
        type: 'button',
        class: 'mode-btn' + ((S.display || 'machine') === val ? ' active' : ''),
        'data-display': val,
        text: label,
        onclick: () => {
          S.display = val;
          window.OB_STORE.persistAll();
          window.OB_STORE.applyDisplay();
          renderDashboard();
        },
      });
      dispToggle.appendChild(btn);
    });
    dispSection.appendChild(dispToggle);
    root.appendChild(dispSection);

    // Buttons
    const btnSection = el('div', { class: 'section' });
    const fireBtn = el('button', {
      type: 'button',
      class: 'btn-primary',
      text: dailyDone >= 5 ? '+ MORE QUESTIONS TODAY' : 'FIRE UP THE MACHINE',
      onclick: () => window.OB_APP.startSession(dailyDone >= 5),
    });
    if (c.remaining === 0) {
      fireBtn.disabled = true;
      fireBtn.textContent = 'ALL QUESTIONS DONE';
    }
    btnSection.appendChild(fireBtn);

    if (dailyDone >= 5 && c.remaining > 0) {
      btnSection.appendChild(el('div', {
        class: 'sub-num',
        style: 'text-align:center; margin-top:6px;',
        text: 'Daily set complete - bonus run',
      }));
    }
    root.appendChild(btnSection);
  }

  /* ============================================================
     Question screen - badge, dot progress, stem, four options
     ============================================================ */

  function renderQuestion() {
    const S = window.OB_STORE.state;
    const root = $('screen-question');
    root.innerHTML = '';

    const sess = S.session;
    if (!sess.queue.length || sess.index >= sess.queue.length) {
      // No question to show - bounce to dashboard
      showScreen('dashboard');
      return;
    }

    const q = sess.queue[sess.index];
    const isHL = q.level === 'HL';

    // Top bar with badge, topic, dots
    const topbar = el('div', { class: 'q-topbar' });
    const left = el('div', { class: 'q-topbar-left' });
    left.appendChild(el('span', { class: 'q-badge ' + (isHL ? 'hl' : 'sl'), text: q.level }));
    left.appendChild(el('span', { class: 'q-topic', text: q.topic || '' }));
    topbar.appendChild(left);

    const dotsWrap = el('div', { class: 'q-dots' });
    const totalInSession = Math.min(5, sess.queue.length);
    for (let i = 0; i < totalInSession; i++) {
      dotsWrap.appendChild(el('div', { class: 'dot ' + (i < sess.index ? 'answered' : 'empty') }));
    }
    topbar.appendChild(dotsWrap);
    root.appendChild(topbar);

    // Stem
    root.appendChild(el('div', { class: 'q-stem', text: q.stem }));

    // Options
    const optsWrap = el('div', { class: 'options-list' });
    (q.options || []).forEach((optText) => {
      // Option text usually starts with "A. " - extract letter and rest
      const m = /^([A-D])[\.\)]\s*(.*)$/.exec(optText);
      const letter = m ? m[1] : '';
      const body = m ? m[2] : optText;
      const btn = el('button', {
        type: 'button',
        class: 'option',
        'data-letter': letter,
      }, [
        el('span', { class: 'option-letter', text: letter }),
        el('span', { class: 'option-body', text: body }),
      ]);
      btn.addEventListener('click', () => onOptionClick(btn, letter, q));
      optsWrap.appendChild(btn);
    });
    root.appendChild(optsWrap);
  }

  function onOptionClick(btn, letter, q) {
    const S = window.OB_STORE.state;
    const optsList = btn.parentElement;
    if (optsList.classList.contains('answered')) return;
    optsList.classList.add('answered');

    const isCorrect = letter === q.answer;

    // Mark each option visually
    optsList.querySelectorAll('.option').forEach((el2) => {
      const l = el2.dataset.letter;
      el2.classList.add('locked');
      if (l === q.answer) el2.classList.add('correct');
      else if (el2 === btn && !isCorrect) el2.classList.add('wrong');
    });

    // Trigger gear effects + judder
    if (isCorrect && window.OB_GEARS) window.OB_GEARS.gearsCorrect();
    else if (window.OB_GEARS) {
      window.OB_GEARS.gearsWrong();
      window.OB_GEARS.judderHeader();
    }

    // Record + advance after a short pause so the user sees the colour
    setTimeout(() => {
      window.OB_APP.recordAnswerAndAdvance(q, letter, isCorrect);
    }, 700);
  }

  /* ============================================================
     Answer screen - verdict stamp, distilled explanation,
     "+ more detail" toggle, stats strip, NEXT button
     ============================================================ */

  /**
   * Split an explanation into a lead (1-2 sentences) and a "more" tail.
   * Returns { lead, more } where more may be empty string.
   */
  function distillExplanation(text) {
    if (!text) return { lead: '', more: '' };
    const trimmed = text.trim();
    if (trimmed.length < 160) return { lead: trimmed, more: '' };

    // Prefer paragraph break
    const paraIdx = trimmed.indexOf('\n\n');
    if (paraIdx > 40 && paraIdx < trimmed.length - 30) {
      return {
        lead: trimmed.slice(0, paraIdx).trim(),
        more: trimmed.slice(paraIdx + 2).trim(),
      };
    }

    // Otherwise grab the first 1-2 sentences
    const sentenceRe = /[^.!?]+[.!?]+(?:\s|$)/g;
    const sentences = [];
    let m;
    while ((m = sentenceRe.exec(trimmed)) !== null) sentences.push(m[0]);
    if (sentences.length < 3) return { lead: trimmed, more: '' };

    // Lead = enough sentences to roughly fill 130-200 chars
    let lead = '';
    let i = 0;
    while (i < sentences.length && lead.length < 140) {
      lead += sentences[i];
      i += 1;
    }
    const more = sentences.slice(i).join('').trim();
    return { lead: lead.trim(), more };
  }

  function renderAnswer() {
    const S = window.OB_STORE.state;
    const root = $('screen-answer');
    root.innerHTML = '';

    const last = S.session.results[S.session.results.length - 1];
    if (!last) {
      showScreen('dashboard');
      return;
    }
    const q = last.question;
    const userAnswer = last.userAnswer;
    const isCorrect = last.correct;

    // Stamp
    const stampWrap = el('div', { class: 'stamp-wrap' });
    const stamp = el('div', {
      class: 'stamp reveal ' + (isCorrect ? 'correct' : 'wrong'),
      text: isCorrect ? 'CORRECT' : 'WRONG',
    });
    stampWrap.appendChild(stamp);

    const todayCorrect = S.session.results.filter((r) => r.correct).length;
    const totalCorrect = (() => {
      let n = 0;
      for (const id in S.progress) if (S.progress[id] && S.progress[id].correct) n += 1;
      return n;
    })();
    stampWrap.appendChild(el('div', {
      class: 'stamp-sub',
      text: `${isCorrect ? '+1 today' : '+0 today'} - ${totalCorrect} correct overall`,
    }));
    root.appendChild(stampWrap);

    // If wrong, reveal the correct letter
    if (!isCorrect) {
      const correctOpt = (q.options || []).find((o) => /^([A-D])/.test(o) && o[0] === q.answer);
      const correctText = correctOpt ? correctOpt.replace(/^([A-D])[\.\)]\s*/, '') : '';
      const reveal = el('div', { class: 'correct-reveal' });
      reveal.innerHTML = `<strong>${q.answer}</strong> was correct: ${escapeHtml(correctText)}`;
      root.appendChild(reveal);
    }

    // Explanation distillation
    const { lead, more } = distillExplanation(q.explanation || '');
    const explainBox = el('div', { class: 'explain-box' });
    const leadP = el('p', { class: 'lead' });
    leadP.textContent = lead;
    explainBox.appendChild(leadP);

    if (more) {
      const moreP = el('p', { class: 'more' });
      moreP.textContent = more;
      explainBox.appendChild(moreP);
      const toggle = el('button', {
        type: 'button',
        class: 'explain-toggle',
      }, [
        el('span', { class: 'plus-icon' }),
        el('span', { class: 'toggle-label', text: 'MORE DETAIL' }),
      ]);
      toggle.addEventListener('click', () => {
        const expanded = explainBox.classList.toggle('expanded');
        toggle.classList.toggle('expanded', expanded);
        toggle.querySelector('.toggle-label').textContent = expanded ? 'LESS' : 'MORE DETAIL';
      });
      explainBox.appendChild(toggle);
    }
    root.appendChild(explainBox);

    // Stats strip
    const wrongToday = S.session.results.filter((r) => !r.correct).length;
    const remaining = Math.max(0, S.session.queue.length - S.session.index);
    const stats = el('div', { class: 'stats-strip' }, [
      el('div', { class: 'stat-cell green' }, [
        el('div', { class: 'num', text: String(todayCorrect) }),
        el('div', { class: 'lbl', text: 'correct today' }),
      ]),
      el('div', { class: 'stat-cell red' }, [
        el('div', { class: 'num', text: String(wrongToday) }),
        el('div', { class: 'lbl', text: 'missed today' }),
      ]),
      el('div', { class: 'stat-cell' }, [
        el('div', { class: 'num', text: String(remaining) }),
        el('div', { class: 'lbl', text: 'to go' }),
      ]),
    ]);
    root.appendChild(stats);

    // Next button
    const btnSection = el('div', { class: 'section' });
    const isLast = remaining === 0;
    btnSection.appendChild(el('button', {
      type: 'button',
      class: 'btn-primary',
      text: isLast ? 'SEE TODAY\'S OUTPUT' : 'NEXT QUESTION',
      onclick: () => window.OB_APP.advanceFromAnswer(),
    }));
    root.appendChild(btnSection);
  }

  /* ============================================================
     Synopsis screen - typewriter terminal, weak spots, queue
     ============================================================ */

  function typewriter(node, text, speed) {
    speed = speed || 14;
    node.textContent = '';
    const cursor = el('span', { class: 'cursor-blink' });
    node.appendChild(cursor);
    let i = 0;
    const len = text.length;
    const tick = () => {
      if (i >= len) return;
      // Insert next char, supporting bold markers <b>...</b>
      const ch = text[i];
      i += 1;
      cursor.insertAdjacentText('beforebegin', ch);
      if (i < len) setTimeout(tick, speed);
    };
    tick();
  }

  function renderSynopsis() {
    const S = window.OB_STORE.state;
    const root = $('screen-synopsis');
    root.innerHTML = '';

    const results = S.session.results;
    const correctCount = results.filter((r) => r.correct).length;
    const total = results.length;
    const streakNum = S.streak.count || 0;

    // Score header (matches main header style)
    const header = el('div', { class: 'synopsis-header' });
    header.appendChild(el('div', { class: 'label', text: "Today's output" }));
    const scoreRow = el('div', { class: 'score-row' });
    scoreRow.appendChild(el('span', { class: 'score', text: `${correctCount}/${total}` }));
    scoreRow.appendChild(el('span', { class: 'score-meta', text: `correct - streak: ${streakNum} day${streakNum === 1 ? '' : 's'}` }));
    header.appendChild(scoreRow);
    root.appendChild(header);

    // Terminal
    const termSection = el('div', { class: 'section' });
    termSection.appendChild(el('div', { class: 'label-sm', text: 'Machine analysis' }));
    const term = el('div', { class: 'synopsis-terminal' });
    termSection.appendChild(term);
    root.appendChild(termSection);

    const synopsis = window.OB_APP.buildSynopsis(results);
    setTimeout(() => typewriter(term, synopsis, 12), 200);

    // Weak spots
    const wrongs = results.filter((r) => !r.correct);
    if (wrongs.length > 0) {
      const weakSection = el('div', { class: 'section' });
      weakSection.appendChild(el('div', { class: 'label-sm', text: 'Weak spots to revisit' }));
      const list = el('div', { class: 'weak-list' });
      wrongs.forEach((r) => {
        const item = el('div', { class: 'weak-item' });
        item.appendChild(el('div', { class: 'weak-dot' }));
        const body = el('div', { style: 'flex:1' });
        body.appendChild(el('span', { class: 'weak-id', text: `Q${r.question.id}` }));
        body.appendChild(document.createTextNode(' ' + (r.question.topic || '')));
        item.appendChild(body);
        list.appendChild(item);
      });
      weakSection.appendChild(list);
      root.appendChild(weakSection);
    }

    // Tomorrow's queue
    if (S.weakQueue.length > 0) {
      const queueSection = el('div', { class: 'section' });
      queueSection.appendChild(el('div', { class: 'label-sm', text: "Tomorrow's queue" }));
      const ids = S.weakQueue.slice(0, 6).map((id) => `Q${id}`).join(' - ');
      queueSection.appendChild(el('div', { class: 'queue-list', text: ids }));
      root.appendChild(queueSection);
    }

    // Buttons
    const btnSection = el('div', { class: 'section' });
    const btnRow = el('div', { class: 'btn-row' });
    const remainingPool = window.OB_STORE.counts().remaining;
    const keepBtn = el('button', {
      type: 'button',
      class: 'btn-primary',
      style: 'flex:2; margin-bottom:0;',
      text: 'KEEP GOING',
      onclick: () => window.OB_APP.startSession(true),
    });
    if (remainingPool === 0) {
      keepBtn.disabled = true;
      keepBtn.textContent = 'ALL DONE';
    }
    btnRow.appendChild(keepBtn);
    btnRow.appendChild(el('button', {
      type: 'button',
      class: 'btn-secondary',
      style: 'flex:1;',
      text: 'DONE',
      onclick: () => showScreen('dashboard'),
    }));
    btnSection.appendChild(btnRow);
    root.appendChild(btnSection);
  }

  /* ============================================================
     Papers screen - two practice paper cards (SL, HL)
     ============================================================ */

  function downloadIcon() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'dl-icon');
    svg.setAttribute('viewBox', '0 0 16 16');
    const arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', 'M8 2 v8 M4 7 l4 4 l4 -4 M2 14 h12');
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke', 'currentColor');
    arrow.setAttribute('stroke-width', '1.6');
    arrow.setAttribute('stroke-linecap', 'round');
    arrow.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(arrow);
    return svg;
  }

  const PAPERS = [
    {
      level: 'SL',
      cls: 'sl-card',
      title: 'Obscuro Practice Paper',
      sub: '30 obscure-detail MCQs - SL level',
      file: 'docs/IB_Biology_SL_Obscure_Practice_Paper.docx',
      downloadName: 'IB_Biology_SL_Obscure_Practice_Paper.docx',
    },
    {
      level: 'HL',
      cls: 'hl-card',
      title: 'Obscuro Practice Paper',
      sub: '30 obscure-detail MCQs - HL level',
      file: 'docs/IB_Biology_HL_Obscure_Practice_Paper.docx',
      downloadName: 'IB_Biology_HL_Obscure_Practice_Paper.docx',
    },
  ];

  function renderPapers() {
    const root = $('screen-papers');
    root.innerHTML = '';

    const intro = el('div', { class: 'section' });
    intro.appendChild(el('div', { class: 'label-sm', text: 'Practice papers' }));
    intro.appendChild(el('div', { class: 'session-text', text: 'Detail-focused MCQ practice papers built around the obscure 2023-syllabus specifics. Tap to download.' }));
    root.appendChild(intro);

    const cardSection = el('div', { class: 'section' });
    const row = el('div', { class: 'papers-row' });
    PAPERS.forEach((p) => {
      const card = el('div', { class: 'paper-card ' + p.cls });
      card.appendChild(el('div', { class: 'lvl', text: `${p.level} - Obscuro` }));
      card.appendChild(el('div', { class: 'paper-title', text: p.title }));
      card.appendChild(el('div', { class: 'paper-sub', text: p.sub }));

      const dl = el('div', { class: 'dl-row' });
      const link = el('a', {
        href: p.file,
        download: p.downloadName,
        class: 'dl-link',
      });
      link.appendChild(downloadIcon());
      link.appendChild(document.createTextNode('Download paper'));
      dl.appendChild(link);
      card.appendChild(dl);
      row.appendChild(card);
    });
    cardSection.appendChild(row);
    root.appendChild(cardSection);
  }

  /* ============================================================
     Syllabus screen - search + entries grouped by section,
     tap to expand inline detail panel
     ============================================================ */

  function searchIcon() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'search-icon');
    svg.setAttribute('viewBox', '0 0 16 16');
    const ring = document.createElementNS(SVG_NS, 'circle');
    ring.setAttribute('cx', '7');
    ring.setAttribute('cy', '7');
    ring.setAttribute('r', '4.5');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', 'currentColor');
    ring.setAttribute('stroke-width', '1.5');
    svg.appendChild(ring);
    const handle = document.createElementNS(SVG_NS, 'line');
    handle.setAttribute('x1', '10.5');
    handle.setAttribute('y1', '10.5');
    handle.setAttribute('x2', '14');
    handle.setAttribute('y2', '14');
    handle.setAttribute('stroke', 'currentColor');
    handle.setAttribute('stroke-width', '1.6');
    handle.setAttribute('stroke-linecap', 'round');
    svg.appendChild(handle);
    return svg;
  }

  // Highlight match within text - simple case-insensitive
  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx))
      + '<mark style="background:#FFEFA8;color:inherit;padding:0 2px;border-radius:2px;">'
      + escapeHtml(text.slice(idx, idx + query.length))
      + '</mark>'
      + escapeHtml(text.slice(idx + query.length));
  }

  function renderSyllabus() {
    const S = window.OB_STORE.state;
    const root = $('screen-syllabus');
    root.innerHTML = '';

    const section = el('div', { class: 'section' });

    // Search
    const searchWrap = el('div', { class: 'search-wrap' });
    searchWrap.appendChild(searchIcon());
    const input = el('input', {
      class: 'search-input',
      type: 'search',
      placeholder: 'Search obscure details...',
    });
    searchWrap.appendChild(input);
    section.appendChild(searchWrap);

    const listWrap = el('div', { class: 'syllabus-list' });
    section.appendChild(listWrap);
    root.appendChild(section);

    // Track which entry is open
    let openId = null;

    function renderList(filter) {
      listWrap.innerHTML = '';
      const q = (filter || '').trim().toLowerCase();
      const entries = S.syllabus.filter((e) => {
        if (!q) return true;
        return (
          (e.id || '').toLowerCase().includes(q) ||
          (e.detail || '').toLowerCase().includes(q) ||
          (e.trap || '').toLowerCase().includes(q) ||
          (e.section || '').toLowerCase().includes(q) ||
          (e.ref || '').toLowerCase().includes(q)
        );
      });

      if (entries.length === 0) {
        listWrap.appendChild(el('div', { class: 'empty-state', text: 'No matches. Try a different term.' }));
        return;
      }

      // Group by section
      const sections = {};
      entries.forEach((e) => {
        const k = e.section || 'OTHER';
        (sections[k] = sections[k] || []).push(e);
      });

      Object.keys(sections).forEach((sec) => {
        listWrap.appendChild(el('div', { class: 'syllabus-section-label', text: sec }));
        sections[sec].forEach((e) => {
          const item = el('button', {
            type: 'button',
            class: 'syllabus-item',
          });
          item.appendChild(el('div', { class: 'syllabus-id', text: e.id }));
          const detail = el('div', { class: 'syllabus-detail' });
          detail.innerHTML = highlightMatch(e.detail || '', q);
          if (e.ref) detail.appendChild(el('span', { class: 'syllabus-ref', text: ` ${e.ref}` }));
          item.appendChild(detail);

          item.addEventListener('click', () => {
            const wasOpen = openId === e.id;
            openId = wasOpen ? null : e.id;
            renderList(input.value);
          });

          listWrap.appendChild(item);

          if (openId === e.id) {
            const panel = el('div', { class: 'detail-panel' });
            panel.appendChild(el('div', { class: 'trap-label', text: 'Trap / misconception' }));
            panel.appendChild(el('div', { text: e.trap || '' }));
            listWrap.appendChild(panel);
          }
        });
      });
    }

    input.addEventListener('input', () => renderList(input.value));
    renderList('');
  }

  // Register
  window.OB_RENDERERS = window.OB_RENDERERS || {};
  window.OB_RENDERERS.dashboard = renderDashboard;
  window.OB_RENDERERS.question  = renderQuestion;
  window.OB_RENDERERS.answer    = renderAnswer;
  window.OB_RENDERERS.synopsis  = renderSynopsis;
  window.OB_RENDERERS.papers    = renderPapers;
  window.OB_RENDERERS.syllabus  = renderSyllabus;

  window.OB_SCREENS = { showScreen, $, el, escapeHtml, distillExplanation, typewriter };
})();
