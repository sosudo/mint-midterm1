/* Lecture 3: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ---------- finite cover of a closed rectangle, extended faces ---------- */
  Book.viz("grid-cover", (fig, api) => {
    const g = api.canvas(900, 460);
    const R = [0.22, 0.78, 0.22, 0.78];
    let cover = [], seed = 7;
    const cols = [C.orange, C.red, C.green, C.purple, C.teal, C.pink, C.yellow, "#9ad0ff", "#c3e88d", "#f78c6c"];
    const inside = (r, x, y) => x > r[0] && x < r[1] && y > r[2] && y < r[3];
    function makeCover() {
      const rand = rng(seed++ * 7919);
      cover = [];
      for (let tries = 0; tries < 200; tries++) {
        let hole = null;
        for (let i = 0; i <= 40 && !hole; i++) for (let j = 0; j <= 40 && !hole; j++) {
          const x = lerp(R[0], R[1], i / 40), y = lerp(R[2], R[3], j / 40);
          if (!cover.some((r) => inside(r, x, y))) hole = [x, y];
        }
        if (!hole) break;
        const w = 0.18 + rand() * 0.3, h = 0.16 + rand() * 0.3;
        const cx = hole[0] + (rand() - 0.35) * w * 0.6, cy = hole[1] + (rand() - 0.35) * h * 0.6;
        cover.push([cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2]);
      }
    }
    const out = api.readout("");
    function draw() {
      g.clear(); g.view(0, 1, 0, 1, 230, 670, 10, 450);
      const xs = new Set([R[0], R[1]]), ys = new Set([R[2], R[3]]);
      cover.forEach((r) => { [r[0], r[1]].forEach((x) => x > R[0] && x < R[1] && xs.add(x)); [r[2], r[3]].forEach((y) => y > R[2] && y < R[3] && ys.add(y)); });
      const X = [...xs].sort((a, b) => a - b), Y = [...ys].sort((a, b) => a - b);
      let cells = 0;
      for (let i = 0; i + 1 < X.length; i++) for (let j = 0; j + 1 < Y.length; j++) {
        const cx = (X[i] + X[i + 1]) / 2, cy = (Y[j] + Y[j + 1]) / 2;
        const k = cover.findIndex((r) => inside(r, cx, cy));
        cells++;
        g.wrect(X[i], X[i + 1], Y[j], Y[j + 1], k >= 0 ? cols[k % cols.length] + "55" : C.red, "rgba(14,22,33,.6)", 1);
      }
      cover.forEach((r, k) => g.wrect(r[0], r[1], r[2], r[3], null, cols[k % cols.length], 2.5));
      X.forEach((x) => g.wline(x, -0.02, x, 1.02, "rgba(236,230,226,.35)", 1, [5, 5]));
      Y.forEach((y) => g.wline(-0.02, y, 1.02, y, "rgba(236,230,226,.35)", 1, [5, 5]));
      g.wrect(R[0], R[1], R[2], R[3], null, C.blue, 4);
      g.text("R", g.X(R[0]) + 10, g.Y(R[3]) + 18, { size: 24, color: C.blue, weight: 600 });
      const lR = (R[1] - R[0]) * (R[3] - R[2]);
      const sum = cover.reduce((s, r) => s + (r[1] - r[0]) * (r[3] - r[2]), 0);
      g.text("ℓ(R) = " + lR.toFixed(3), 20, 60, { size: 22, color: C.blue });
      g.text("Σ ℓ(Rᵢ) = " + sum.toFixed(3), 20, 95, { size: 22, color: C.orange });
      g.text(cover.length + " rectangles", 20, 130, { size: 20, color: C.grey });
      g.text(cells + " cells Jₖ", 20, 160, { size: 20, color: C.grey });
      out.textContent = "";
    }
    api.button("shuffle cover", () => { makeCover(); draw(); });
    makeCover(); draw();
  });

  /* ---------- Explainer: the Vitali set ---------- */
  const SQ2 = Math.SQRT2;
  const classes = [0.37, 0.37 + SQ2 / 10, -0.52 + Math.PI / 20, 0.11 * Math.E, -0.8 + 1 / Math.PI, Math.sqrt(3) / 5];
  const ratsQ = [];
  for (let q = 1; q <= 14; q++) for (let p = -2 * q; p <= 2 * q; p++) ratsQ.push(p / q);
  const classPts = (a) => [...new Set(ratsQ.map((r) => +(a + r).toFixed(6)))].filter((x) => x >= -1 && x <= 1);
  // representative of each class: the point closest to a fixed "random-looking" target
  const rand = rng(12345);
  const Vpts = []; for (let i = 0; i < 70; i++) Vpts.push(rand() * 2 - 1);
  const shifts = [0, 0.5, -0.5, 1, -1, 1 / 3, -1 / 3, 1.5, -1.5, 2, -2, 0.25];

  Book.scene("vitali", {
    draw(g, s) {
      const wide = s.seg >= 3 ? E.io(s.in(3, 0, 0.4)) : 0;
      const half = lerp(1.25, 3.3, wide);
      g.view(-half, half, 0, 1, 70, 1210, 90, 640);
      const baseY = g.Y(0.12);
      const lineCol = C.white;
      g.line(g.X(-1), baseY, g.X(1), baseY, lineCol, 4);
      [-1, 0, 1].forEach((t) => g.text(String(t), g.X(t), baseY + 30, { size: 28, align: "center", color: C.grey }));
      if (wide > 0) {
        g.alpha(wide, () => {
          g.line(g.X(-3), baseY, g.X(3), baseY, "rgba(236,230,226,.35)", 2);
          [-3, -2, 2, 3].forEach((t) => g.text(String(t), g.X(t), baseY + 30, { size: 28, align: "center", color: C.grey }));
        });
      }
      // seg 0-1: equivalence classes
      if (s.seg <= 2) {
        const nShow = s.seg === 0 ? 1 : 1 + Math.floor(E.lin(s.p * 1.4) * (classes.length - 1));
        const fadeRows = s.seg === 2 ? 1 - E.io(s.in(2, 0.5, 0.9)) : 1;
        for (let c = 0; c < nShow; c++) {
          const hue = 45 + c * 52, col = `hsl(${hue},85%,62%)`;
          const pts = classPts(classes[c]);
          const rowY = g.Y(0.3 + c * 0.11);
          const app = s.seg === 0 ? E.out(s.in(0, 0.4, 0.9)) : 1;
          g.alpha(fadeRows * app, () => {
            g.text(c === 0 ? "[a]" : "", g.X(-1) - 50, rowY, { size: 28, color: col });
            pts.forEach((x) => g.circle(g.X(x), rowY, 2.6, col));
            if (s.seg >= 1) pts.forEach((x) => g.circle(g.X(x), baseY - 8, 1.6, col));
          });
          // representative chosen
          if (s.seg === 2) {
            const rep = pts[(c * 7 + 3) % pts.length];
            const t = E.io(s.in(2, 0.1 + c * 0.06, 0.5 + c * 0.06));
            g.circle(g.X(rep), lerp(rowY, g.Y(0.92), t), 7, col);
          }
        }
        if (s.seg === 0) { g.circle(g.X(classes[0]), baseY, 7, C.yellow); g.text("a", g.X(classes[0]), baseY - 26, { size: 30, align: "center", color: C.yellow }); }
        if (s.seg === 1) g.title("a ~ b  ⇔  a − b ∈ ℚ", 1);
        if (s.seg === 2) {
          g.title("V: one point from every class (axiom of choice)", 1);
          g.alpha(E.out(s.in(2, 0.5, 0.9)), () => { Vpts.forEach((x) => g.circle(g.X(x), g.Y(0.92), 3.2, C.yellow)); g.text("V", g.X(-1) - 50, g.Y(0.92), { size: 32, color: C.yellow }); });
        }
      }
      // seg 3+: translates
      if (s.seg >= 3) {
        const nRows = s.seg === 3 ? 1 + Math.floor(E.lin(s.in(3, 0.25, 0.95)) * (shifts.length - 1)) : shifts.length;
        for (let k = 0; k < nRows; k++) {
          const col = `hsl(${(k * 37 + 40) % 360},80%,62%)`, rowY = g.Y(0.25 + k * 0.062);
          Vpts.forEach((x) => g.circle(g.X(x + shifts[k]), rowY, 2.4, col));
          g.text(k === 0 ? "V" : `r${"₁₂₃₄₅₆₇₈₉"[k] || "ₖ"}+V`, g.X(-3.25), rowY, { size: 22, color: col });
        }
        if (s.seg === 3) g.title("rₖ + V: pairwise disjoint, together they cover [−1, 1]", s.in(3, 0.3, 0.5));
        if (s.seg === 4) {
          g.title("μ*(V) = 0  ⇒  2 = μ*([−1,1]) ≤ Σ μ*(rₖ+V) = 0 ✗", s.in(4, 0.05, 0.25));
          g.text("so  μ*(V) > 0", g.W / 2, 690, { size: 34, align: "center", color: C.yellow, alpha: s.in(4, 0.6, 0.8) });
        }
        if (s.seg === 5) {
          g.brace(g.X(-3), g.X(3), baseY + 48, C.blue, 12);
          g.text("all copies ⊂ [−3, 3], length 6", g.W / 2, baseY + 90, { size: 28, align: "center", color: C.blue, alpha: s.in(5, 0, 0.2) });
          const n = Math.floor(lerp(1, 40, E.io(s.in(5, 0.25, 0.75)))), m = 0.21;
          const X0 = 720, W = 380, Y0 = 72;
          g.text(`n · μ*(V) with n = ${n}`, X0, Y0 - 20, { size: 24, color: C.grey, font: "sans" });
          g.rect(X0, Y0, W, 22, null, C.grey, 1.5);
          g.rect(X0, Y0, Math.min(W * 1.22, (W * n * m) / 6), 22, n * m > 6 ? C.red : C.yellow);
          g.line(X0 + W, Y0 - 8, X0 + W, Y0 + 30, C.blue, 3);
          g.text("6", X0 + W, Y0 + 46, { size: 24, align: "center", color: C.blue });
          g.text("additivity would force  6 ≥ n μ*(V) > 6", 380, 40, { size: 30, align: "center", color: C.red, alpha: s.in(5, 0.75, 0.9) });
        }
      }
    },
  });
})();
