# Obscuro — UI Design Specification
**IB Biology Obscure Detail Trainer**  
Version 1.0 · Design reference for Claude Code build

---

## Concept

Obscuro is a daily micro-revision tool for IB Biology students (2023 syllabus). It surfaces the specific details — named organisms, precise mechanisms, easy-to-miss terms — that appear in exams but are routinely skipped in teaching. Five questions a day minimum, with local storage persistence, a daily AI synopsis, and a two-week exam countdown.

The visual language is inspired by **Jean Tinguely** — the Swiss kinetic sculptor whose machines were made from industrial scrap, spinning cogs, levers and chain reactions, all assembled with a kind of beautiful purposeful chaos. The interface should feel like a hand-built machine: inky borders, cream paper, mechanical gears that actually interlock and spin, and a typewriter readout for AI feedback.

---

## Design Tokens

### Colour palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--cream` | `#F2EBD9` | Page background |
| `--paper` | `#FAF6EE` | Card / screen surfaces |
| `--ink` | `#1A1705` | All outlines, primary text, header background |
| `--red` | `#C8341A` | Primary actions, correct stamp, streak today, gear axles |
| `--gold` | `#C48A00` | Streak chain (completed days), warning states |
| `--mid` | `#8A7D6A` | Secondary text, muted labels, empty chain links |
| `--light` | `#E8E0CE` | Dividers, inactive backgrounds, belt track |
| `--green` | `#2D6A4F` | Correct answer highlight, CORRECT stamp |

### Typography

```
font-family: 'Courier New', Courier, monospace
```

Used throughout — no exceptions. This gives the stencil/mechanical quality central to the Tinguely aesthetic. If using Google Fonts, `Courier Prime` is an acceptable substitute.

| Use | Size | Weight |
|-----|------|--------|
| OBSCURO wordmark | 24px | bold |
| Screen section labels | 9px | normal, uppercase, letter-spacing 0.1em |
| Question stem | 11px | normal |
| Option text | 10px | normal |
| Big numbers (score, countdown) | 28–30px | bold |
| Body / explanation | 10–11px | normal |
| Synopsis terminal text | 9px | normal |
| Nav tabs | 8px | normal |
| Badges / IDs | 8–9px | bold, uppercase |

### Border style — the "sketch" border

All card and screen borders use a slightly irregular border-radius to simulate a hand-drawn quality:

```css
border: 2.5px solid var(--ink);
border-radius: 3px 5px 4px 6px / 5px 3px 6px 4px;
```

Thinner internal dividers:
```css
border: 1.5px solid var(--ink);
border-radius: 2px 4px 3px 5px / 4px 2px 5px 3px;
```

Dashed dividers between list items:
```css
border-bottom: 1px dashed var(--light);
```

### Spacing

- Page padding: `16px`
- Section internal padding: `10px`
- Section border-bottom: `1.5px solid var(--light)`
- Component gap (grid): `20px`
- Inline gap: `6–8px`

---

## The Gear Machine

The animated gear chain is the central visual motif. It appears in the top header bar on every screen and as a full decorative machine in the dashboard header.

### Gear generation

All gears are drawn as SVG `<polygon>` elements using this function:

```javascript
function gearPoints(cx, cy, teeth, outerR, innerR) {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  const tw = step * 0.32;
  for (let i = 0; i < teeth; i++) {
    const base = i * step;
    pts.push([cx + Math.cos(base - tw) * outerR,              cy + Math.sin(base - tw) * outerR]);
    pts.push([cx + Math.cos(base + tw) * outerR,              cy + Math.sin(base + tw) * outerR]);
    pts.push([cx + Math.cos(base + step/2 - tw*0.4) * innerR, cy + Math.sin(base + step/2 - tw*0.4) * innerR]);
    pts.push([cx + Math.cos(base + step/2 + tw*0.4) * innerR, cy + Math.sin(base + step/2 + tw*0.4) * innerR]);
  }
  return pts.map(p => p.join(',')).join(' ');
}
```

