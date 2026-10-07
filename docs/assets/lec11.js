/* Lecture 11: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;

  /* ---------- superlevel sets ---------- */
  Book.viz("superlevel", (fig, api) => {
    const g = api.canvas(900, 400);
    const F = {
      wave: { f: (x) => 0.5 + 0.3 * Math.sin(9 * x) + 0.12 * Math.sin(23 * x + 1), name: "wavy f" },
      inc: { f: (x) => (x < 0.35 ? 0.25 * x : x < 0.6 ? 0.45 : x < 0.6 + 1e-9 ? 0.45 : 0.62 + 0.5 * (x - 0.6)), name: "increasing (flat piece + jump)" },
      chi: { f: (x) => ((x >= 0.2 && x <= 0.45) || (x >= 0.6 && x <= 0.8) ? 1 : 0), name: "χ_E, E = [0.2,0.45] ∪ [0.6,0.8]" },
    };
    let key = "wave", a = 0.55;
    const out = api.readout("");
    function draw() {
      const f = F[key].f;
      g.clear(); g.view(0, 1, -0.15, 1.1, 50, 870, 20, 370);
      g.axes({ xt: [[0, 0], [1, 1]], yt: [[1, 1]] });
      const N = 1800; let segs = [], start = null;
      for (let i = 0; i <= N; i++) { const x = i / N, up = f(x) > a; if (up && start === null) start = x; if ((!up || i === N) && start !== null) { segs.push([start, up ? x : (i - 1) / N]); start = null; } }
      segs.forEach(([s0, s1]) => { g.wrect(s0, s1, -0.1, -0.04, C.yellow); g.wrect(s0, s1, a, 1.1, "rgba(245,213,71,.08)"); });
      if (key === "chi") { g.plot(f, 0, 1, C.blue, 3, 1, 4000); }
      else if (key === "inc") { g.plot(f, 0, 0.5999, C.blue, 3.5, 1, 800); g.plot(f, 0.6, 1, C.blue, 3.5, 1, 800); g.circle(g.X(0.6), g.Y(0.45), 5, C.bg, C.blue, 2); g.dot(0.6, 0.62, C.blue, 5); }
      else g.plot(f, 0, 1, C.blue, 3.5, 1, 1500);
      g.wline(0, a, 1, a, C.yellow, 2, [8, 6]);
      g.text("a", g.X(1) + 8, g.Y(a), { size: 20, color: C.yellow });
      let desc = segs.map(([s0, s1]) => `(${s0.toFixed(2)}, ${s1.toFixed(2)})`).join(" ∪ ") || "∅";
      if (key === "chi") desc = a >= 1 ? "∅" : a >= 0 ? "E" : "X = [0,1]";
      if (key === "inc" && segs.length) { const b = segs[0][0]; desc = (Math.abs(b - 0.6) < 2e-3 && a > 0.45 && a < 0.62 ? "[" : "(") + b.toFixed(2) + ", ∞) — a ray"; }
      out.innerHTML = `f<sup>−1</sup>((a, +∞]) = ${desc}`;
    }
    api.select("f:", Object.keys(F).map((k) => [k, F[k].name]), key, (v) => { key = v; draw(); });
    api.slider("a =", -0.1, 1.05, 0.01, a, (v) => { a = v; draw(); }, (v) => v.toFixed(2));
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Explainer: Borel + null ---------- */
  const R0 = (t) => 1 + 0.16 * Math.sin(3 * t + 0.5) + 0.08 * Math.cos(7 * t);
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const dust = []; { const r = rng(7); for (let i = 0; i < 900; i++) { const t = r() * 2 * Math.PI, d = (r() - 0.5) * 0.09; if (r() < 0.55) dust.push([t, 1 + d]); } }
  function shape(g, cx, cy, S, k, fill, stroke, lw = 3, dash) {
    const c = g.ctx; c.save(); if (dash) c.setLineDash(dash); c.beginPath();
    for (let i = 0; i <= 240; i++) { const t = (i / 240) * 2 * Math.PI, r = S * R0(t) * k; const x = cx + r * Math.cos(t), y = cy - r * Math.sin(t) * 0.85; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } c.restore();
  }
  Book.scene("borel-plus-null", {
    draw(g, s) {
      const cx = 560, cy = 390, S = 250;
      const titles = ["E: Lebesgue measurable, with a dusty boundary", "closed Fₖ ⊂ E ⊂ Uₖ open,  μ(Uₖ ∖ Fₖ) < 1/k", "F = ⋃Fₖ (F_σ) ⊂ E ⊂ G = ⋂Uₖ (G_δ),  μ(G∖F) = 0", "E = F ∪ (E∖F),   E∖F ⊂ G∖F  (Borel null)"];
      g.title(titles[s.seg], 1);
      shape(g, cx, cy, S, 0.955, "rgba(245,213,71,.32)");
      const dustCol = s.seg === 3 ? C.red : "rgba(245,213,71,.9)";
      dust.forEach(([t, k]) => { const r = S * R0(t) * k; g.circle(cx + r * Math.cos(t), cy - r * Math.sin(t) * 0.85, s.seg === 3 ? 2.6 : 2, dustCol); });
      if (s.seg >= 1) {
        const gap = s.seg === 1 ? lerp(0.25, 0.12, E.io(s.in(1, 0.2, 0.9))) : s.seg === 2 ? lerp(0.12, 0.05, E.io(s.in(2, 0, 0.7))) : 0.05;
        if (s.seg === 2) for (let j = 1; j <= 4; j++) { const gg = 0.25 / j; shape(g, cx, cy, S, 1 - gg, null, "rgba(131,193,103,.35)", 1.5); shape(g, cx, cy, S, 1 + gg, null, "rgba(88,196,221,.35)", 1.5, [6, 6]); }
        shape(g, cx, cy, S, 1 - gap, s.seg === 3 ? "rgba(131,193,103,.35)" : null, C.green, 3);
        shape(g, cx, cy, S, 1 + gap, null, C.blue, 3, [10, 8]);
        g.text(s.seg >= 2 ? "F" : "Fₖ", cx - 40, cy, { size: 40, color: C.green });
        g.text(s.seg >= 2 ? "G" : "Uₖ", cx + S * 1.25, cy - S * 0.8, { size: 40, color: C.blue });
      }
      if (s.seg === 3) g.text("Lebesgue σ-algebra = completion of the Borel σ-algebra", g.W / 2, 690, { size: 30, align: "center", color: C.yellow, alpha: s.in(3, 0.5, 0.7) });
    },
  });
})();
