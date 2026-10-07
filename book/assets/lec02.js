/* Lecture 2: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  // rationals in [0,1] ordered by denominator: 0, 1, 1/2, 1/3, 2/3, 1/4, 3/4, ...
  const rats = [];
  for (let q = 1; rats.length < 400; q++) for (let p = 0; p <= q; p++) if (gcd(p, q) === 1) rats.push([p, q]);
  const ratLabel = ([p, q]) => (q === 1 ? String(p) : p + "/" + q);

  /* ---------- f_k -> Dirichlet ---------- */
  Book.viz("fk-rationals", (fig, api) => {
    const g = api.canvas(900, 360);
    let k = 6, lim = false;
    const out = api.readout("");
    function draw() {
      g.clear(); g.view(0, 1, 0, 1.25, 50, 870, 30, 320);
      g.axes({ xt: [[0, 0], [0.5, "1/2"], [1, 1]], yt: [[1, 1]] });
      if (lim) { for (let i = 0; i < 400; i++) g.dot(rats[i][0] / rats[i][1], 1, "rgba(245,213,71,.85)", 2); g.wline(0, 0, 1, 0, "rgba(88,196,221,.7)", 3, [3, 5]); }
      for (let i = 0; i < k; i++) {
        const x = rats[i][0] / rats[i][1];
        g.wline(x, 0, x, 1, C.blue, 2.5); g.dot(x, 1, C.blue, 5);
        if (k <= 14) g.text(ratLabel(rats[i]), g.X(x), g.Y(1) - 18, { size: 16, align: "center", color: C.grey });
      }
      // minimum upper sum with a fine uniform partition (n = 1000): intervals touching a spike
      const n = 1000, touched = new Set();
      for (let i = 0; i < k; i++) { const x = rats[i][0] / rats[i][1], j = Math.round(x * n); if (Math.abs(x * n - j) < 1e-9) { if (j > 0) touched.add(j - 1); if (j < n) touched.add(j); } else touched.add(Math.floor(x * n)); }
      out.innerHTML = `∫₀¹ f<sub>k</sub> = 0 &nbsp;·&nbsp; U(f<sub>k</sub>, P<sub>1000</sub>) = ${(touched.size / n).toFixed(3)}` + (lim ? " &nbsp;·&nbsp; limit f: U(f, P) = 1 for every P" : "");
    }
    api.slider("k =", 1, 120, 1, k, (v) => { k = v; draw(); });
    api.check(" show the limit f", false, (v) => { lim = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- simple functions below f ---------- */
  Book.viz("simple-below", (fig, api) => {
    const g = api.canvas(900, 420);
    let k = 2;
    const f = (x) => 0.55 + 0.32 * Math.sin(5.2 * x + 0.3) + 0.12 * Math.sin(13 * x);
    const out = api.readout("");
    function draw() {
      g.clear(); g.view(0, 1, -0.22, 1.05, 50, 870, 20, 400);
      const L = Math.pow(2, k), N = 900;
      let I = 0, If = 0;
      for (let i = 0; i < N; i++) {
        const x0 = i / N, x1 = (i + 1) / N, v = f((x0 + x1) / 2), lv = Math.floor(v * L) / L, lvl = Math.floor(v * L);
        I += lv / N; If += v / N;
        const col = `hsl(${(lvl * 47) % 360},65%,60%)`;
        g.wrect(x0, x1, 0, lv, col.replace("hsl", "hsla").replace(")", ",.45)"));
        g.wrect(x0, x1, -0.06 - 0.12 * ((lvl % 2) * 0.5), -0.02 - 0.12 * ((lvl % 2) * 0.5), col);
      }
      for (let j = 1; j < L; j++) g.wline(0, j / L, 1, j / L, "rgba(245,213,71,.25)", 1, [4, 6]);
      g.axes({ y: true, xt: [[0, 0], [1, 1]] });
      g.plot(f, 0, 1, C.blue, 3);
      g.text("sets Aᵢ = s⁻¹({aᵢ})", 60, g.Y(-0.17), { size: 16, color: C.grey, font: "sans" });
      out.innerHTML = `${L} levels &nbsp; ∫ s dμ = Σ aᵢ μ(Aᵢ) = ${I.toFixed(4)} &nbsp; ≤ &nbsp; ∫ f = ${If.toFixed(4)}`;
    }
    api.slider("level spacing 2^-k, k =", 0, 7, 1, k, (v) => { k = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Lebesgue–Stieltjes ---------- */
  Book.viz("stieltjes", (fig, api) => {
    const g = api.canvas(900, 430);
    const f = (x) => (x < 0 ? 0 : x < 1 ? 0.6 * x * x : x < 2 ? 1.2 : 1.2 + 0.7 * (x - 2) * (x - 2) / (1 + (x - 2)));
    let a = 0.4, b = 1.4, drag = null;
    const out = api.readout("");
    function draw() {
      g.clear(); g.view(-0.5, 3, -0.15, 2.2, 90, 870, 20, 380);
      g.axes({ xt: [[0, 0], [1, 1], [2, 2], [3, 3]] });
      // graph with jump at 1
      g.plot(f, -0.5, 0.9999, C.blue, 3.5, 1, 300); g.plot(f, 1, 3, C.blue, 3.5, 1, 300);
      g.circle(g.X(1), g.Y(0.6), 5, C.bg, C.blue, 2); g.dot(1, 1.2, C.blue, 5);
      // interval (a,b]
      g.wline(a, 0, b, 0, C.yellow, 6);
      g.circle(g.X(a), g.Y(0), 7, C.bg, C.yellow, 2.5); g.dot(b, 0, C.yellow, 7);
      g.wline(a, 0, a, f(a), "rgba(245,213,71,.5)", 1.5, [4, 4]); g.wline(b, 0, b, f(b), "rgba(245,213,71,.5)", 1.5, [4, 4]);
      g.wline(-0.5, f(a), a, f(a), "rgba(245,213,71,.5)", 1.5, [4, 4]); g.wline(-0.5, f(b), b, f(b), "rgba(245,213,71,.5)", 1.5, [4, 4]);
      g.line(g.X(-0.42), g.Y(f(a)), g.X(-0.42), g.Y(f(b)), C.yellow, 8);
      g.text("ρ((a,b]) = f(b) − f(a)", g.X(-0.38), (g.Y(f(a)) + g.Y(f(b))) / 2, { size: 18, color: C.yellow });
      g.text("a", g.X(a), g.Y(0) + 26, { size: 20, align: "center", color: C.yellow }); g.text("b", g.X(b), g.Y(0) + 26, { size: 20, align: "center", color: C.yellow });
      out.innerHTML = `length b − a = ${(b - a).toFixed(3)} &nbsp; · &nbsp; ρ((a,b]) = f(b) − f(a) = <b>${(f(b) - f(a)).toFixed(3)}</b>` + (a < 1 && b >= 1 && b - a < 0.25 ? " &nbsp;← mostly the jump: μ*_f({1}) = 0.6" : "");
    }
    api.drag(g, (px, py, t) => {
      const x = clamp(g.iX(px), -0.5, 3);
      if (t === "down") drag = Math.abs(x - a) < Math.abs(x - b) ? "a" : "b";
      if (t === "up") drag = null;
      if (drag && (t === "down" || t === "drag")) { if (drag === "a") a = Math.min(x, b); else b = Math.max(x, a); draw(); }
    });
    api.button("shrink to {1}", () => { let t0 = null; const a0 = a, b0 = b; const stop = api.animate((t) => { if (t0 === null) t0 = t; const u = E.io((t - t0) / 1.5); a = lerp(a0, 0.98, u); b = lerp(b0, 1, u); draw(); if (u >= 1) stop(); }); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Hausdorff dimension ---------- */
  function gamma(z) { // Lanczos
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1; const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    let x = c[0]; for (let i = 1; i < 9; i++) x += c[i] / (z + i);
    const t = z + 7.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  const alpha = (s) => Math.pow(Math.PI, s / 2) / gamma(s / 2 + 1);
  Book.alpha = alpha;
  Book.viz("hausdorff", (fig, api) => {
    const g = api.canvas(900, 420);
    let set = "seg", ld = -1, s = 1;
    const out = api.readout("");
    const H = (set, d, s) => {
      if (set === "seg") { const k = Math.ceil(1 / d); return k * alpha(s) * Math.pow(1 / (2 * k), s); }
      if (set === "sq") { const m = Math.ceil(Math.SQRT2 / d); return m * m * alpha(s) * Math.pow(Math.SQRT2 / (2 * m), s); }
      return s === 0 ? 5 : 0; // five points covered by singletons
    };
    function draw() {
      const d = Math.pow(10, ld);
      g.clear();
      // left: the set and its cover
      g.view(-0.1, 1.1, -0.1, 1.1, 30, 380, 30, 380);
      if (set === "seg") {
        const k = Math.ceil(1 / d), show = Math.min(k, 160);
        for (let i = 0; i < show; i++) { const c = (i + 0.5) / k; g.circle(g.X(c), g.Y(0.5), (g.X(1 / (2 * k)) - g.X(0)), "rgba(88,196,221,.15)", "rgba(88,196,221,.8)", 1); }
        g.wline(0, 0.5, 1, 0.5, C.yellow, 3);
      } else if (set === "sq") {
        const m = Math.ceil(Math.SQRT2 / d), h = 1 / m;
        if (m <= 60) for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) g.wrect(i * h, (i + 1) * h, j * h, (j + 1) * h, "rgba(88,196,221,.12)", "rgba(88,196,221,.7)", 1);
        g.wrect(0, 1, 0, 1, "rgba(245,213,71,.18)", C.yellow, 2);
      } else {
        [[0.2, 0.3], [0.5, 0.8], [0.8, 0.2], [0.35, 0.6], [0.7, 0.55]].forEach(([x, y]) => { g.dot(x, y, C.yellow, 6); g.circle(g.X(x), g.Y(y), 12, null, "rgba(88,196,221,.8)", 1.5); });
      }
      g.text(`δ = ${d.toPrecision(2)}`, 40, 400, { size: 18, color: C.grey, font: "sans" });
      // right: log10 H^s_delta vs s
      g.view(0, 3, -3, 3, 460, 870, 30, 370);
      g.axes({ xt: [[0, 0], [1, 1], [2, 2], [3, 3]], yt: [[-3, "10⁻³"], [0, "1"], [3, "10³"]] });
      g.text("s", 880, g.Y(-3) + 0, { size: 18, color: C.grey });
      [-0.3, -1, -2, -3].forEach((l, i) => { if (l < ld - 0.01) return; g.plot((ss) => clamp(Math.log10(Math.max(1e-9, H(set, Math.pow(10, l), ss))), -3.2, 3.2), 0, 3, `rgba(138,149,165,${0.25 + i * 0.08})`, 1.5, 1, 300); });
      g.plot((ss) => clamp(Math.log10(Math.max(1e-9, H(set, d, ss))), -3.2, 3.2), 0, 3, C.blue, 3, 1, 300);
      const v = H(set, d, s);
      g.wline(s, -3, s, 3, "rgba(245,213,71,.5)", 1.5, [4, 4]); g.dot(s, clamp(Math.log10(Math.max(1e-9, v)), -3, 3), C.yellow, 6);
      g.text("log₁₀ Hˢ_δ", 470, 18, { size: 16, color: C.grey, font: "sans" });
      out.innerHTML = `Σ α<sub>s</sub>(diam/2)<sup>s</sup> at s = ${s.toFixed(2)}: <b>${v < 1e6 ? v.toPrecision(4) : v.toExponential(2)}</b>`;
    }
    api.select("set:", [["seg", "segment of length 1"], ["sq", "unit square"], ["pts", "five points"]], set, (v) => { set = v; draw(); });
    api.slider("log₁₀ δ", -3, 0, 0.01, ld, (v) => { ld = v; draw(); }, (v) => "δ = " + Math.pow(10, v).toPrecision(2));
    api.slider("s =", 0, 3, 0.01, s, (v) => { s = v; draw(); }, (v) => v.toFixed(2));
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Explainer: the eps/2^n trick ---------- */
  Book.scene("eps-over-2n", {
    draw(g, s) {
      const eps = s.seg >= 4 ? lerp(0.6, 0.12, E.io(s.in(4, 0.15, 0.7))) : 0.6;
      g.view(-0.02, 1.02, 0, 1, 90, 900, 80, 640);
      const y0 = g.Y(0) - 20;
      g.title(s.seg < 5 ? "μ*(ℚ ∩ [0,1]) = ?" : "Same trick: countable subadditivity", 1);
      if (s.seg < 5) {
        // number line
        g.line(g.X(0), y0, g.X(1), y0, C.white, 2.5);
        g.text("0", g.X(0), y0 + 24, { size: 28, align: "center" }); g.text("1", g.X(1), y0 + 24, { size: 28, align: "center" });
        const shown = s.seg === 0 ? 0 : s.seg === 1 ? Math.floor(E.lin(s.p) * 12) : 60;
        for (let i = 0; i < Math.min(shown, 60); i++) {
          const x = rats[i][0] / rats[i][1];
          g.circle(g.X(x), y0, i < 12 ? 5 : 3, C.yellow);
          if (i < 8 && s.seg === 1) g.text("r" + "₁₂₃₄₅₆₇₈"[i], g.X(x), y0 - 22, { size: 27, align: "center", color: C.yellow });
        }
        if (s.seg >= 2) {
          const nShow = s.seg === 2 ? Math.floor(1 + E.lin(s.p) * 11) : 12;
          for (let n = 1; n <= nShow; n++) {
            const x = rats[n - 1][0] / rats[n - 1][1], w = eps / Math.pow(2, n);
            const row = y0 - 40 - (n - 1) * 38;
            const col = `hsl(${190 + n * 14},70%,62%)`;
            g.line(g.X(x - w / 2), row, g.X(x + w / 2), row, col, 14);
            g.line(g.X(x), row + 6, g.X(x), y0 - 4, "rgba(255,255,255,.15)", 1, [3, 4]);
            if (n <= 5) g.text(`ε/2${"¹²³⁴⁵"[n - 1]}`, g.X(x + w / 2) + 10, row, { size: 27, color: col });
          }
        }
        // running total
        if (s.seg >= 3) {
          const n = s.seg === 3 ? 1 + Math.floor(E.lin(s.p * 1.3) * 11) : 12;
          let tot = 0; for (let i = 1; i <= n; i++) tot += eps / Math.pow(2, i);
          const X0 = 980, W = 230, top = 200;
          g.text("total length", X0, top - 40, { size: 28, font: "sans", color: C.grey });
          g.rect(X0, top, W, 26, null, C.grey, 1.5);
          g.rect(X0, top, (W * tot) / 0.6, 26, C.blue);
          g.line(X0 + (W * eps) / 0.6, top - 8, X0 + (W * eps) / 0.6, top + 34, C.yellow, 3);
          g.text("ε", X0 + (W * eps) / 0.6, top + 52, { size: 32, align: "center", color: C.yellow });
          g.text("ε/2 + ε/4 + ε/8 + ⋯", X0, top + 100, { size: 32 });
          g.text("= ε", X0, top + 135, { size: 32, color: C.yellow });
        }
        if (s.seg === 4) {
          g.text("μ*(ℚ ∩ [0,1]) ≤ ε  for every ε > 0", g.W / 2, 690, { size: 30, align: "center", alpha: s.in(4, 0.1, 0.3) });
          g.text("⇒ = 0", 1100, 690, { size: 30, align: "center", color: C.yellow, alpha: s.in(4, 0.7, 0.85) });
          g.text("(Jordan: stuck at 1)", 1000, 360, { size: 28, color: C.grey, alpha: s.in(4, 0.85, 1), font: "sans" });
        }
      } else {
        const lines = [
          ["For each n choose a cover of Eₙ with", C.white],
          ["Σₖ ρ(Eₙ,ₖ) ≤ μ*(Eₙ) + ε/2ⁿ", C.blue],
          ["All covers together cover ⋃ Eₙ (countably many pieces):", C.white],
          ["μ*(⋃ Eₙ) ≤ Σₙ Σₖ ρ(Eₙ,ₖ) ≤ Σₙ μ*(Eₙ) + ε", C.yellow],
        ];
        lines.forEach(([t, c], i) => g.text(t, g.W / 2, 200 + i * 90, { size: i % 2 ? 36 : 26, align: "center", color: c, alpha: s.in(5, i * 0.18, i * 0.18 + 0.15), font: i % 2 ? undefined : "sans" }));
      }
    },
  });
})();