### Gear specifications

| Gear | Teeth | Outer R | Inner R | Period | Direction |
|------|-------|---------|---------|--------|-----------|
| Large | 24 | 42px | 28px | 10s | Clockwise |
| Medium | 16 | 26px | 19px | 6.67s | Counter-CW |
| Small | 10 | 16px | 12px | 4.17s | Clockwise |
| Tiny | 8 | 13px | 10px | 3.33s | Counter-CW |

Periods derived from gear tooth ratios so they mesh correctly:
- Medium = 10 × (16/24) = 6.67s
- Small = 6.67 × (10/16) = 4.17s  
- Tiny = 4.17 × (8/10) = 3.33s

### Gear CSS animations

```css
@keyframes spin-cw   { to { transform: rotate(360deg);  } }
@keyframes spin-ccw  { to { transform: rotate(-360deg); } }
@keyframes gear-wobble {
  0%, 100% { transform: rotate(0deg);  }
  20%      { transform: rotate(4deg);  }
  40%      { transform: rotate(-4deg); }
  60%      { transform: rotate(3deg);  }
  80%      { transform: rotate(-2deg); }
}

.gear-large  { animation: spin-cw   10s   linear infinite; transform-box: fill-box; transform-origin: center; }
.gear-medium { animation: spin-ccw  6.67s linear infinite; transform-box: fill-box; transform-origin: center; }
.gear-small  { animation: spin-cw   4.17s linear infinite; transform-box: fill-box; transform-origin: center; }
.gear-tiny   { animation: spin-ccw  3.33s linear infinite; transform-box: fill-box; transform-origin: center; }
```

### Gear state changes (JS-driven)

```javascript
// On correct answer — speed up all gears for 1.5 seconds
function gearsCorrect() {
  document.querySelectorAll('[class^="gear-"]').forEach(g => {
    const current = parseFloat(getComputedStyle(g).animationDuration);
    g.style.animationDuration = (current / 3) + 's';
    setTimeout(() => g.style.animationDuration = '', 1500);
  });
}

// On wrong answer — wobble all gears once
function gearsWrong() {
  document.querySelectorAll('[class^="gear-"]').forEach(g => {
    g.style.animationName = 'gear-wobble';
    g.style.animationDuration = '0.6s';
    g.style.animationIterationCount = '1';
    setTimeout(() => {
      g.style.animationName = '';
      g.style.animationDuration = '';
      g.style.animationIterationCount = '';
    }, 700);
  });
}
```

### Gear layout in header

```
[LARGE gear] ——rod—— [MEDIUM gear] ——rod—— [SMALL gear] ——rod—— [TINY gear]
      ●                     ●                    ●                    ●
   (red axle)            (red axle)           (red axle)           (red axle)
```

- Gears connected by `<line>` elements, `stroke: var(--ink)`, `stroke-width: 2.5`
- Red circle at each axle: `r=4`, `fill: var(--red)`
- Central hole in each gear: small white circle `fill: var(--paper)` + tiny black dot
- Header background: `var(--ink)` (black bar)
- OBSCURO wordmark to the right of the gear chain, `color: var(--paper)`, 24px bold

---

## Layout Structure

### Overall

```
Max-width: 390px
Centered horizontally: margin: 0 auto
Mobile-first, no horizontal scroll
Min touch target: 44px height
```

### Single-page app structure

```html
<div id="app">
  <div id="screen-dashboard" class="screen">…</div>
  <div id="screen-question"  class="screen hidden">…</div>
  <div id="screen-answer"    class="screen hidden">…</div>
  <div id="screen-synopsis"  class="screen hidden">…</div>
  <div id="screen-papers"    class="screen hidden">…</div>
  <div id="screen-syllabus"  class="screen hidden">…</div>
</div>
<nav id="bottom-nav">…</nav>
```

