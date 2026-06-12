/* ============================================================
   ANIMATED CORNER ORNAMENT — "Morphing Rorschach Blob"
   ------------------------------------------------------------
   A small black inkblot that restlessly twitches, then snaps to a
   recognizable shape (circle, scalene right triangle, cloud, bell
   curve, eye) in random order, holds ~2s, and melts back into
   free-form blobs. Soft, gooey ink-bleed edges. It loops forever and
   always animates.

   It sits in the upper-left corner, up by the header beside the name. To
   change its size, opacity, or position, edit the --ornament-* variables
   and the #blob-bg rule in styles.css. To remove it entirely, delete the
   <script> tag that loads this file from the HTML pages.

   This file is self-contained: include it once per page with
     <script defer src="assets/blob-bg.js"></script>
   and it creates everything it needs.
   ============================================================ */
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";

  // ----- build the background DOM so each page only needs one <script> -----
  const layer = document.createElement("div");
  layer.id = "blob-bg";
  layer.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  layer.appendChild(canvas);

  // hidden SVG used only for arc-length sampling of shape outlines
  const sampler = document.createElementNS(SVGNS, "svg");
  sampler.setAttribute("viewBox", "0 0 200 200");
  sampler.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";

  function init() {
    document.body.appendChild(layer);
    document.body.appendChild(sampler);
    run();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function run() {
    const ctx = canvas.getContext("2d");

    const N = 96;          // points around the outline
    const C = 100;         // internal coordinate center (200x200 space)
    const BASE_R = 66;     // nominal blob radius

    // ---------- geometry helpers ----------------------------------------

    function signedArea(a) {
      let s = 0;
      for (let i = 0; i < a.length; i++) {
        const p = a[i], q = a[(i + 1) % a.length];
        s += p.x * q.y - q.x * p.y;
      }
      return s / 2;
    }

    function rotateToTop(a) {
      let mi = 0;
      for (let i = 1; i < a.length; i++) if (a[i].y < a[mi].y) mi = i;
      return a.slice(mi).concat(a.slice(0, mi));
    }

    // sample a path 'd' into n evenly-spaced points along its perimeter
    function samplePath(d, n) {
      const p = document.createElementNS(SVGNS, "path");
      p.setAttribute("d", d);
      sampler.appendChild(p);
      const L = p.getTotalLength();
      const arr = [];
      for (let i = 0; i < n; i++) {
        const pt = p.getPointAtLength((L * i) / n);
        arr.push({ x: pt.x, y: pt.y });
      }
      sampler.removeChild(p);
      return arr;
    }

    // an organic, asymmetric Rorschach-ish blob
    function makeBlob() {
      const harm = [];
      const K = 3 + Math.floor(Math.random() * 3); // 3..5 lobes
      for (let k = 0; k < K; k++) {
        harm.push({
          f: 2 + Math.floor(Math.random() * 5),
          a: Math.random() * 0.17,
          p: Math.random() * Math.PI * 2,
        });
      }
      const pts = [];
      for (let i = 0; i < N; i++) {
        const ang = -Math.PI / 2 + (i / N) * Math.PI * 2;
        let r = BASE_R;
        for (const h of harm) r += BASE_R * h.a * Math.sin(h.f * ang + h.p);
        r = Math.max(BASE_R * 0.5, r);
        pts.push({ x: C + r * Math.cos(ang), y: C + r * Math.sin(ang) });
      }
      return pts;
    }

    // reference winding direction taken from a blob
    const DESIRED_SIGN = Math.sign(signedArea(makeBlob()));

    const HN = 64; // points around a hole outline
    const PN = 48; // points around the pupil

    function normPts(d, n) {
      let a = samplePath(d, n);
      if (Math.sign(signedArea(a)) !== DESIRED_SIGN) a.reverse();
      return rotateToTop(a);
    }

    // ---------- the recognizable shapes ---------------------------------

    const CIRCLE = "M28,100 a72,72 0 1 0 144,0 a72,72 0 1 0 -144,0";
    // scalene right triangle — right angle at lower-left, longer leg horizontal
    const RIGHT_TRI = "M28,76 L28,170 L172,170 Z";
    // cloud — large, bumpy top, flat base
    const CLOUD =
      "M42,150 C20,150 16,120 40,114 " +
      "C34,86 74,76 90,100 " +
      "C100,66 150,66 158,100 " +
      "C180,92 192,122 172,138 " +
      "C186,144 180,150 160,150 Z";
    // bell curve — filled normal distribution (central limit theorem)
    const BELL = (function () {
      const x0 = 12, x1 = 188, base = 158, amp = 112, sig = 35;
      const pts = [];
      for (let x = x0; x <= x1; x += 3) {
        const y = base - amp * Math.exp(-((x - 100) ** 2) / (2 * sig * sig));
        pts.push(x.toFixed(1) + "," + y.toFixed(1));
      }
      return "M" + pts[0] + " L" + pts.slice(1).join(" L") +
             " L" + x1 + "," + base + " L" + x0 + "," + base + " Z";
    })();
    // eye — almond lens (outer), iris ring (hole), pupil (black dot)
    const EYE_OUT   = "M26,100 Q100,42 174,100 Q100,158 26,100 Z";
    const EYE_IRIS  = "M64,100 a36,36 0 1 0 72,0 a36,36 0 1 0 -72,0";
    const EYE_PUPIL = "M84,100 a16,16 0 1 0 32,0 a16,16 0 1 0 -32,0";

    const SHAPES = [
      { outer: normPts(CIRCLE, N),    hole: null },
      { outer: normPts(RIGHT_TRI, N), hole: null },
      { outer: normPts(CLOUD, N),     hole: null },
      { outer: normPts(BELL, N),      hole: null },
      { outer: normPts(EYE_OUT, N),   hole: normPts(EYE_IRIS, HN),
        pupil: normPts(EYE_PUPIL, PN) },
    ];
    function collapsedHole() {
      return Array.from({ length: HN }, () => ({ x: C, y: C }));
    }
    function collapsedPupil() {
      return Array.from({ length: PN }, () => ({ x: C, y: C }));
    }

    // ---------- animation state -----------------------------------------

    function clonePts(a) { return a.map((p) => ({ x: p.x, y: p.y })); }
    function newBlobPts() { return rotateToTop(makeBlob()); }

    let display = newBlobPts();
    let target = newBlobPts();
    const draw = clonePts(display);

    let holeDisplay = collapsedHole();
    let holeTarget = collapsedHole();
    const holeDraw = collapsedHole();

    let pupilDisplay = collapsedPupil();
    let pupilTarget = collapsedPupil();
    const pupilDraw = collapsedPupil();

    const KFLOW = 0.055;   // slow organic drift
    const KSNAP = 0.45;    // sudden snap

    let mode = "flow";
    let phaseEnd = 0;
    let flowDur = 1.3;
    let lastReseed = 0;
    let reseedEvery = 0.5;

    // pick shapes in random order with no immediate repeat
    let lastShape = -1;

    function enterFlow(now) {
      mode = "flow";
      flowDur = 2.6 + Math.random() * 1.6;   // longer free-form intermissions
      phaseEnd = now + flowDur;
      target = newBlobPts();
      lastReseed = now;
      reseedEvery = 0.5 + Math.random() * 0.4;
      holeTarget = collapsedHole();
      pupilTarget = collapsedPupil();
    }

    function enterShape(now) {
      mode = "shape";
      phaseEnd = now + 2.0;   // hold ~2s
      let i;
      do { i = Math.floor(Math.random() * SHAPES.length); }
      while (i === lastShape && SHAPES.length > 1);
      lastShape = i;
      target = clonePts(SHAPES[i].outer);
      holeTarget = SHAPES[i].hole ? clonePts(SHAPES[i].hole) : collapsedHole();
      pupilTarget = SHAPES[i].pupil ? clonePts(SHAPES[i].pupil) : collapsedPupil();
    }

    // ---------- twitch noise --------------------------------------------

    // low spatial frequency (neighbors move together) + fast temporal twitch
    function noise(i, t) {
      const a = (i / N) * Math.PI * 2;
      return (
        Math.sin(t * 6.5 + a * 2.0) * 0.6 +
        Math.sin(t * 9.7 + a * 3.0 + 1.3) * 0.4
      );
    }

    // ---------- drawing --------------------------------------------------

    function drawSmooth(pts) {
      const n = pts.length;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n], p1 = pts[i],
              p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
      }
      ctx.closePath();
    }

    // ---------- sizing ---------------------------------------------------

    let cssSize = 130, dpr = 1, scale = 3, blurPx = 2.4;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // size the canvas to the ornament box (set in styles.css), not the viewport
      cssSize = layer.clientWidth || 130;
      canvas.style.width = cssSize + "px";
      canvas.style.height = cssSize + "px";
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      scale = (cssSize * dpr) / 200;
      blurPx = cssSize * dpr * 0.004; // soft gooey edge
    }
    window.addEventListener("resize", resize);
    resize();

    // ---------- render one frame ----------------------------------------

    function render(now) {
      // transparent layer: clear instead of painting a white square, so the
      // page background shows through and there is no hard canvas edge.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.filter = "blur(" + blurPx + "px)";
      ctx.fillStyle = "#000000";
      drawSmooth(draw);
      ctx.fill();

      // punch a white hole (torus / eye iris) — skip when collapsed
      let hr = 0;
      for (let i = 0; i < HN; i++) hr += Math.hypot(holeDraw[i].x - C, holeDraw[i].y - C);
      hr /= HN;
      if (hr > 4) {
        ctx.fillStyle = "#ffffff";
        drawSmooth(holeDraw);
        ctx.fill();
      }

      // black pupil on top (eye)
      let pr = 0;
      for (let i = 0; i < PN; i++) pr += Math.hypot(pupilDraw[i].x - C, pupilDraw[i].y - C);
      pr /= PN;
      if (pr > 4) {
        ctx.fillStyle = "#000000";
        drawSmooth(pupilDraw);
        ctx.fill();
      }
    }

    // ---------- main loop -----------------------------------------------

    let started = 0;
    function frame(ms) {
      const now = ms / 1000;
      if (!started) { started = now; enterFlow(now); }

      // phase machine
      if (now >= phaseEnd) {
        if (mode === "flow") enterShape(now);
        else enterFlow(now);
      }
      if (mode === "flow" && now - lastReseed >= reseedEvery) {
        target = newBlobPts();
        lastReseed = now;
      }

      const k = mode === "shape" ? KSNAP : KFLOW;
      for (let i = 0; i < N; i++) {
        display[i].x += (target[i].x - display[i].x) * k;
        display[i].y += (target[i].y - display[i].y) * k;
      }
      for (let i = 0; i < HN; i++) {
        holeDisplay[i].x += (holeTarget[i].x - holeDisplay[i].x) * k;
        holeDisplay[i].y += (holeTarget[i].y - holeDisplay[i].y) * k;
        holeDraw[i].x = holeDisplay[i].x;
        holeDraw[i].y = holeDisplay[i].y;
      }
      for (let i = 0; i < PN; i++) {
        pupilDisplay[i].x += (pupilTarget[i].x - pupilDisplay[i].x) * k;
        pupilDisplay[i].y += (pupilTarget[i].y - pupilDisplay[i].y) * k;
        pupilDraw[i].x = pupilDisplay[i].x;
        pupilDraw[i].y = pupilDisplay[i].y;
      }

      // twitch (radial jitter) — lively while flowing, nearly still while held
      const amp = mode === "shape" ? 0.5 : 3.0;
      for (let i = 0; i < N; i++) {
        const dx = display[i].x - C, dy = display[i].y - C;
        const len = Math.hypot(dx, dy) || 1;
        const off = noise(i, now) * amp;
        draw[i].x = display[i].x + (dx / len) * off;
        draw[i].y = display[i].y + (dy / len) * off;
      }

      render(now);
      requestAnimationFrame(frame); // always animate
    }
    requestAnimationFrame(frame);
  }
})();
