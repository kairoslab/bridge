/* ============================================================
   ANIMATED CORNER ORNAMENT — "Morphing Rorschach Blob"
   ------------------------------------------------------------
   A small black inkblot that restlessly twitches, then snaps to a
   recognizable shape (circle, scalene right triangle, cloud, bell
   curve, ginkgo leaf, "Holdingpen", eye) in random order, holds ~2s,
   and melts back into free-form blobs. Soft, gooey ink-bleed edges. It
   loops forever and always animates.

   It sits in the upper-right corner, up by the header. To change its size,
   opacity, or position, edit the --ornament-* variables and the #blob-bg
   rule in styles.css. To remove it entirely, delete the <script> tag that
   loads this file from the HTML pages.

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

    // ginkgo leaf — fan with central notch and trailing stem (traced)
    const GINKGO = "M88.4,25.8 L91.7,26.3 L95.0,27.7 L97.9,30.1 L99.8,33.4 L100.7,36.7 L101.2,40.0 L101.7,43.3 L101.7,46.7 L102.1,50.0 L102.6,53.3 L104.0,50.9 L104.5,47.6 L104.5,44.3 L105.5,41.0 L105.9,37.6 L107.3,34.3 L108.8,31.0 L111.6,28.2 L114.9,26.7 L118.3,26.3 L121.6,27.2 L124.9,28.6 L128.2,30.1 L131.5,30.5 L134.9,32.0 L137.7,34.3 L139.1,37.6 L141.0,41.0 L144.3,43.3 L147.7,43.8 L151.0,43.8 L154.3,44.3 L157.6,45.7 L160.5,48.6 L162.4,51.9 L162.8,55.2 L162.4,58.5 L162.4,61.8 L165.7,63.3 L169.0,64.2 L171.8,66.6 L172.8,69.9 L172.3,73.2 L173.3,76.5 L176.6,78.9 L178.0,82.2 L178.0,85.5 L177.5,88.9 L176.1,92.2 L173.3,95.5 L169.9,97.4 L166.6,98.8 L163.3,99.8 L160.0,100.7 L156.7,100.7 L153.3,101.2 L150.0,101.2 L146.7,101.2 L143.4,101.2 L140.1,101.2 L136.7,101.7 L133.4,102.1 L130.1,103.1 L126.8,104.0 L123.5,105.0 L120.2,106.4 L116.8,108.8 L113.5,110.7 L110.7,113.5 L107.3,116.8 L105.5,120.2 L105.0,123.5 L104.0,126.8 L104.0,130.1 L104.0,133.4 L103.6,136.7 L103.6,140.1 L103.6,143.4 L103.6,146.7 L103.6,150.0 L103.6,153.3 L103.6,156.7 L103.6,160.0 L103.6,163.3 L104.5,166.6 L105.5,169.9 L104.5,172.8 L101.2,174.2 L97.9,172.8 L97.4,169.5 L98.3,166.1 L98.8,162.8 L99.3,159.5 L98.8,156.2 L99.3,152.9 L99.8,149.6 L99.8,146.2 L99.3,142.9 L99.8,139.6 L99.8,136.3 L99.8,133.0 L99.8,129.6 L99.8,126.3 L99.3,123.0 L98.3,119.7 L96.4,116.4 L93.1,113.0 L90.3,110.2 L87.0,108.3 L83.6,105.9 L80.3,105.0 L77.0,104.0 L73.7,103.1 L70.4,102.6 L67.0,102.1 L63.7,101.7 L60.4,101.7 L57.1,101.7 L53.8,101.7 L50.4,101.7 L47.1,101.7 L43.8,101.2 L40.5,100.7 L37.2,99.8 L33.9,99.3 L30.5,97.9 L27.2,96.0 L24.4,92.7 L22.5,89.3 L22.0,86.0 L22.5,82.7 L23.4,79.4 L24.8,76.1 L28.2,73.7 L29.1,70.8 L29.6,67.5 L31.5,64.2 L34.8,62.3 L38.1,61.8 L38.6,58.5 L38.1,55.2 L39.1,51.9 L41.4,49.0 L44.8,47.1 L48.1,46.7 L51.4,46.2 L54.7,46.2 L57.6,44.3 L59.0,41.0 L59.9,37.6 L62.3,34.8 L65.6,32.9 L68.9,32.4 L72.3,32.9 L75.6,32.4 L78.9,30.1 L81.7,28.2 L85.1,26.3 Z";
    // "Holdingpen" — hand gripping a tall spire, cut off at base (traced)
    const HOLDINGPEN = "M85.2,22.0 L86.0,24.0 L86.0,26.7 L86.9,29.0 L88.1,31.6 L88.4,34.2 L88.6,36.8 L89.5,39.2 L89.8,41.8 L91.3,43.8 L91.3,46.4 L91.3,49.1 L91.6,51.7 L91.6,54.3 L91.6,56.9 L91.9,59.5 L91.9,62.2 L91.9,64.8 L91.9,67.4 L92.1,70.0 L94.8,70.6 L97.4,71.8 L99.7,74.4 L100.9,77.0 L101.5,79.6 L102.3,81.7 L104.9,81.7 L107.6,82.0 L110.2,82.8 L112.5,85.2 L114.6,87.8 L116.3,90.4 L117.5,93.0 L118.9,95.6 L120.4,98.3 L121.8,100.9 L123.6,103.5 L125.0,106.1 L127.1,108.7 L128.8,111.4 L130.9,114.0 L132.6,116.6 L134.1,119.2 L136.4,121.5 L138.4,124.2 L140.5,126.8 L142.2,129.4 L143.7,132.0 L144.5,134.6 L145.1,137.3 L145.4,139.9 L145.1,142.5 L145.1,145.1 L144.8,147.7 L144.8,150.4 L144.8,153.0 L144.8,155.6 L144.8,158.2 L144.8,160.8 L144.5,163.4 L144.2,166.1 L144.2,168.7 L143.9,171.3 L143.7,173.9 L143.4,176.5 L141.9,178.0 L139.3,178.0 L136.7,178.0 L134.1,178.0 L131.4,178.0 L128.8,178.0 L126.2,178.0 L123.6,178.0 L121.0,178.0 L118.3,178.0 L115.7,178.0 L113.1,178.0 L110.5,178.0 L107.9,178.0 L105.2,178.0 L102.6,178.0 L100.0,178.0 L97.4,178.0 L94.8,178.0 L92.1,178.0 L89.5,178.0 L86.9,178.0 L84.3,178.0 L81.7,178.0 L79.0,178.0 L76.4,178.0 L73.8,178.0 L71.2,178.0 L68.6,178.0 L65.9,178.0 L63.3,178.0 L60.7,178.0 L58.1,178.0 L55.5,178.0 L54.9,176.0 L54.9,173.3 L54.9,170.7 L55.2,168.1 L55.8,165.5 L56.6,162.9 L58.1,160.2 L60.1,157.6 L61.9,155.0 L63.3,152.7 L65.7,150.1 L64.8,149.5 L62.2,150.9 L59.5,151.2 L56.9,150.1 L55.2,147.4 L54.6,144.8 L55.2,142.2 L55.8,139.6 L56.1,137.0 L56.3,134.3 L56.6,131.7 L57.2,129.1 L57.5,126.5 L57.8,123.9 L58.1,121.2 L58.4,118.6 L60.1,116.3 L58.7,114.3 L57.2,111.6 L56.6,109.0 L58.4,106.4 L60.1,103.8 L62.2,101.2 L64.2,98.5 L66.5,95.9 L68.9,93.3 L71.2,90.7 L73.5,88.1 L76.1,86.9 L77.6,85.2 L77.6,82.5 L78.2,79.9 L79.3,77.3 L80.8,74.7 L80.5,72.1 L80.5,69.4 L80.5,66.8 L80.5,64.2 L80.5,61.6 L80.5,59.0 L80.5,56.3 L80.5,53.7 L80.5,51.1 L80.5,48.5 L80.5,45.9 L80.5,43.2 L82.0,40.9 L81.7,38.3 L83.7,36.3 L83.4,33.6 L84.0,31.0 L84.6,28.4 L85.2,25.8 L85.2,23.2 Z";

    const SHAPES = [
      { outer: normPts(CIRCLE, N),     hole: null },
      { outer: normPts(RIGHT_TRI, N),  hole: null },
      { outer: normPts(CLOUD, N),      hole: null },
      { outer: normPts(BELL, N),       hole: null },
      { outer: normPts(GINKGO, N),     hole: null },
      { outer: normPts(HOLDINGPEN, N), hole: null },
      { outer: normPts(EYE_OUT, N),    hole: normPts(EYE_IRIS, HN),
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