JS drives all screen transitions via `showScreen(name)` which toggles `.hidden`. No page reloads.

---

## Screen 1 — Dashboard ("The Machine")

### Header bar

Full-width black bar containing:
- Animated SVG gear chain (left)
- OBSCURO wordmark (right), 24px bold, `color: var(--paper)`, letter-spacing 0.15em

### Countdown section

Flex row, gap 8px, `padding: 10px`, `border-bottom: 1.5px solid var(--light)`.

**Circular countdown ring (SVG, 44×44):**
```css
/* background arc */
<circle cx="22" cy="22" r="18" fill="none" stroke="var(--light)" stroke-width="3"/>
/* progress arc */
<circle cx="22" cy="22" r="18" fill="none" stroke="var(--red)" stroke-width="3"
        stroke-dasharray="113"
        stroke-dashoffset="{113 * (1 - daysRemaining/totalDays)}"
        stroke-linecap="round"/>
/* inner number */
<text x="22" y="26" text-anchor="middle" font-size="14" font-weight="bold">14</text>
```

**Text block (beside ring):**
- 28px bold number (days remaining)
- "days remaining" — 9px, `var(--mid)`

**Right-side stats (margin-left: auto):**
- "questions left" — 9px `var(--mid)`
- `143/190` — 16px bold

### Streak section

```css
.chain { display: flex; gap: 3px; flex-wrap: wrap; margin-bottom: 4px; }

.chain-link {
  width: 14px; height: 8px;
  border: 2px solid var(--mid); border-radius: 4px;
  background: transparent;
}
.chain-link.done  { border-color: var(--gold);  background: var(--gold); }
.chain-link.today { border-color: var(--red);   background: var(--red); }
```

Display last 7 days + today + 2 future empty slots = 10 links.

Sub-label: `{n} days · keep the chain going` — 9px `var(--mid)`.

**New link animation** (plays on synopsis screen when streak increments):
```css
@keyframes link-snap {
  0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
  60%  { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1)   rotate(0deg); opacity: 1; }
}
.chain-link.new { animation: link-snap 0.4s ease-out forwards; }
```

### Progress section

Sub-text: `Completed {n}/5 today — {x} more for your daily set`

**Conveyor belt:**
```css
.belt-track {
  height: 12px;
  border: 1.5px solid var(--ink); border-radius: 6px;
  background: var(--light); position: relative; overflow: hidden;
}
.belt-car {
  position: absolute; top: 1px;
  width: 24px; height: 8px;
  background: var(--red); border-radius: 4px;
  transition: left 0.6s ease;
}
```

Car `left` = `(questionsAnsweredTotal / 190) * (trackWidth - 24)` px.

Scale labels: `0` · `5 daily` · `190 total` — 8px `var(--mid)`.

### Mode toggle

```css
.mode-toggle { display: flex; border: 2px solid var(--ink); border-radius: 3px; overflow: hidden; }
.mode-btn    { flex: 1; padding: 6px; font-family: inherit; font-size: 10px;
               font-weight: bold; letter-spacing: 0.08em; background: transparent;
               border: none; cursor: pointer; color: var(--mid); }
.mode-btn.active { background: var(--ink); color: var(--paper); }
```

Three segments: `SL only` · `SL + HL` · `HL only`

### Buttons

```css
.btn-primary {
  display: block; width: 100%;
  background: var(--red); color: var(--paper);
  border: none; padding: 12px;
  font-family: inherit; font-size: 13px; font-weight: bold;
  letter-spacing: 0.14em; text-align: center; cursor: pointer;
  border-radius: 2px 4px 3px 5px / 4px 2px 5px 3px;
  margin-bottom: 6px;
}
.btn-primary:active { transform: scale(0.97); }

.btn-secondary {
  display: block; width: 100%;
  background: transparent; color: var(--ink);
  border: 2px solid var(--ink); padding: 9px;
  font-family: inherit; font-size: 11px;
  letter-spacing: 0.08em; text-align: center; cursor: pointer;
  border-radius: 2px 4px 3px 5px / 4px 2px 5px 3px;
}
```

