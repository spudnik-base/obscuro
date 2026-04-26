/* ============================================================
   OBSCURO - gear builders, header machine renderer, state effects
   Tinguely-inspired multi-layer gears with cast-iron spoke holes,
   riveted axles, direction notches.
   ============================================================ */

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * Generate the toothed polygon points string for a gear.
   * teeth: number of teeth, outerR: tip radius, innerR: root radius.
   * Uses the same proportions as the design spec for accurate meshing.
   */
  function gearPoints(cx, cy, teeth, outerR, innerR) {
    const pts = [];
    const step = (Math.PI * 2) / teeth;
    const tw = step * 0.32;
    for (let i = 0; i < teeth; i++) {
      const base = i * step;
      pts.push([
        (cx + Math.cos(base - tw) * outerR).toFixed(2),
        (cy + Math.sin(base - tw) * outerR).toFixed(2),
      ]);
      pts.push([
        (cx + Math.cos(base + tw) * outerR).toFixed(2),
        (cy + Math.sin(base + tw) * outerR).toFixed(2),
      ]);
      pts.push([
        (cx + Math.cos(base + step / 2 - tw * 0.4) * innerR).toFixed(2),
        (cy + Math.sin(base + step / 2 - tw * 0.4) * innerR).toFixed(2),
      ]);
      pts.push([
        (cx + Math.cos(base + step / 2 + tw * 0.4) * innerR).toFixed(2),
        (cy + Math.sin(base + step / 2 + tw * 0.4) * innerR).toFixed(2),
      ]);
    }
    return pts.map((p) => p.join(',')).join(' ');
  }

  /**
   * Build a complete multi-layer gear group as an SVG element.
   * Returns an <svg:g> with: toothed body, spoke holes, hub, axle, direction tick.
   *
   * opts:
   *   teeth, outerR, innerR  - gear geometry
   *   bodyFill                - main gear colour (default ink)
   *   accentFill              - highlight colour for axle (default red)
   *   hubFill                 - hub colour (default cream/paper-ish)
   *   spokeHoles              - number of cutout holes around hub (default 5)
   *   showTick                - draw direction notch on one tooth
   *   spinClass               - CSS class to apply for animation
   */
  function buildGear(cx, cy, opts) {
    const {
      teeth = 16,
      outerR = 26,
      innerR = 19,
      bodyFill = '#1A1705',
      accentFill = '#C8341A',
      hubFill = '#F2EBD9',
      spokeHoles = 5,
      showTick = true,
      spinClass = '',
    } = opts || {};

    const g = document.createElementNS(SVG_NS, 'g');
    if (spinClass) g.setAttribute('class', spinClass);

    // Toothed body
    const body = document.createElementNS(SVG_NS, 'polygon');
    body.setAttribute('points', gearPoints(cx, cy, teeth, outerR, innerR));
    body.setAttribute('fill', bodyFill);
    body.setAttribute('stroke', bodyFill);
    body.setAttribute('stroke-width', '0.6');
    body.setAttribute('stroke-linejoin', 'round');
    g.appendChild(body);

    // Cast-iron spoke holes - small circles cut out between hub and teeth
    if (spokeHoles > 0 && innerR > 9) {
      const orbitR = innerR * 0.62;
      const holeR = Math.max(1.4, innerR * 0.13);
      for (let i = 0; i < spokeHoles; i++) {
        const ang = (Math.PI * 2 / spokeHoles) * i - Math.PI / 2;
        const sx = cx + Math.cos(ang) * orbitR;
        const sy = cy + Math.sin(ang) * orbitR;
        const hole = document.createElementNS(SVG_NS, 'circle');
        hole.setAttribute('cx', sx.toFixed(2));
        hole.setAttribute('cy', sy.toFixed(2));
        hole.setAttribute('r', holeR.toFixed(2));
        hole.setAttribute('fill', hubFill);
        g.appendChild(hole);
      }
    }

    // Direction tick - small marker on one tooth so rotation reads as real
    if (showTick) {
      const tickR = outerR * 0.92;
      const tick = document.createElementNS(SVG_NS, 'circle');
      tick.setAttribute('cx', cx);
      tick.setAttribute('cy', (cy - tickR).toFixed(2));
      tick.setAttribute('r', Math.max(1, outerR * 0.07).toFixed(2));
      tick.setAttribute('fill', accentFill);
      g.appendChild(tick);
    }

    // Hub - raised circular center
    const hubR = innerR * 0.32;
    const hub = document.createElementNS(SVG_NS, 'circle');
    hub.setAttribute('cx', cx);
    hub.setAttribute('cy', cy);
    hub.setAttribute('r', hubR.toFixed(2));
    hub.setAttribute('fill', hubFill);
    g.appendChild(hub);

    // Axle outer ring
    const axleOuterR = hubR * 0.6;
    const axleOuter = document.createElementNS(SVG_NS, 'circle');
    axleOuter.setAttribute('cx', cx);
    axleOuter.setAttribute('cy', cy);
    axleOuter.setAttribute('r', axleOuterR.toFixed(2));
    axleOuter.setAttribute('fill', bodyFill);
    g.appendChild(axleOuter);

    // Axle red rivet
    const rivetR = axleOuterR * 0.55;
    const rivet = document.createElementNS(SVG_NS, 'circle');
    rivet.setAttribute('cx', cx);
    rivet.setAttribute('cy', cy);
    rivet.setAttribute('r', rivetR.toFixed(2));
    rivet.setAttribute('fill', accentFill);
    g.appendChild(rivet);

    // Tiny center dot
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', cx);
    dot.setAttribute('cy', cy);
    dot.setAttribute('r', Math.max(0.6, rivetR * 0.35).toFixed(2));
    dot.setAttribute('fill', bodyFill);
    g.appendChild(dot);

    return g;
  }

  /**
   * Build a connecting rod between two pivot points with bolt circles at ends.
   */
  function buildRod(x1, y1, x2, y2, opts) {
    const {
      stroke = '#FAF6EE',
      strokeWidth = 2,
      boltFill = '#C8341A',
      boltR = 2.5,
    } = opts || {};

    const g = document.createElementNS(SVG_NS, 'g');

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', strokeWidth);
    line.setAttribute('stroke-linecap', 'round');
    g.appendChild(line);

    [[x1, y1], [x2, y2]].forEach(([cx, cy]) => {
      const ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', boltR + 0.8);
      ring.setAttribute('fill', stroke);
      g.appendChild(ring);

      const bolt = document.createElementNS(SVG_NS, 'circle');
      bolt.setAttribute('cx', cx);
      bolt.setAttribute('cy', cy);
      bolt.setAttribute('r', boltR);
      bolt.setAttribute('fill', boltFill);
      g.appendChild(bolt);
    });

    return g;
  }

  /**
   * Render the header gear chain into the given SVG element.
   * Three meshing gears (large, medium, small) with connecting rods.
   * Cream-on-ink palette since this sits on the black header bar.
   */
  function renderHeaderMachine(svg) {
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // viewBox is 280 x 44
    // Layout: large gear left, medium center, small right, tiny offset
    const positions = [
      { cx: 22,  cy: 22, teeth: 18, outerR: 18, innerR: 13, spokes: 5, cls: 'gear-large' },
      { cx: 70,  cy: 22, teeth: 13, outerR: 13, innerR: 9.5, spokes: 4, cls: 'gear-medium' },
      { cx: 108, cy: 26, teeth: 10, outerR: 9,  innerR: 6.5, spokes: 3, cls: 'gear-small' },
      { cx: 140, cy: 18, teeth: 8,  outerR: 7,  innerR: 5.2, spokes: 0, cls: 'gear-tiny' },
    ];

    // Draw rods first so gears sit on top
    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i];
      const b = positions[i + 1];
      svg.appendChild(buildRod(a.cx, a.cy, b.cx, b.cy, {
        stroke: '#FAF6EE',
        strokeWidth: 1.6,
        boltFill: '#C8341A',
        boltR: 2,
      }));
    }

    positions.forEach((p) => {
      svg.appendChild(buildGear(p.cx, p.cy, {
        teeth: p.teeth,
        outerR: p.outerR,
        innerR: p.innerR,
        bodyFill: '#FAF6EE',
        accentFill: '#C8341A',
        hubFill: '#1A1705',
        spokeHoles: p.spokes,
        showTick: true,
        spinClass: p.cls,
      }));
    });
  }

  /**
   * Render the boot screen single gear (used while data loads).
   */
  function renderBootGear(group) {
    if (!group) return;
    while (group.firstChild) group.removeChild(group.firstChild);
    const g = buildGear(32, 32, {
      teeth: 14,
      outerR: 26,
      innerR: 19,
      bodyFill: '#C8341A',
      accentFill: '#1A1705',
      hubFill: '#F2EBD9',
      spokeHoles: 5,
      showTick: false,
    });
    group.appendChild(g);
  }

  /* ============================================================
     Gear state effects - speed up on correct, wobble on wrong,
     judder header on wrong answer
     ============================================================ */

  function gearsCorrect() {
    document.querySelectorAll('[class*="gear-"]').forEach((g) => {
      const computed = getComputedStyle(g).animationDuration;
      const cur = parseFloat(computed);
      if (!cur || isNaN(cur)) return;
      g.style.animationDuration = (cur / 3).toFixed(2) + 's';
      setTimeout(() => {
        g.style.animationDuration = '';
      }, 1500);
    });
  }

  function gearsWrong() {
    document.querySelectorAll('[class*="gear-"]').forEach((g) => {
      const original = g.style.animationName;
      g.style.animationName = 'gear-wobble';
      g.style.animationDuration = '0.6s';
      g.style.animationIterationCount = '1';
      setTimeout(() => {
        g.style.animationName = original;
        g.style.animationDuration = '';
        g.style.animationIterationCount = '';
      }, 700);
    });
  }

  function judderHeader() {
    const header = document.getElementById('top-bar');
    if (!header) return;
    header.classList.remove('judder');
    // Force reflow so the animation can replay
    void header.offsetWidth;
    header.classList.add('judder');
    setTimeout(() => header.classList.remove('judder'), 600);
  }

  // Export
  window.OB_GEARS = {
    gearPoints,
    buildGear,
    buildRod,
    renderHeaderMachine,
    renderBootGear,
    gearsCorrect,
    gearsWrong,
    judderHeader,
  };
})();
