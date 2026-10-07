/* Lecture 1: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;

  /* ---------- Riemann lower / upper sums ---------- */
  Book.viz("riemann-sums", (fig, api) => {
    const g = api.canvas(900, 430);
    const fns = {
      wave: { f: (x) => 1.5 + 0.7 * Math.sin(1.7 * x) + 0.35 * Math.sin(4.3 * x + 1), a: 0, b: 4, y1: 3 },
      parab: { f: (x) => 0.25 * x * x + 0.3, a: 0, b: 4, y1: 4.6 },
      jump: { f: (x) => (x < 1.7 ? 0.8 + 0.3 * x : 2.4 - 0.25 * (x - 1.7)), a: 0, b: 4, y1: 3 },
    };
    let key = "wave", n = 6, refine = false;
    const supinf = (f, a, b) => {
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i <= 120; i++) { const y = f(a + ((b - a) * i) / 120); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      return [lo, hi];
    };
    const sums = (F, pts) => {
      let L = 0, U = 0;
      for (let i = 1; i < pts.length; i++) { const [lo, hi] = supinf(F.f, pts[i - 1], pts[i]); L += (pts[i] - pts[i - 1]) * lo; U += (pts[i] - pts[i - 1]) * hi; }
      return [L, U];
    };
    const exact = (F) => { let s = 0; const N = 4000; for (let i = 0; i < N; i++) s += F.f(F.a + ((F.b - F.a) * (i + 0.5)) / N); return (s * (F.b - F.a)) / N; };
    const out = api.readout("");
    function draw() {
      const F = fns[key];
      g.clear(); g.view(F.a - 0.1, F.b + 0.1, 0, F.y1, 50, 870, 20, 390);
      let pts = []; for (let i = 0; i <= n; i++) pts.push(F.a + ((F.b - F.a) * i) / n);
      const coarse = pts.slice();
      if (refine) { const r = []; for (let i = 0; i < n; i++) r.push(pts[i], (pts[i] + pts[i + 1]) / 2); r.push(pts[n]); pts = r; }
      for (let i = 1; i < pts.length; i++) {
        const [lo, hi] = supinf(F.f, pts[i - 1], pts[i]);
        g.wrect(pts[i - 1], pts[i], 0, hi, "rgba(131,193,103,.28)", C.green, 1.5);
        g.wrect(pts[i - 1], pts[i], 0, lo, "rgba(255,170,60,.55)", "#ffb347", 1.5);
      }
      g.axes({ xt: coarse.map((x, i) => [x, n <= 8 ? (i === 0 ? "a" : i === n ? "b" : "x" + subs(i)) : null]) });
      g.fillUnder(F.f, F.a, F.b, "rgba(88,196,221,.0)");
      g.plot(F.f, F.a, F.b, C.blue, 3.5);
      const [L, U] = sums(F, pts), [L0, U0] = sums(F, coarse);
      out.innerHTML = `L = ${L.toFixed(3)} &nbsp; U = ${U.toFixed(3)} &nbsp; U−L = ${(U - L).toFixed(3)} &nbsp; ∫f ≈ ${exact(F).toFixed(3)}` +
        (refine ? `<br>coarse P: L = ${L0.toFixed(3)}, U = ${U0.toFixed(3)} &nbsp;→&nbsp; refined P′: L′ = ${L.toFixed(3)} ≥ L, U′ = ${U.toFixed(3)} ≤ U` : "");
    }
    const subs = (i) => String(i).split("").map((d) => "₀₁₂₃₄₅₆₇₈₉"[d]).join("");
    api.select("f =", [["wave", "wavy"], ["parab", "x²/4 + 0.3"], ["jump", "with a jump"]], key, (v) => { key = v; draw(); });
    api.slider("n =", 1, 60, 1, n, (v) => { n = v; draw(); });
    api.check(" refine (add midpoints)", false, (v) => { refine = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Jordan approximation of a disc ---------- */
  Book.viz("jordan-disc", (fig, api) => {
    const g = api.canvas(900, 460);
    let k = 8;
    const r = 0.8, out = api.readout("");
    function draw() {
      g.clear(); g.view(-1, 1, -1, 1, 220, 680, 10, 450);
      const h = 2 / k; let inner = 0, outer = 0;
      for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
        const x0 = -1 + i * h, y0 = -1 + j * h, x1 = x0 + h, y1 = y0 + h;
        const far = Math.max(Math.hypot(x0, y0), Math.hypot(x1, y0), Math.hypot(x0, y1), Math.hypot(x1, y1));
        const nx = clamp(0, x0, x1), ny = clamp(0, y0, y1), near = Math.hypot(nx, ny);
        if (far <= r) { inner++; outer++; g.wrect(x0, x1, y0, y1, "rgba(88,196,221,.55)", "rgba(14,22,33,.9)", 1); }
        else if (near < r) { outer++; g.wrect(x0, x1, y0, y1, "rgba(255,140,66,.55)", "rgba(14,22,33,.9)", 1); }
        else g.wrect(x0, x1, y0, y1, null, "rgba(138,149,165,.18)", 1);
      }
      g.circle(g.X(0), g.Y(0), g.X(r) - g.X(0), null, C.yellow, 3);
      const A = inner * h * h, B = outer * h * h;
      g.text("μ(A_ε) = " + A.toFixed(3), 30, 60, { size: 22, color: C.blue });
      g.text("μ(B_ε) = " + B.toFixed(3), 30, 95, { size: 22, color: C.orange });
      g.text("gap = " + (B - A).toFixed(3), 30, 130, { size: 22 });
      g.text("πr² = " + (Math.PI * r * r).toFixed(3), 30, 165, { size: 22, color: C.yellow });
      out.textContent = `grid squares of side ${h.toFixed(3)}`;
    }
    api.slider("grid k×k, k =", 2, 80, 1, k, (v) => { k = v; draw(); });
    draw();
  });

  /* ---------- improper integral of 1/sqrt(x) ---------- */
  Book.viz("improper", (fig, api) => {
    const g = api.canvas(900, 400);
    let a = 0.25;
    const f = (x) => 1 / Math.sqrt(x), out = api.readout("");
    function draw() {
      g.clear(); g.view(0, 1.05, 0, 8, 60, 860, 20, 360);
      g.fillUnder(f, a, 1, "rgba(88,196,221,.35)", 300);
      g.axes({ xt: [[0, 0], [1, 1]], yt: [[2, 2], [4, 4], [6, 6]] });
      g.plot(f, 0.0005, 1, C.blue, 3, 1, 900);
      g.wline(a, 0, a, Math.min(8, f(a)), C.yellow, 2, [6, 5]);
      g.text("a", g.X(a), g.Y(0) + 22, { size: 20, align: "center", color: C.yellow });
      const area = 2 - 2 * Math.sqrt(a);
      g.text(`∫ₐ¹ x^(-1/2) dx = 2 − 2√a = ${area.toFixed(4)}`, 480, 80, { size: 26, color: C.white });
      // bar showing the area approaching 2
      g.rect(480, 120, 340, 16, null, C.grey, 1.5); g.rect(480, 120, 340 * area / 2, 16, C.blue);
      g.text("2", 830, 128, { size: 18, color: C.grey });
      out.textContent = `a = ${a.toPrecision(3)}`;
    }
    api.slider("log₁₀ a", -6, 0, 0.01, Math.log10(a), (v) => { a = Math.pow(10, v); draw(); }, (v) => "a = " + Math.pow(10, v).toPrecision(2));
    draw();
  });

  /* ---------- pointwise vs uniform: the spike ---------- */
  Book.viz("spike", (fig, api) => {
    const g = api.canvas(900, 420);
    let n = 3, eps = 0.25, x0 = 0.3;
    const fn = (x) => (Math.abs(x) < 1 / n ? 2 - n * Math.abs(x) : 1);
    const out = api.readout("");
    function draw() {
      g.clear(); g.view(-1, 1, 0, 2.4, 60, 860, 20, 380);
      // epsilon band around f (=1 off zero)
      g.wrect(-1, 1, 1 - eps, 1 + eps, "rgba(245,213,71,.13)");
      g.wline(-1, 1 + eps, 1, 1 + eps, "rgba(245,213,71,.6)", 1.5, [6, 6]);
      g.wline(-1, 1 - eps, 1, 1 - eps, "rgba(245,213,71,.6)", 1.5, [6, 6]);
      g.axes({ xt: [[-1, -1], [-1 / n, "−1/n"], [1 / n, "1/n"], [1, 1]], yt: [[1, 1], [2, 2]] });
      // where |f_n - f| >= eps (x != 0)
      const w = (1 - eps) / n;
      g.wrect(-w, w, 0, 0.06, C.red);
      g.plot((x) => 1, -1, 1, "rgba(245,213,71,.9)", 2);
      g.circle(g.X(0), g.Y(1), 6, C.bg, C.yellow, 2); g.dot(0, 2, C.yellow, 6);
      g.plot(fn, -1, 1, C.blue, 3.5, 1, 2000);
      // probe point
      g.wline(x0, 0, x0, fn(x0), C.green, 2, [4, 4]); g.dot(x0, fn(x0), C.green, 6);
      const n0 = Math.max(1, Math.ceil((1 - eps) / Math.abs(x0)));
      g.text(`sup |fₙ − f| over x≠0 → 1 (never < ε)`, 470, 40, { size: 20, color: C.red });
      g.text(`at x = ${x0.toFixed(2)}: |fₙ(x) − f(x)| < ε once n ≥ ${n0}`, 470, 70, { size: 20, color: C.green });
      out.textContent = "";
    }
    api.slider("n =", 1, 60, 1, n, (v) => { n = v; draw(); });
    api.slider("ε =", 0.05, 0.9, 0.01, eps, (v) => { eps = v; draw(); }, (v) => v.toFixed(2));
    api.slider("probe x =", 0.02, 1, 0.01, x0, (v) => { x0 = v; draw(); }, (v) => v.toFixed(2));
    draw();
  });

  /* ---------- Explainer: Riemann vs Lebesgue ---------- */
  Book.scene("riemann-vs-lebesgue", {
    draw(g, s) {
      const f = (x) => 0.48 + 0.26 * Math.sin(2 * Math.PI * 1.25 * x + 0.4) + 0.12 * Math.sin(2 * Math.PI * 3.1 * x);
      g.view(0, 1, 0, 1.08, 130, 1180, 90, 600);
      const dir = s.seg >= 4;
      // seg 0: axes + curve
      if (!dir) {
        g.axes({ xt: [[0, "a"], [1, "b"]], fs: 28 });
        g.plot(f, 0, 1, C.blue, 4, E.io(s.in(0, 0.1, 0.8)));
        g.text("y = f(x)", g.X(0.86), g.Y(f(0.86)) - 30, { size: 26, color: C.blue, alpha: s.in(0, 0.6, 0.9) });
      }
      // seg 1: Riemann rectangles
      if (s.seg === 1 || (s.seg === 2 && s.p < 0.3)) {
        const fade = s.seg === 2 ? 1 - s.p / 0.3 : 1, N = 14;
        for (let i = 0; i < N; i++) {
          const a = E.out(clamp(s.at(1) * 1.6 - i / N)) * fade;
          const x0 = i / N, x1 = (i + 1) / N, h = f((x0 + x1) / 2);
          g.alpha(a, () => g.wrect(x0, x1, 0, h * clamp(a * 1.2), "rgba(131,193,103,.45)", C.green, 1.5));
        }
        g.title("Riemann: slice the domain", fade * E.out(s.in(1, 0, 0.2)));
      }
      // seg 2-3: Lebesgue bands
      const K = 9, levels = [...Array(K + 1)].map((_, j) => 0.1 + (j * 0.8) / K);
      if (s.seg >= 2 && !dir) {
        const a = E.out(s.in(2, 0.25, 0.6));
        levels.forEach((y, j) => g.alpha(a, () => g.wline(0, y, 1, y, "rgba(245,213,71,.45)", 1.5, [8, 6])));
        g.title("Lebesgue: slice the range", s.seg === 2 ? a : 0);
        // layer cake fill
        const build = s.seg === 2 ? E.io(s.in(2, 0.55, 1)) : 1;
        for (let j = 0; j < K; j++) {
          if (j / K > build) break;
          const lo = levels[j], hi = levels[j + 1];
          let x = 0; const step = 1 / 600;
          while (x < 1) { if (f(x) >= hi) { let x2 = x; while (x2 < 1 && f(x2) >= hi) x2 += step; g.wrect(x, x2, lo, hi, `hsla(${200 + j * 6},70%,60%,.38)`); x = x2; } x += step; }
        }
      }
      if (s.seg === 3) {
        const j = 5, lo = levels[j], hi = levels[j + 1], a = E.out(s.in(3, 0, 0.3));
        g.alpha(a, () => g.wrect(0, 1, lo, hi, "rgba(245,213,71,.22)"));
        // the set {x : lo <= f(x) < hi}
        const step = 1 / 1200; let x = 0;
        while (x < 1) {
          const v = f(x);
          if (v >= lo && v < hi) { let x2 = x; while (x2 < 1 && f(x2) >= lo && f(x2) < hi) x2 += step;
            g.alpha(E.out(s.in(3, 0.15, 0.45)), () => { g.wrect(x, x2, -0.03, -0.005, C.yellow); g.wline(x, 0, x, f(x), "rgba(245,213,71,.5)", 1.5, [4, 4]); g.wline(x2, 0, x2, f(x2), "rgba(245,213,71,.5)", 1.5, [4, 4]); });
            x = x2; }
          x += step;
        }
        g.text("{ x : f(x) in this band }", g.X(0.5), g.Y(0) + 50, { size: 26, align: "center", color: C.yellow, alpha: s.in(3, 0.3, 0.5) });
        g.text("contribution ≈ height × μ({ x : f(x) in band })", g.W / 2, 44, { size: 28, align: "center", alpha: s.in(3, 0.55, 0.75) });
      }
      // seg 4-5: Dirichlet
      if (dir) {
        g.view(0, 1, -0.1, 1.2, 130, 1180, 90, 600);
        g.axes({ xt: [[0, 0], [1, 1]], yt: [[1, 1]], fs: 28 });
        const a = E.out(s.in(4, 0, 0.25));
        const pts = [];
        for (let q = 1; q <= 40; q++) for (let p = 0; p <= q; p++) if (gcd(p, q) === 1) pts.push(p / q);
        g.alpha(a, () => {
          pts.forEach((x) => g.dot(x, 1, C.yellow, 2.2));
          for (let i = 0; i < 700; i++) { const x = (i * 0.61803398875) % 1; g.dot(x, 0, C.blue, 1.6); }
        });
        g.text("f = 1 on ℚ,  0 off ℚ", g.W / 2, 44, { size: 28, align: "center", alpha: a, font: "sans" });
        if (s.seg === 4) {
          const r = E.out(s.in(4, 0.2, 0.45)), N = 8;
          for (let i = 0; i < N; i++) g.alpha(r * (1 - s.in(4, 0.62, 0.7)), () => { g.wrect(i / N, (i + 1) / N, 0, 1, "rgba(131,193,103,.18)", C.green, 1.5); });
          g.text("Riemann:  every L(f,P) = 0,  every U(f,P) = 1", g.W / 2, 660, { size: 28, align: "center", alpha: r * (1 - s.in(4, 0.62, 0.7)), color: C.green });
          g.text("Lebesgue:  ∫ f = 1 · μ(ℚ ∩ [0,1]) + 0 · μ([0,1] \\ ℚ) = 1 · 0 + 0 · 1 = 0", g.W / 2, 660, { size: 28, align: "center", alpha: s.in(4, 0.72, 0.9), color: C.yellow });
        }
        if (s.seg === 5) {
          g.alpha(0.85, () => g.rect(240, 230, 800, 220, "rgba(14,22,33,.92)", C.blue, 2, 16));
          g.text("Step 1: measure sets", g.W / 2, 300, { size: 40, align: "center", alpha: s.in(5, 0, 0.3), color: C.blue });
          g.text("Step 2: integrate by slicing the range", g.W / 2, 380, { size: 40, align: "center", alpha: s.in(5, 0.3, 0.6), color: C.yellow });
        }
      }
    },
  });
  function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
})();