Primary label: `FIRE UP THE MACHINE`  
Secondary label: `+ more questions today` (only shown if ≥5 done today)

---

## Screen 2 — Question

### Top bar (flex, space-between)

**Left side:**
```css
.badge-hl { background: var(--ink); color: var(--paper); padding: 2px 7px;
            font-size: 8px; font-weight: bold; letter-spacing: 0.1em;
            border: 1.5px solid var(--ink); border-radius: 2px; }
.badge-sl { background: transparent; color: var(--ink); padding: 2px 7px;
            font-size: 8px; font-weight: bold; letter-spacing: 0.1em;
            border: 1.5px solid var(--ink); border-radius: 2px; }
```
Topic tag: 9px `var(--mid)`, no border, beside badge.

**Right side:** 5 dot progress indicators
```css
.dot          { width: 8px; height: 8px; border-radius: 50%; }
.dot.answered { background: var(--red); }
.dot.empty    { background: transparent; border: 1.5px solid var(--mid); }
```

### Question stem

```css
.q-stem {
  font-size: 11px; line-height: 1.6; padding: 10px; margin: 8px 0;
  background: var(--light); border-left: 3px solid var(--ink);
}
```

### Option buttons

```css
.option {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 8px; margin-bottom: 5px;
  border: 1.5px solid var(--ink);
  border-radius: 2px 3px 2px 4px / 3px 2px 4px 2px;
  cursor: pointer; font-size: 10px; line-height: 1.5;
  background: transparent; min-height: 44px;
  transition: background 0.1s, border-color 0.1s;
}
.option:hover   { background: var(--light); }
.option .letter { font-weight: bold; font-size: 12px; min-width: 14px; flex-shrink: 0; }

/* After selection */
.option.correct { background: #E8F5EE; border-color: var(--green); color: var(--green); }
.option.wrong   { background: #FDF0ED; border-color: var(--red);   color: var(--red); }
```

All options get `pointer-events: none` once one is selected.

### Loading spinner (while AI processes)

Small 8-tooth SVG gear, 8px radius, `animation: spin-cw 2s linear infinite`.  
Italic text beside it: `AI explanation loading…` — 9px `var(--mid)`.

---

## Screen 3 — Answer

### Verdict stamp

```css
.stamp-wrap { text-align: center; padding: 12px; }
.stamp {
  display: inline-block; font-size: 26px; font-weight: bold;
  letter-spacing: 0.2em; border: 4px solid; padding: 4px 12px;
  border-radius: 3px; transform: rotate(-3deg);
}
.stamp.correct { color: var(--green); border-color: var(--green); }
.stamp.wrong   { color: var(--red);   border-color: var(--red);   }

@keyframes stamp-in {
  0%   { transform: rotate(-3deg) scale(2);   opacity: 0; }
  60%  { transform: rotate(-3deg) scale(0.9); opacity: 1; }
  100% { transform: rotate(-3deg) scale(1);               }
}
.stamp.reveal { animation: stamp-in 0.35s ease-out forwards; }
```

Sub-label: `+1 today · {total} total` — 9px `var(--mid)`.

### Correct answer reveal (shown only when answer was wrong)

```css
.correct-reveal {
  font-size: 10px; padding: 6px 8px;
  background: #E8F5EE; color: var(--green);
  border-left: 3px solid var(--green); margin-bottom: 6px;
}
```

### Explanation terminal box

```css
.explain-box {
  background: var(--ink); color: var(--paper);
  padding: 10px; margin: 8px 0;
  font-size: 10px; line-height: 1.6;
  font-family: 'Courier New', monospace; border-radius: 2px;
}
.explain-box strong { color: #EF9F27; } /* amber for key terms */
```

### Stats strip

