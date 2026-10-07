/* Lecture 5: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;

  // intervals surviving after n steps of the middle-thirds construction
  const cantorLevel = (n) => { let I = [[0, 1]]; for (let k = 0; k < n; k++) I = I.flatMap(([a, b]) => { const t = (b - a) / 3; return [[a, a + t], [b - t, b]]; }); return I; };
  // Cantor function, exact enough via ternary digits
  const cantorF = (x, depth = 30) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let y = 0, p = 0.5;
    for (let i = 0; i < depth; i++) { x *= 3; const d = Math.floor(x); x -= d; if (d === 1) return y + p; if (d === 2) y += p; p /= 2; }
    return y;
  };
  // level-n approximation: linear across surviving intervals, flat on removed ones
  const cantorFn = (x, n) => {
    const I = cantorLevel(n), m = I.length;
    for (let i = 0; i < m; i++) { const [a, b] = I[i]; if (x < a) return i / m; if (x <= b) return (i + (x - a) / (b - a)) / m; }
    return 1;
  };
  Book.cantorF = cantorF;

  /* ---------- Cantor set builder ---------- */
  Book.viz("cantor", (fig, api) => {
    const g = api.canvas(900, 440);
    let n = 3, zoom = 0, stair = true;
    const out = api.readout("");
    function draw() {
      const w = Math.pow(3, -zoom);
      g.clear(); g.view(0, w, 0, 1, 50, 870, 30, 410);
      // levels as rows
      for (let k = 0; k <= Math.min(n, 9); k++) {
        const y = 40 + k * 26;
        cantorLevel(Math.min(k, 9)).forEach(([a, b]) => { if (b < 0 || a > w) return; const x1 = g.X(Math.max(a, 0)), x2 = g.X(Math.min(b, w)); g.rect(x1, y, Math.max(1, x2 - x1), 14, k === Math.min(n, 9) ? C.yellow : "rgba(245,213,71,.45)"); });
        g.text(String(k), 30, y + 7, { size: 15, color: C.grey, font: "sans" });
      }
      if (stair) { g.view(0, w, 0, Math.max(cantorF(w), 1e-9), 50, 870, 310, 420); g.plot((x) => cantorFn(x, Math.min(n + zoom, 11)), 0, w, C.green, 2.5, 1, 1200); }
      const rem = 1 - Math.pow(2 / 3, n);
      out.innerHTML = `step n = ${n}: ${Math.pow(2, n)} intervals of length 3<sup>−${n}</sup> · remaining length (2/3)<sup>${n}</sup> = ${Math.pow(2 / 3, n).toFixed(4)} · removed ${rem.toFixed(4)}` + (zoom ? ` · zoomed ×${Math.pow(3, zoom)} into [0, 3<sup>−${zoom}</sup>]` : "");
    }
    api.slider("step n =", 0, 9, 1, n, (v) => { n = v; draw(); });
    api.slider("zoom 3^z, z =", 0, 4, 1, zoom, (v) => { zoom = v; draw(); });
    api.check(" Cantor function", true, (v) => { stair = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- continuity of measure ---------- */
  Book.viz("continuity", (fig, api) => {
    const g = api.canvas(900, 330);
    let mode = "inc", n = 3;
    const sets = { inc: (k) => [-1 + 1 / k, 1 - 1 / k], dec: (k) => [0, 1 / k], bad: (k) => [k, Infinity] };
    const out = api.readout("");
    function draw() {
      g.clear();
      const xr = mode === "bad" ? [-1, 12] : [-1.3, 1.3];
      g.view(xr[0], xr[1], 0, 1, 40, 860, 20, 285);
      for (let k = 1; k <= n; k++) {
        const [a, b] = sets[mode](k), y = 30 + (k - 1) * 26;
        if (y > 260) break;
        const x1 = g.X(Math.max(a, xr[0])), x2 = b === Infinity ? 880 : g.X(Math.min(b, xr[1]));
        g.rect(x1, y, Math.max(2, x2 - x1), 16, `hsla(${200 + k * 9},70%,60%,.85)`);
        if (b === Infinity) g.text("→ ∞", 846, y + 8, { size: 15, color: C.white, font: "sans" });
        g.text(`E${k <= 9 ? "₀₁₂₃₄₅₆₇₈₉"[k] : "ₙ"}`, 12, y + 8, { size: 16, color: C.grey });
      }
      g.axes({ xt: mode === "bad" ? [[0, 0], [5, 5], [10, 10]] : [[-1, -1], [0, 0], [1, 1]], y: false });
      const [a, b] = sets[mode](n);
      const mu = b === Infinity ? "∞" : (b - a).toFixed(4);
      const lim = mode === "inc" ? "μ(⋃Eₙ) = μ((−1,1)) = 2" : mode === "dec" ? "μ(⋂Eₙ) = μ({0}) = 0" : "⋂Eₙ = ∅, μ(∅) = 0 ≠ lim μ(Eₙ) = ∞";
      out.innerHTML = `μ(E<sub>${n}</sub>) = ${mu} &nbsp; · &nbsp; ${lim}`;
    }
    api.select("sequence:", [["inc", "increasing"], ["dec", "decreasing, μ(E₁) < ∞"], ["bad", "decreasing, μ(E₁) = ∞"]], mode, (v) => { mode = v; draw(); });
    api.slider("n =", 1, 60, 1, n, (v) => { n = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Explainer: Cantor set and staircase ---------- */
  Book.scene("cantor-staircase", {
    draw(g, s) {
      const L = 140, R = 1140;
      const X = (x) => L + x * (R - L);
      // construction rows
      const levels = s.seg === 0 ? 0 : s.seg === 1 ? Math.min(6, Math.floor(E.lin(s.p) * 7)) : 6;
      const rowsTop = s.seg >= 4 ? lerp(120, 560, E.io(s.in(4, 0, 0.3))) : 120;
      const rowH = s.seg >= 4 ? lerp(46, 18, E.io(s.in(4, 0, 0.3))) : 46;
      for (let k = 0; k <= levels; k++) {
        const y = rowsTop + k * rowH;
        cantorLevel(k).forEach(([a, b]) => g.rect(X(a), y, Math.max(1.2, X(b) - X(a)), rowH * 0.42, k === levels ? C.yellow : "rgba(245,213,71,.5)"));
      }
      if (s.seg === 0) { g.text("0", X(0), 190, { size: 30, align: "center", color: C.grey }); g.text("1", X(1), 190, { size: 30, align: "center", color: C.grey }); g.title("length 1", s.in(0, 0.2, 0.5)); }
      if (s.seg === 1) g.title("remove 2ⁿ⁻¹ middle thirds of length 3⁻ⁿ", 1);
      if (s.seg === 2) {
        g.title("removed:  1/3 + 2/9 + 4/27 + ⋯ = Σ 2ⁿ⁻¹/3ⁿ = 1", s.in(2, 0, 0.2));
        const tot = 1 - Math.pow(2 / 3, Math.floor(1 + E.lin(s.in(2, 0.2, 0.9)) * 14));
        g.rect(X(0), 520, X(1) - X(0), 30, null, C.grey, 2);
        g.rect(X(0), 520, (X(1) - X(0)) * tot, 30, C.red);
        g.text(`removed length = ${tot.toFixed(5)}`, g.W / 2, 600, { size: 30, align: "center", color: C.red });
        g.text("μ(𝕮) = 0", g.W / 2, 660, { size: 36, align: "center", color: C.yellow, alpha: s.in(2, 0.85, 1) });
      }
      if (s.seg === 3) {
        g.title("points of 𝕮  ↔  infinite L/R choices  ↔  ternary digits 0/2", s.in(3, 0, 0.2));
        // binary tree of choices tracing to a point
        const path = [0, 1, 1, 0, 1, 0]; let a = 0, b = 1;
        for (let k = 0; k < path.length; k++) {
          const t = (b - a) / 3, na = path[k] ? b - t : a, nb = path[k] ? b : a + t;
          const show = E.out(s.in(3, 0.15 + k * 0.12, 0.27 + k * 0.12));
          g.alpha(show, () => {
            g.line((X(a) + X(b)) / 2, 120 + k * 46 + 10, (X(na) + X(nb)) / 2, 120 + (k + 1) * 46 + 10, C.blue, 3);
            g.text(path[k] ? "R·2" : "L·0", (X(na) + X(nb)) / 2 + 14, 120 + (k + 1) * 46 - 2, { size: 22, color: C.blue });
          });
          a = na; b = nb;
        }
        g.text("x = 0.022020…₃  ↦  f(x) = 0.011010…₂", g.W / 2, 600, { size: 34, align: "center", alpha: s.in(3, 0.85, 1) });
      }
      if (s.seg >= 4) {
        const n = s.seg === 4 ? 1 + Math.floor(E.lin(s.in(4, 0.25, 0.95)) * 5) : 12;
        g.view(0, 1, 0, 1, L, R, 70, 520);
        g.axes({ xt: [[0, 0], [1, 1]], yt: [[0.5, "1/2"], [1, 1]], fs: 26 });
        g.plot((x) => (n >= 12 ? cantorF(x) : cantorFn(x, n)), 0, 1, C.green, 4, 1, 1500);
        if (s.seg === 4) g.title("the staircase: flat on every removed interval", s.in(4, 0.1, 0.3));
        if (s.seg === 5) {
          g.title("Cantor function: continuous, 0 → 1, f′ = 0 off a null set", s.in(5, 0, 0.2));
          g.text("∫₀¹ f′ = 0  ≠  f(1) − f(0) = 1", 470, 130, { size: 34, align: "center", color: C.yellow, alpha: s.in(5, 0.5, 0.7) });
        }
      }
    },
  });
})();
