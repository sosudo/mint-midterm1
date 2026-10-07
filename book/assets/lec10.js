/* Lecture 10: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;

  /* ---------- open set as union of compacts ---------- */
  Book.viz("sigma-compact", (fig, api) => {
    const g = api.canvas(900, 440);
    let n = 4;
    const dSlit = (x, y) => (x >= 0.3 && x <= 1 ? Math.abs(y) : Math.min(Math.hypot(x - 0.3, y), Math.hypot(x - 1, y)));
    const inA = (x, y) => { const r = Math.hypot(x, y); return r > 0.3 && r < 1 && !(y === 0 && x > 0); };
    const dComp = (x, y) => { const r = Math.hypot(x, y); return Math.min(r - 0.3, 1 - r, dSlit(x, y)); };
    const W = 450, H = 220, off = document.createElement("canvas"); off.width = W; off.height = H; const o = off.getContext("2d");
    const out = api.readout("");
    function draw() {
      const img = o.createImageData(W, H), thr = 1 / (6 * n);
      let inside = 0, tot = 0;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const x = -2.05 + (4.1 * i) / W, y = 1 - (2 * j) / H; let c = [14, 22, 33];
        if (inA(x, y)) { tot++; c = [60, 72, 92]; if (dComp(x, y) >= thr) { inside++; c = [88, 196, 221]; } }
        const q = (j * W + i) * 4; img.data[q] = c[0]; img.data[q + 1] = c[1]; img.data[q + 2] = c[2]; img.data[q + 3] = 255;
      }
      o.putImageData(img, 0, 0); g.clear(); g.ctx.drawImage(off, 0, 0, 900, 440);
      g.text("A (open)", 20, 40, { size: 22, color: "#8fa3c0", font: "sans" });
      g.text(`Aₙ ∩ [−n, n]² , n = ${n}`, 20, 75, { size: 22, color: C.blue, font: "sans" });
      out.textContent = `compact piece covers ${(100 * inside / tot).toFixed(1)}% of A`;
    }
    api.slider("n =", 1, 60, 1, n, (v) => { n = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Explainer: Prop 6.11 ---------- */
  const rE = (t) => 0.62 + 0.1 * Math.sin(3 * t + 0.4) + 0.06 * Math.cos(5 * t);
  const rV = (t) => rE(t) + 0.14;
  const rK = (t) => rE(t) + 0.035 + 0.075 * Math.sin(4 * t + 1);
  const ring = (g, cx, cy, S, fo, fi, fill, stroke, lw = 3) => {
    const c = g.ctx; c.beginPath();
    for (let i = 0; i <= 240; i++) { const t = (i / 240) * 2 * Math.PI, r = fo(t); const x = cx + S * r * Math.cos(t), y = cy - S * r * Math.sin(t); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath();
    if (fi) { for (let i = 240; i >= 0; i--) { const t = (i / 240) * 2 * Math.PI, r = fi(t); const x = cx + S * r * Math.cos(t), y = cy - S * r * Math.sin(t); i === 240 ? c.moveTo(x, y) : c.lineTo(x, y); } c.closePath(); }
    if (fill) { c.fillStyle = fill; c.fill("evenodd"); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  };
  Book.scene("inner-from-outer", {
    draw(g, s) {
      const cx = 520, cy = 390, S = 330;
      const titles = ["E: measurable, μ(E) < ∞", "V ⊃ E open,  μ(V) < μ(E) + ε", "K ⊂ V compact,  μ(V) < μ(K) + ε   (K may leave E)", "U ⊃ V∖E open,  μ(U) < ε", "C = K ∖ U: compact, C ⊂ E,  μ(C) > μ(E) − 2ε"];
      g.title(titles[s.seg], 1);
      if (s.seg >= 1) g.alpha(E.out(s.in(1, 0, 0.4)), () => ring(g, cx, cy, S, rV, null, "rgba(88,196,221,.18)", C.blue, 3));
      ring(g, cx, cy, S, rE, null, s.seg === 4 ? "rgba(245,213,71,.15)" : "rgba(245,213,71,.35)", C.yellow, 3);
      if (s.seg >= 2 && s.seg < 4) g.alpha(E.out(s.in(2, 0, 0.4)), () => ring(g, cx, cy, S, rK, null, "rgba(131,193,103,.35)", C.green, 3));
      if (s.seg >= 3) g.alpha(s.seg === 3 ? E.out(s.in(3, 0, 0.4)) : 0.5, () => ring(g, cx, cy, S, (t) => rV(t) + 0.02, (t) => rE(t) - 0.025, "rgba(252,98,85,.45)", C.red, 2));
      if (s.seg === 4) {
        const a = E.out(s.in(4, 0.1, 0.5));
        g.alpha(a, () => ring(g, cx, cy, S, (t) => Math.min(rK(t), rE(t) - 0.025), null, "rgba(131,193,103,.6)", C.green, 3));
      }
      // legend
      const L = [["E", C.yellow, 0], ["V", C.blue, 1], ["K", C.green, 2], ["U", C.red, 3], ["C = K∖U", C.green, 4]];
      L.forEach(([t, col, k], i) => { if (s.seg >= k) g.text(t, 1000, 200 + i * 60, { size: 34, color: col }); });
    },
  });
})();
