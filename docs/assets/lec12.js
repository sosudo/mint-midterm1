/* Lecture 12: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;

  // a measurable function with positive and negative parts and an asymptote at x = 0.78
  const f = (x) => 1.1 * Math.sin(7 * x) + 0.6 * Math.sin(17 * x + 0.5) + 0.12 / Math.abs(x - 0.78) - 0.6;
  const sN = (v, n) => {
    if (v >= n) return n;
    if (v < -n) return -n;
    const k = Math.floor(v * Math.pow(2, n)) / Math.pow(2, n);
    return v >= 0 ? k : k + Math.pow(2, -n); // m/2^n for m ≥ 0, (m+1)/2^n for m < 0
  };
  const levelCol = (val, n) => `hsl(${(((val * Math.pow(2, Math.min(n, 4))) % 12) + 12) % 12 * 30},70%,60%)`;

  function drawStair(g, n, show, Y0) {
    const N = 1400;
    // preimage sets under the axis
    if (show.sets) for (let i = 0; i < N; i++) { const x0 = i / N, x1 = (i + 1) / N, v = sN(f((x0 + x1) / 2), n); g.wrect(x0, x1, Y0 - 0.55, Y0 - 0.2, levelCol(v, n)); }
    // staircase
    const c = g.ctx; c.save(); c.strokeStyle = C.orange; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= N; i++) { const x = i / N, v = sN(f(x), n); const px = g.X(x), py = g.Y(v); i ? (c.lineTo(px, g.Y(sN(f((i - 1) / N), n))), c.lineTo(px, py)) : c.moveTo(px, py); }
    c.stroke(); c.restore();
  }

  Book.viz("dyadic-viz", (fig, api) => {
    const g = api.canvas(900, 460);
    let n = 2, sets = true;
    const out = api.readout("");
    function draw() {
      g.clear(); g.view(0, 1, -3.2, 4.2, 50, 870, 20, 440);
      for (let k = -n * Math.pow(2, n); k <= n * Math.pow(2, n) && n <= 4; k++) { const y = k / Math.pow(2, n); if (y >= -3.2 && y <= 4.2) g.wline(0, y, 1, y, "rgba(245,213,71,.12)", 1); }
      g.wline(0, n, 1, n, "rgba(252,98,85,.6)", 1.5, [6, 6]); g.wline(0, -n, 1, -n, "rgba(252,98,85,.6)", 1.5, [6, 6]);
      g.axes({ xt: [[0, 0], [1, 1]], yt: [[-2, -2], [-1, -1], [1, 1], [2, 2], [3, 3], [4, 4]] });
      g.plot(f, 0, 0.7799, C.blue, 3, 1, 900); g.plot(f, 0.7801, 1, C.blue, 3, 1, 400);
      drawStair(g, n, { sets }, -2.4);
      let err = 0; for (let i = 0; i <= 3000; i++) { const v = f(i / 3000); if (Math.abs(v) <= n) err = Math.max(err, Math.abs(v - sN(v, n))); }
      out.innerHTML = `n = ${n}: grid 2<sup>−${n}</sup> = ${Math.pow(2, -n).toFixed(4)}, cap ±${n} · sup|s<sub>n</sub> − f| on {|f| ≤ n} = ${err.toFixed(4)}`;
    }
    api.slider("n =", 0, 8, 1, n, (v) => { n = v; draw(); });
    api.check(" show preimage sets", true, (v) => { sets = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  Book.scene("dyadic", {
    draw(g, s) {
      g.view(0, 1, -3.4, 4.4, 90, 1200, 70, 680);
      const n = s.seg <= 1 ? 1 : s.seg === 2 ? 1 : s.seg === 3 ? Math.min(6, 1 + Math.floor(E.lin(s.in(3, 0.05, 0.95)) * 6)) : 4;
      g.title(["a measurable f (positive, negative, unbounded)", `slabs of height 2⁻ⁿ, capped at ±n  (n = ${n})`, "round toward 0: sₙ is simple", `n = ${n}: |sₙ| ↑ |f|,  error ≤ 2⁻ⁿ where |f| ≤ n`, "we sliced the range: steps live on scattered sets"][s.seg], 1);
      if (s.seg >= 1) {
        const a = s.seg === 1 ? E.out(s.in(1, 0.1, 0.5)) : 1;
        g.alpha(a, () => {
          for (let k = -n * Math.pow(2, n); k <= n * Math.pow(2, n); k++) g.wline(0, k / Math.pow(2, n), 1, k / Math.pow(2, n), "rgba(245,213,71,.18)", 1.5);
          g.wline(0, n, 1, n, C.red, 2.5, [10, 8]); g.wline(0, -n, 1, -n, C.red, 2.5, [10, 8]);
          g.text(`+${n}`, g.X(1) + 12, g.Y(n), { size: 26, color: C.red }); g.text(`−${n}`, g.X(1) + 12, g.Y(-n), { size: 26, color: C.red });
        });
      }
      g.axes({ xt: [[0, 0], [1, 1]], fs: 24, yt: [] });
      g.plot(f, 0, 0.7799, C.blue, 4, s.seg === 0 ? E.io(s.in(0, 0.1, 0.8)) : 1, 900); if (s.seg > 0 || s.p > 0.8) g.plot(f, 0.7801, 1, C.blue, 4, 1, 400);
      if (s.seg >= 2) {
        const a = s.seg === 2 ? E.out(s.in(2, 0.15, 0.6)) : 1;
        g.alpha(a, () => drawStair(g, n, { sets: s.seg === 4 }, -2.6));
      }
      if (s.seg === 4) g.text("A_{m,n} = f⁻¹([m/2ⁿ, (m+1)/2ⁿ))", g.W / 2, 700, { size: 28, align: "center", color: C.white, alpha: s.in(4, 0.3, 0.5) });
    },
  });
})();