```css
.stats-strip    { display: flex; gap: 6px; }
.stat-cell      { flex: 1; text-align: center; padding: 8px; background: var(--light); border-radius: 3px; }
.stat-cell .num { font-size: 18px; font-weight: bold; }
.stat-cell .lbl { font-size: 8px; color: var(--mid); }
```

Three cells: `correct today` (green) · `wrong today` (red) · `remaining` (ink).

---

## Screen 4 — Synopsis

Displayed automatically after completing 5+ questions in a session.

### Score header (black bar, matches main header)

```
"Today's output"      [9px cream uppercase]
"4/5"                 [30px bold cream]    "correct · streak: 6 days"   [10px mid]
```

### Session analysis terminal

```css
.synopsis-terminal {
  background: var(--ink); color: var(--paper);
  padding: 10px; margin: 8px 0;
  font-size: 9px; line-height: 1.7;
  font-family: 'Courier New', monospace;
}
.cursor-blink {
  display: inline-block; width: 6px; height: 9px;
  background: var(--red); vertical-align: text-bottom;
  animation: blink 0.8s steps(1) infinite;
}
@keyframes blink { 50% { opacity: 0; } }
```

**Synopsis content generation (no API required for base version):**
```javascript
function buildSynopsis(sessionResults) {
  const wrong   = sessionResults.filter(r => !r.correct);
  const correct = sessionResults.filter(r => r.correct);

  let text = `Good run. You nailed: ${correct.map(r => r.topic).join(', ')}.\n\n`;

  if (wrong.length === 0) {
    text += `Clean sweep — all five correct. The machine runs smooth today.`;
  } else {
    text += `${wrong.length} slip${wrong.length > 1 ? 's' : ''}:\n\n`;
    wrong.forEach(r => {
      const keyPoint = r.explanation.split('.')[0] + '.';
      text += `> ${r.topic.toUpperCase()}\n  ${keyPoint}\n  Queued for tomorrow.\n\n`;
    });
  }
  return text;
}
```

**Typewriter render:**
```javascript
function typewriter(el, text, speed = 18) {
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'cursor-blink';
  el.appendChild(cursor);
  let i = 0;
  const t = setInterval(() => {
    el.insertBefore(document.createTextNode(text[i]), cursor);
    if (++i >= text.length) clearInterval(t);
  }, speed);
}
```

### Weak spots list

```css
.weak-item {
  display: flex; gap: 6px; align-items: center;
  padding: 4px 0; font-size: 9px;
  border-bottom: 1px dashed var(--light);
}
.weak-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); flex-shrink: 0; }
```

### Streak animation

When streak increments, the newest chain link animates in with `link-snap`. The entire chain row does a brief `translateX(-3px)` then back, simulating a mechanical click-in.

### Buttons (flex row)

- `KEEP GOING` — `.btn-primary`, `flex: 2`, loads 5 more questions
- `DONE` — `.btn-secondary`, `flex: 1`, returns to dashboard

---

## Screen 5 — Papers

### Card grid

Two rows of 2 cards (`display: flex; gap: 6px; padding: 6px 0`):

| Card | Level colour | Background |
|------|-------------|------------|
| SL Past Papers 2025 | `var(--ink)` | white |
| HL Past Papers 2025 | `var(--ink)` | white |
| SL Obscuro Practice | `#2D6A4F` | `#F5F9F0` |
| HL Obscuro Practice | `#7B1A1A` | `#FDF5F5` |

```css
.paper-card {
  flex: 1; padding: 8px;
  border: 1.5px solid var(--ink);
  border-radius: 3px 5px 4px 6px / 5px 3px 6px 4px;
  font-size: 9px; line-height: 1.6; cursor: pointer;
}
.paper-card .lvl    { font-size: 8px; font-weight: bold; letter-spacing: 0.1em; display: block; margin-bottom: 2px; }
.paper-card .dl-row { font-size: 8px; color: var(--red); margin-top: 6px; display: flex; gap: 8px; }
```

