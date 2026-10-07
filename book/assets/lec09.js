/* Lecture 9: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const rats = []; for (let q = 1; rats.length < 300; q++) for (let p = 0; p <= q; p++) if (gcd(p, q) === 1) rats.push(p / q);
  const IV = [[0.08, 0.27], [0.42, 0.5], [0.66, 0.9]];
  const muE = IV.reduce((s, [a, b]) => s + b - a, 0);
  const merge = (L) => { L = L.map(([a, b]) => [Math.max(0, a), Math.min(1, b)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]); const out = []; for (const I of L) { if (out.length && I[0] <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], I[1]); else out.push([...I]); } return out; };
  const openU = (eps) => merge([...IV.map(([a, b]) => [a - eps, b + eps]), ...rats.map((r, n) => [r - eps / Math.pow(2, n + 2), r + eps / Math.pow(2, n + 2)])]);
  const compK = (eps) => IV.map(([a, b]) => [a + eps, b - eps]).filter(([a, b]) => b > a);
  const len = (L) => L.reduce((s, [a, b]) => s + b - a, 0);

  function drawRows(g, eps, show, X0, X1, y0) {
    const X = (x) => X0 + x * (X1 - X0);
    const row = (L, y, col, h = 18) => L.forEach(([a, b]) => g.rect(X(a), y, Math.max(1.2, X(b) - X(a)), h, col));
    if (show.U) { row(openU(eps), y0, "rgba(88,196,221,.85)"); g.text("U (open)", X0 - 14, y0 + 9, { size: 20, align: "right", color: C.blue, font: "sans" }); }
    // E itself: intervals + rational dust
    row(IV, y0 + 50, C.yellow);
    rats.slice(0, 120).forEach((r) => g.rect(X(r) - 0.6, y0 + 50, 1.2, 18, "rgba(245,213,71,.7)"));
    g.text("E", X0 - 14, y0 + 59, { size: 20, align: "right", color: C.yellow, font: "sans" });
    if (show.K) { row(compK(eps), y0 + 100, C.green); g.text("K (compact)", X0 - 14, y0 + 109, { size: 20, align: "right", color: C.green, font: "sans" }); }
    g.line(X0, y0 + 140, X1, y0 + 140, C.grey, 1.5);
    g.text("0", X0, y0 + 160, { size: 18, align: "center", color: C.grey }); g.text("1", X1, y0 + 160, { size: 18, align: "center", color: C.grey });
  }

  Book.viz("regularity", (fig, api) => {
    const g = api.canvas(900, 300);
    let eps = 0.03;
    const out = api.readout("");
    function draw() {
      g.clear(); drawRows(g, eps, { U: true, K: true }, 150, 870, 40);
      out.innerHTML = `μ(K) = ${len(compK(eps)).toFixed(4)} ≤ μ(E) = ${muE.toFixed(4)} ≤ μ(U) ≈ ${len(openU(eps)).toFixed(4)}`;
    }
    api.slider("ε =", 0.001, 0.06, 0.001, eps, (v) => { eps = v; draw(); }, (v) => v.toFixed(3));
    fig.querySelector(".controls").append(out);
    draw();
  });

  Book.scene("regular-hull", {
    draw(g, s) {
      const eps = s.seg === 3 ? lerp(0.05, 0.003, E.io(s.in(3, 0.1, 0.8))) : 0.05;
      g.title(["E = intervals ∪ (ℚ ∩ [0,1])", "outer approximation: open U ⊃ E", "inner approximation: compact K ⊂ E", "B = ⋂ Uₙ (a G_δ set): Borel, ⊇ E, same measure"][s.seg], 1);
      g.ctx.save(); g.ctx.scale(1.3, 1.3);
      drawRows(g, eps, { U: s.seg >= 1, K: s.seg >= 2 }, 150, 900, 150);
      g.ctx.restore();
      const t = [`μ(E) = ${muE.toFixed(3)}`];
      if (s.seg >= 1) t.push(`μ(U) ≈ ${len(openU(eps)).toFixed(3)}`);
      if (s.seg >= 2) t.push(`μ(K) = ${len(compK(eps)).toFixed(3)}`);
      g.text(t.join("    "), g.W / 2, 620, { size: 32, align: "center", color: C.white });
      if (s.seg === 3) g.text(`ε = ${eps.toFixed(3)}`, g.W / 2, 670, { size: 28, align: "center", color: C.grey });
    },
  });
})();
