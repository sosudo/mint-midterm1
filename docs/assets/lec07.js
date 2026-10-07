/* Lecture 7: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ---------- greedy disjoint ball packing ---------- */
  Book.viz("ball-packing", (fig, api) => {
    const g = api.canvas(900, 460);
    const balls = [];
    (function build() {
      const r = rng(2024);
      for (let tries = 0; balls.length < 2500 && tries < 400000; tries++) {
        const x = r(), y = r();
        let d = Math.min(x, y, 1 - x, 1 - y);
        for (const b of balls) { const dd = Math.hypot(x - b[0], y - b[1]) - b[2]; if (dd < d) d = dd; if (d <= 0) break; }
        if (d > 1e-4) balls.push([x, y, d * 0.98]);
      }
    })();
    let k = 30;
    const out = api.readout("");
    function draw() {
      g.clear(); g.view(0, 1, 0, 1, 230, 670, 10, 450);
      g.wrect(0, 1, 0, 1, "rgba(255,140,66,.25)", C.orange, 2);
      let A = 0;
      for (let i = 0; i < k; i++) { const [x, y, r] = balls[i]; A += Math.PI * r * r; g.circle(g.X(x), g.Y(y), g.X(r) - g.X(0), `hsla(${190 + (i * 7) % 60},70%,${55 + (i % 3) * 6}%,.9)`); }
      g.text("U", g.X(0.02), g.Y(0.97), { size: 22, color: C.orange });
      g.text("balls: " + k, 20, 60, { size: 20, color: C.white, font: "sans" });
      g.text("covered " + (100 * A).toFixed(2) + "%", 20, 95, { size: 20, color: C.blue, font: "sans" });
      g.text("uncovered " + (100 * (1 - A)).toFixed(2) + "%", 20, 130, { size: 20, color: C.orange, font: "sans" });
      out.textContent = "";
    }
    api.slider("number of balls", 1, balls.length, 1, k, (v) => { k = v; draw(); });
    draw();
  });

  /* ---------- fractal dimension ---------- */
  Book.viz("fractal-dim", (fig, api) => {
    const g = api.canvas(900, 420);
    const F = {
      cantor: { N: 2, r: 1 / 3, name: "Cantor set" },
      koch: { N: 4, r: 1 / 3, name: "Koch curve" },
      sier: { N: 3, r: 1 / 2, name: "Sierpiński triangle" },
      seg: { N: 2, r: 1 / 2, name: "segment" },
      sq: { N: 4, r: 1 / 2, name: "square" },
    };
    let key = "cantor", n = 4;
    const out = api.readout("");
    function drawFractal() {
      const c = g.ctx, L = 30, R = 410, T = 60, B = 380;
      c.save(); c.strokeStyle = C.yellow; c.fillStyle = C.yellow; c.lineWidth = 1.6;
      if (key === "cantor" || key === "seg") {
        let I = [[0, 1]];
        for (let k = 0; k <= n; k++) {
          const y = T + 30 + k * 40;
          I.forEach(([a, b]) => c.fillRect(L + a * (R - L), y, Math.max(1, (b - a) * (R - L)), 12));
          if (k < n) I = I.flatMap(([a, b]) => { const t = (b - a) * F[key].r; return key === "cantor" ? [[a, a + t], [b - t, b]] : [[a, a + t], [b - t, b]]; });
        }
      } else if (key === "koch") {
        let P = [[0, 0], [1, 0]];
        for (let k = 0; k < n; k++) { const Q = []; for (let i = 0; i + 1 < P.length; i++) { const [x1, y1] = P[i], [x2, y2] = P[i + 1]; const dx = (x2 - x1) / 3, dy = (y2 - y1) / 3; const a = [x1 + dx, y1 + dy], b = [x1 + 2 * dx, y1 + 2 * dy]; const m = [a[0] + dx / 2 - (dy * Math.sqrt(3)) / 2, a[1] + dy / 2 + (dx * Math.sqrt(3)) / 2]; Q.push([x1, y1], a, m, b); } Q.push(P[P.length - 1]); P = Q; }
        c.beginPath(); P.forEach(([x, y], i) => { const px = L + x * (R - L), py = B - 60 - y * (R - L); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke();
      } else if (key === "sier") {
        const tri = (ax, ay, bx, by, cx, cy, k) => {
          if (k === 0) { c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.closePath(); c.fill(); return; }
          const abx = (ax + bx) / 2, aby = (ay + by) / 2, bcx = (bx + cx) / 2, bcy = (by + cy) / 2, cax = (cx + ax) / 2, cay = (cy + ay) / 2;
          tri(ax, ay, abx, aby, cax, cay, k - 1); tri(abx, aby, bx, by, bcx, bcy, k - 1); tri(cax, cay, bcx, bcy, cx, cy, k - 1);
        };
        tri(L, B, R, B, (L + R) / 2, B - (R - L) * 0.866, Math.min(n, 7));
      } else {
        const m = Math.pow(2, Math.min(n, 6)), s = (R - L) / m;
        for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) c.strokeRect(L + i * s, T + j * s * 0.84, s, s * 0.84);
      }
      c.restore();
    }
    function draw() {
      const f = F[key], d = Math.log(f.N) / Math.log(1 / f.r);
      g.clear(); drawFractal();
      g.text(f.name + ", level " + n, 30, 30, { size: 18, color: C.white, font: "sans" });
      g.view(0, 9 * Math.log(3), 0, 9 * Math.log(4), 500, 870, 40, 380);
      g.axes({ xt: [], yt: [] });
      g.text("log(1/diam)", 870, 400, { size: 15, color: C.grey, align: "right", font: "sans" });
      g.text("log N", 505, 30, { size: 15, color: C.grey, font: "sans" });
      g.plot((x) => d * x, 0, 9 * Math.log(3), "rgba(88,196,221,.6)", 2);
      for (let k = 0; k <= 8; k++) g.dot(k * Math.log(1 / f.r), k * Math.log(f.N), k === n ? C.yellow : C.blue, k === n ? 7 : 4);
      g.text(`slope = log ${f.N} / log ${Math.round(1 / f.r)} = ${d.toFixed(4)}`, 520, 70, { size: 20, color: C.yellow });
      const sumAt = (s) => Math.pow(f.N, n) * Math.pow(Math.pow(f.r, n), s);
      out.innerHTML = `dim<sub>H</sub> = ${d.toFixed(4)} · level ${n}: N = ${Math.pow(f.N, n)} pieces of diameter ${f.r === 0.5 ? "2" : "3"}<sup>−${n}</sup> · Σ diam<sup>s</sup> at s = dim: ${sumAt(d).toFixed(3)}, at s = dim − 0.1: ${sumAt(d - 0.1).toFixed(2)}, at s = dim + 0.1: ${sumAt(d + 0.1).toFixed(3)}`;
    }
    api.select("set:", Object.keys(F).map((k) => [k, F[k].name]), key, (v) => { key = v; draw(); });
    api.slider("level n =", 0, 7, 1, n, (v) => { n = v; draw(); });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Explainer: g(x) = x + f(x) stretches the Cantor set ---------- */
  const lvl = 7;
  const gaps = []; // removed intervals up to level lvl, with their Cantor-function value
  (function () {
    const rec = (a, b, lo, hi, k) => { if (k > lvl) return; const t = (b - a) / 3, mid = (lo + hi) / 2; gaps.push([a + t, b - t, mid, k]); rec(a, a + t, lo, mid, k + 1); rec(b - t, b, mid, hi, k + 1); };
    rec(0, 1, 0, 1, 1);
  })();
  Book.scene("cantor-stretch", {
    draw(g, s) {
      const S = 480, X0 = 160, topY = 230, botY = 520;
      const tx = (x) => X0 + x * S;
      const t = s.seg === 0 ? 0 : s.seg === 1 ? E.io(s.in(1, 0.15, 0.85)) : 1;
      g.title(s.seg === 0 ? "𝕮 (yellow) and the removed gaps (blue), total length 1" : s.seg === 1 ? "g(x) = x + f(x):  each gap slides, keeping its length" : s.seg === 2 ? "g(gaps): length 1,  g(𝕮): length ≥ 1" : "F = g⁻¹(E) ⊂ 𝕮: Lebesgue measurable, not Borel", 1);
      // top: [0,1]
      g.rect(tx(0), topY, S, 16, C.yellow);
      gaps.forEach(([a, b]) => g.rect(tx(a), topY, (b - a) * S, 16, "#24496b"));
      g.text("0", tx(0), topY + 40, { size: 26, align: "center", color: C.grey }); g.text("1", tx(1), topY + 40, { size: 26, align: "center", color: C.grey });
      if (s.seg >= 1) {
        // bottom: [0,2]
        g.alpha(E.out(s.in(1, 0, 0.2)), () => {
          g.line(tx(0), botY + 8, tx(2), botY + 8, "rgba(236,230,226,.25)", 16);
          g.text("0", tx(0), botY + 44, { size: 26, align: "center", color: C.grey }); g.text("2", tx(2), botY + 44, { size: 26, align: "center", color: C.grey });
        });
        gaps.forEach(([a, b, c, k]) => {
          const x = lerp(a, a + c, t), y = lerp(topY, botY, t);
          g.rect(tx(x), y, (b - a) * S, 16, k <= 2 ? C.blue : "rgba(88,196,221,.8)");
          if (k <= 2 && s.seg === 1) g.line(tx(a + (b - a) / 2), topY + 16, tx(x + (b - a) / 2), y, "rgba(88,196,221,.35)", 1.5, [4, 4]);
        });
        if (t >= 1) {
          // the image of the Cantor set fills the rest of [0,2]
          const segs = gaps.map(([a, b, c]) => [a + c, b + c]).sort((p, q) => p[0] - q[0]);
          let cur = 0; segs.forEach(([a, b]) => { if (a > cur) g.rect(tx(cur), botY, (a - cur) * S, 16, C.yellow); cur = Math.max(cur, b); }); if (cur < 2) g.rect(tx(cur), botY, (2 - cur) * S, 16, C.yellow);
          gaps.forEach(([a, b, c, k]) => g.rect(tx(a + c), botY, (b - a) * S, 16, k <= 2 ? C.blue : "rgba(88,196,221,.8)"));
        }
      }
      if (s.seg >= 2) {
        g.text("blue: Σ lengths = 1", tx(2) - 10, 640, { size: 28, align: "right", color: C.blue, alpha: s.in(2, 0.1, 0.3) });
        g.text("yellow: g(𝕮) has measure 2 − 1 = 1", tx(0), 640, { size: 28, color: C.yellow, alpha: s.in(2, 0.4, 0.6) });
      }
      if (s.seg === 3) {
        g.alpha(0.95, () => g.rect(700, 100, 520, 120, "rgba(14,22,33,.95)", C.red, 2, 12));
        g.text("E ⊂ g(𝕮) non-measurable", 960, 140, { size: 28, align: "center", color: C.red, alpha: s.in(3, 0.1, 0.3) });
        g.text("F = g⁻¹(E) ⊂ 𝕮 : null, not Borel", 960, 185, { size: 28, align: "center", color: C.white, alpha: s.in(3, 0.4, 0.6) });
      }
    },
  });
})();