Each card: level badge · paper title · subtitle · `↓ Paper` · `↓ Mark scheme`.

Download links are `<a>` tags — URLs populated by teacher at deploy time.

---

## Screen 6 — Syllabus Details

### Search bar

```css
.search-bar {
  width: 100%; padding: 8px 10px; margin-bottom: 8px;
  border: 1.5px solid var(--ink);
  border-radius: 2px 4px 3px 5px / 4px 2px 5px 3px;
  font-family: inherit; font-size: 11px; background: var(--paper);
}
.search-bar::placeholder { color: var(--mid); font-style: italic; }
```

Filters list in real time on `input` event (case-insensitive match on id + detail text).

### Entry list

```css
.syllabus-item {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 7px 0; border-bottom: 1px dashed var(--light);
  font-size: 9px; line-height: 1.5; cursor: pointer;
}
.syllabus-item:hover { background: var(--light); margin: 0 -10px; padding: 7px 10px; }
.syllabus-id { font-size: 8px; font-weight: bold; color: var(--red); min-width: 44px; flex-shrink: 0; }
```

### Detail panel (inline expand)

```css
.detail-panel {
  background: var(--light); border-left: 3px solid var(--red);
  padding: 8px 10px; margin: 4px 0;
  font-size: 9px; line-height: 1.6;
  display: none; /* toggled by JS */
}
.detail-panel .trap-label {
  font-size: 8px; font-weight: bold; color: var(--red);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px;
}
```

Tap to open/close. Only one panel open at a time (close others on open).

---

## Navigation Bar

```css
.bottom-nav { display: flex; border-top: 2.5px solid var(--ink); background: var(--paper); }
.nav-item {
  flex: 1; text-align: center; padding: 8px 2px 6px;
  font-size: 8px; letter-spacing: 0.05em; color: var(--mid); cursor: pointer;
}
.nav-item.active { color: var(--ink); border-top: 2.5px solid var(--red); margin-top: -2.5px; }
.nav-icon { display: block; margin: 0 auto 3px; width: 16px; height: 16px; }
```

Three tabs — **Machine** (cog SVG) · **Papers** (document SVG) · **Syllabus** (list SVG).

All icons inline SVG 16×16, `stroke: currentColor`, `fill: none`, `stroke-width: 1.5`.

Nav persists across all screens. Active tab updates when `showScreen()` is called.

---

## Local Storage Schema

```javascript
// 'obscuro_progress' — keyed by question id
{
  "CB-01": { seen: true, correct: false, lastSeen: "2025-04-26", timesAnswered: 2 },
  "CB-02": { seen: true, correct: true,  lastSeen: "2025-04-25", timesAnswered: 1 }
}

// 'obscuro_streak'
{ lastDate: "2025-04-26", count: 6 }

// 'obscuro_queue' — weak spots to show first tomorrow
["HO-02", "NS-01", "EC-03"]

// 'obscuro_mode'
"both"  // "SL" | "HL" | "both"

// 'obscuro_exam_date'
"2025-05-10"  // ISO date string

// 'obscuro_setup_done'
true
```

**Helper pattern:**
```javascript
const Store = {
  get: (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};
```

---

## First-Launch Modal

Shown once when `obscuro_setup_done` is absent.

```css
.modal-overlay {
  min-height: 500px; background: rgba(26, 23, 5, 0.85);
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--paper); width: 300px; padding: 20px;
  border: 3px solid var(--ink);
  border-radius: 4px 6px 5px 7px / 6px 4px 7px 5px;
}
```

**Fields:**
1. Date input: "Exam date" — default `today + 14 days`
2. Mode toggle: SL / both / HL

**Submit:** `START THE MACHINE →` — saves all keys, hides modal, shows dashboard.

---

## Session Logic

