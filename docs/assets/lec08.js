/* Lecture 8: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;

  /* ---------- measures agreeing on A, B but not on A∩B ---------- */
  Book.viz("pi-counter", (fig, api) => {
    const g = api.canvas(900, 400);
    let t = 0.15, pi = false, slider;
    const out = api.readout("");
    const sets = [["X", [1, 2, 3, 4]], ["A", [1, 2]], ["B", [2, 3]], ["A ∩ B", [2]]];
    function draw() {
      const mu = [0.25, 0.25, 0.25, 0.25], nu = [0.25 + t, 0.25 - t, 0.25 + t, 0.25 - t];
      g.clear();
      // point masses
      for (let i = 0; i < 4; i++) {
        const x = 80 + i * 95;
        g.rect(x, 330 - mu[i] * 500, 34, mu[i] * 500, C.blue);
        g.rect(x + 38, 330 - nu[i] * 500, 34, nu[i] * 500, C.orange);
        g.text(String(i + 1), x + 36, 355, { size: 22, align: "center", color: C.white });
      }
      g.line(60, 330, 450, 330, C.grey, 1.5);
      g.text("μ", 90, 40, { size: 26, color: C.blue }); g.text("νₜ", 130, 40, { size: 26, color: C.orange });
      // set table
      sets.forEach(([name, pts], r) => {
        const y = 80 + r * 70, m = pts.reduce((s, p) => s + mu[p - 1], 0), n = pts.reduce((s, p) => s + nu[p - 1], 0);
        const ok = Math.abs(m - n) < 1e-9;
        g.text(`${name} = {${pts.join(",")}}`, 500, y, { size: 22, color: C.white });
        g.text(`μ = ${m.toFixed(2)}`, 690, y, { size: 22, color: C.blue });
        g.text(`ν = ${n.toFixed(2)}`, 780, y, { size: 22, color: C.orange });
        g.text(ok ? "✓" : "✗", 870, y, { size: 26, color: ok ? C.green : C.red });
      });
      out.textContent = pi ? "𝓔 = {X, A, B, A∩B} is a π-system: agreement on it forces t = 0" : "𝓔 = {X, A, B} is not closed under ∩";
    }
    slider = api.slider("t =", -0.25, 0.25, 0.01, t, (v) => { t = v; draw(); }, (v) => v.toFixed(2));
    api.check(" also require μ(A∩B) = ν(A∩B)", false, (v) => { pi = v; if (v) { t = 0; slider.value = 0; slider.nextSibling.textContent = "0.00"; } slider.disabled = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Explainer: good sets principle ---------- */
  function blob(g, cx, cy, rx, ry, wob, fill, stroke, lw = 3, ph = 0) {
    const c = g.ctx; c.beginPath();
    for (let i = 0; i <= 120; i++) { const a = (i / 120) * 2 * Math.PI, r = 1 + wob * Math.sin(3 * a + ph) + wob * 0.6 * Math.cos(5 * a + ph * 1.7); const x = cx + rx * r * Math.cos(a), y = cy + ry * r * Math.sin(a); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  }
  Book.scene("good-sets", {
    draw(g, s) {
      const cx = 560, cy = 390;
      if (s.seg < 4) {
        blob(g, cx, cy, 520, 290, 0.03, "rgba(138,149,165,.08)", "rgba(138,149,165,.6)", 2);
        g.text("𝓜 (all measurable sets)", cx - 480, cy - 250, { size: 26, color: C.grey, font: "sans" });
        // target sigma(Pi)
        const c = g.ctx; c.save(); c.setLineDash([10, 8]); blob(g, cx - 40, cy + 20, 250, 170, 0.05, null, C.yellow, 3, 1); c.restore();
        g.text("σ(Π) — want μ = ν here", cx - 40, cy - 175, { size: 26, align: "center", color: C.yellow });
        if (s.seg === 0) g.title("Goal: two measures agree on every set of σ(Π)", s.in(0, 0, 0.2));
      }
      if (s.seg >= 1 && s.seg < 4) {
        const a = E.out(s.in(1, 0, 0.3));
        g.alpha(a, () => blob(g, cx + 10, cy + 10, 360, 230, 0.08, "rgba(131,193,103,.12)", C.green, 3, 2.5));
        g.alpha(a, () => g.text("Λ = { A : μ(A) = ν(A) }", cx + 500, cy - 250, { size: 28, align: "right", color: C.green }));
        if (s.seg === 1) {
          const L = ["X ∈ Λ", "A ⊆ B in Λ ⇒ B∖A ∈ Λ  (finite measures subtract)", "Aₙ ↑ in Λ ⇒ ⋃Aₙ ∈ Λ  (continuity from below)"];
          L.forEach((t, i) => g.text(t, 60, 600 + i * 40, { size: 26, color: C.white, alpha: s.in(1, 0.3 + i * 0.18, 0.45 + i * 0.18), font: "sans" }));
          g.title("the good sets form a λ-system", s.in(1, 0.1, 0.3));
        }
      }
      if (s.seg >= 2 && s.seg < 4) {
        const a = E.out(s.in(2, 0, 0.3));
        const r = s.seg === 3 ? lerp(70, 1, E.io(s.in(3, 0.15, 0.7))) : 70;
        if (s.seg === 3) {
          const k = E.io(s.in(3, 0.15, 0.7));
          blob(g, lerp(cx - 120, cx - 40, k), lerp(cy + 40, cy + 20, k), lerp(70, 250, k), lerp(50, 170, k), 0.05, "rgba(245,213,71,.18)", C.yellow, 3, 1);
          g.text("λ(Π) = σ(Π) ⊆ Λ", cx - 40, cy + 20, { size: 36, align: "center", color: C.yellow, alpha: s.in(3, 0.6, 0.8) });
          g.title("Dynkin: λ(Π) is a σ-algebra, so σ(Π) ⊆ Λ", s.in(3, 0, 0.2));
        }
        g.alpha(a * (s.seg === 3 ? 1 - E.io(s.in(3, 0.1, 0.5)) : 1), () => {
          blob(g, cx - 120, cy + 40, 70, 50, 0.04, "rgba(88,196,221,.35)", C.blue, 3, 4);
          for (let i = 0; i < 5; i++) g.rect(cx - 160 + i * 14, cy + 25 + (i % 2) * 14, 26, 18, null, "rgba(236,230,226,.85)", 1.5);
          g.text("Π", cx - 120, cy + 120, { size: 32, align: "center", color: C.blue });
        });
        if (s.seg === 2) g.title("a π-system Π ⊆ Λ (closed under ∩), e.g. rectangles", s.in(2, 0.1, 0.3));
      }
      if (s.seg === 4) {
        g.title("without ∩: agreement on A and B says nothing about A ∩ B", 1);
        const A = [480, 380], B = [700, 380];
        g.circle(A[0], A[1], 170, "rgba(88,196,221,.25)", C.blue, 3);
        g.circle(B[0], B[1], 170, "rgba(255,140,66,.25)", C.orange, 3);
        g.text("A", 360, 230, { size: 36, color: C.blue }); g.text("B", 820, 230, { size: 36, color: C.orange });
        g.text("μ(A) = ν(A) ✓", 380, 620, { size: 28, align: "center", color: C.blue });
        g.text("μ(B) = ν(B) ✓", 800, 620, { size: 28, align: "center", color: C.orange });
        g.text("A ∩ B: ?", 590, 385, { size: 30, align: "center", color: C.red, alpha: s.in(4, 0.3, 0.5) });
      }
    },
  });
})();