```javascript
function buildSessionQueue(mode, progress, weakQueue) {
  const pool = ALL_QUESTIONS.filter(q =>
    mode === 'both' ? true : q.level === mode
  );

  // Priority 1: weak spots from yesterday
  const weak   = pool.filter(q => weakQueue.includes(q.id));

  // Priority 2: never seen
  const unseen = pool.filter(q => !progress[q.id]?.seen && !weakQueue.includes(q.id));

  // Priority 3: seen, lowest accuracy first
  const seen   = pool
    .filter(q => progress[q.id]?.seen && !weakQueue.includes(q.id))
    .sort((a, b) => {
      const aAcc = progress[a.id]?.correct ? 1 : 0;
      const bAcc = progress[b.id]?.correct ? 1 : 0;
      return aAcc - bAcc;
    });

  return [...weak, ...unseen, ...seen];
}

function updateStreak(streak) {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (streak.lastDate === today)      return streak;
  if (streak.lastDate === yesterday)  return { lastDate: today, count: streak.count + 1 };
  return { lastDate: today, count: 1 };
}

function recordAnswer(questionId, correct, progress, weakQueue) {
  progress[questionId] = {
    seen: true, correct,
    lastSeen: new Date().toISOString().slice(0, 10),
    timesAnswered: (progress[questionId]?.timesAnswered ?? 0) + 1
  };
  if (!correct && !weakQueue.includes(questionId)) weakQueue.push(questionId);
  return { progress, weakQueue };
}
```

---

## Question Data Structure

```javascript
{
  id: "CB-05",
  level: "HL",              // "SL" or "HL"
  topic: "Microscopy",
  stem: "In 2020, researchers imaged...",
  options: [
    "A. Immunofluorescence microscopy...",
    "B. Gel electrophoresis...",
    "C. Cryogenic electron microscopy (cryo-EM)",
    "D. Confocal laser scanning microscopy"
  ],
  answer: "C",              // single letter
  explanation: "Cryogenic electron microscopy (cryo-EM) involves..."
}
```

The full question bank (50 questions) is in `ib_biology_obscure_reviewer.html` — extract the `QUESTIONS` array verbatim.

---

## File Structure (single HTML)

```
obscuro.html
├── <style>
│   ├── Design tokens (CSS custom properties)
│   ├── Base reset + typography
│   ├── Component styles (sketch borders, buttons, badges, chain, belt)
│   ├── Screen-specific styles
│   └── Animations (spin-cw, spin-ccw, gear-wobble, stamp-in, link-snap, blink)
│
├── <body>
│   ├── .modal-overlay         (first launch, hidden after setup)
│   ├── #screen-dashboard
│   ├── #screen-question
│   ├── #screen-answer
│   ├── #screen-synopsis
│   ├── #screen-papers
│   ├── #screen-syllabus
│   └── #bottom-nav
│
└── <script>
    ├── const ALL_QUESTIONS    (full bank array)
    ├── const SYLLABUS_ITEMS   (47 detail entries)
    ├── const Store            (localStorage helpers)
    ├── function gearPoints()  (SVG polygon generation)
    ├── function gearsCorrect / gearsWrong
    ├── function showScreen(name)
    ├── function buildSessionQueue()
    ├── function recordAnswer()
    ├── function updateStreak()
    ├── function buildSynopsis()
    ├── function typewriter()
    ├── function renderGears()  (call on init)
    └── DOMContentLoaded init
```

---

## Responsive Notes

- Max-width `390px`, `margin: 0 auto`, `padding: 16px`
- Desktop: shows as a centred phone-width column on a cream background
- No `position: fixed` anywhere — bottom nav uses `position: sticky; bottom: 0`
- All interactive elements minimum `44px` height
- No horizontal overflow at any viewport width
- Font minimum `9px` throughout

---

*Single source of truth for the Obscuro build. All decisions here were finalised in the design sketch session and reflected in the rendered mockup. Pass both this file and `ib_biology_obscure_reviewer.html` to Claude Code.*
