/* Lecture 6: figures and explainer */
(function () {
  const { C, ease: E, lerp, clamp } = Book;

  /* ---------- escaping mass ---------- */
  Book.viz("escape", (fig, api) => {
    const g = api.canvas(900, 400);
    let n = 4, cont = false, x0 = 0.3;
    const fb = (x) => (x > 0 && x < 1 / n ? n : 0);
    const fc = (x) => { const a = 1 / (n * n), b = 1 / n; if (x <= 0 || x >= b) return 0; if (x < a) return (n * x) / a; if (x > b - a) return (n * (b - x)) / a; return n; };
    const out = api.readout("");
    function draw() {
      const f = cont ? fc : fb, top = Math.max(4, n * 1.1);
      g.clear(); g.view(0, 1, 0, top, 60, 870, 20, 370);
      g.fillUnder(f, 0, Math.min(1, 1 / n + 0.001), "rgba(255,140,66,.45)", 2000);
      g.axes({ xt: [[0, 0], [1 / n, "1/n"], [1, 1]], yt: [[n, "n"]] });
      g.plot(f, 0, 1, C.orange, 3, 1, 3000);
      g.wline(x0, 0, x0, Math.max(f(x0), 0.02 * top), C.green, 2, [4, 4]); g.dot(x0, f(x0), C.green, 6);
      const area = cont ? 1 - 1 / n : 1;
      const nOut = Math.ceil(1 / x0);
      out.innerHTML = `∫₀¹ f<sub>n</sub> = ${area.toFixed(4)} &nbsp;·&nbsp; f<sub>n</sub>(${x0.toFixed(2)}) = ${f(x0).toFixed(2)} &nbsp;·&nbsp; f<sub>n</sub>(${x0.toFixed(2)}) = 0 for all n ≥ ${nOut}`;
    }
    api.slider("n =", 1, 60, 1, n, (v) => { n = v; draw(); });
    api.check(" continuous version", false, (v) => { cont = v; draw(); });
    api.slider("probe x =", 0.01, 1, 0.01, x0, (v) => { x0 = v; draw(); }, (v) => v.toFixed(2));
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Venn diagram for Step 1 (iii)' ---------- */
  Book.viz("venn-proof", (fig, api) => {
    const g = api.canvas(900, 460);
    const YH = 0.935, R1 = 0.74, R2 = 0.72;
    const inF = (x, y) => Math.abs(x) < 1.6 && Math.abs(y) < 0.85 && (Math.max(0, Math.abs(x) - 1.3) ** 2 + Math.max(0, Math.abs(y) - 0.55) ** 2 < 0.09);
    const inE1 = (x, y) => (x + 0.5) ** 2 + (y - 0.05) ** 2 < R1 * R1;
    const inE2 = (x, y) => (x - 0.45) ** 2 + (y + 0.12) ** 2 < R2 * R2;
    const P = {
      FE1: (x, y) => inF(x, y) && inE1(x, y),
      FmE1: (x, y) => inF(x, y) && !inE1(x, y),
      FmE1E2: (x, y) => inF(x, y) && !inE1(x, y) && inE2(x, y),
      FmE1mE2: (x, y) => inF(x, y) && !inE1(x, y) && !inE2(x, y),
      FU: (x, y) => inF(x, y) && (inE1(x, y) || inE2(x, y)),
    };
    const cols = [[88, 196, 221], [255, 140, 66], [131, 193, 103]];
    const lines = [
      ["μ*(F) = μ*(F∩E₁) + μ*(F∖E₁)", ["FE1", "FmE1"]],
      ["μ*(F∖E₁) = μ*((F∖E₁)∩E₂) + μ*((F∖E₁)∖E₂)", ["FmE1E2", "FmE1mE2"]],
      ["μ*(F) = μ*(F∩E₁) + μ*((F∖E₁)∩E₂) + μ*((F∖E₁)∖E₂)", ["FE1", "FmE1E2", "FmE1mE2"]],
      ["≥ μ*((F∩E₁) ∪ ((F∖E₁)∩E₂)) + μ*((F∖E₁)∖E₂)   (subadditivity)", ["FU", "FmE1mE2"]],
      ["= μ*(F∩(E₁∪E₂)) + μ*(F∖(E₁∪E₂))", ["FU", "FmE1mE2"]],
    ];
    let k = 0;
    const off = document.createElement("canvas"), W = 450, H = 200; off.width = W; off.height = H; const o = off.getContext("2d");
    function draw() {
      const img = o.createImageData(W, H), pieces = lines[k][1];
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const x = -2.1 + (4.2 * i) / W, y = YH - (2 * YH * j) / H;
        let c = [14, 22, 33];
        if (inF(x, y)) c = [40, 50, 66];
        pieces.forEach((p, t) => { if (P[p](x, y)) c = cols[t]; });
        const q = (j * W + i) * 4; img.data[q] = c[0]; img.data[q + 1] = c[1]; img.data[q + 2] = c[2]; img.data[q + 3] = 255;
      }
      o.putImageData(img, 0, 0);
      g.clear(); g.ctx.drawImage(off, 0, 60, 900, 400);
      // outlines
      g.view(-2.1, 2.1, -YH, YH, 0, 900, 60, 460);
      g.circle(g.X(-0.5), g.Y(0.05), g.X(R1) - g.X(0), null, "rgba(236,230,226,.85)", 2);
      g.circle(g.X(0.45), g.Y(-0.12), g.X(R2) - g.X(0), null, "rgba(236,230,226,.85)", 2);
      g.text("E₁", g.X(-1.2), g.Y(0.72), { size: 26, color: C.white }); g.text("E₂", g.X(1.12), g.Y(0.62), { size: 26, color: C.white }); g.text("F", g.X(1.8), g.Y(-0.8), { size: 26, color: C.grey });
      g.text(lines[k][0], 450, 30, { size: 22, align: "center", color: C.white });
      const legend = lines[k][1].map((p, t) => `<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:rgb(${cols[t]})"></span>`).join(" ");
      out.innerHTML = `line ${k + 1} / ${lines.length} &nbsp; ${legend}`;
    }
    api.button("◀ previous line", () => { k = Math.max(0, k - 1); draw(); });
    api.button("next line ▶", () => { k = Math.min(lines.length - 1, k + 1); draw(); });
    const out = api.readout("");
    draw();
  });

  /* ---------- volume of unit ball ---------- */
  function gamma(z) { if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z)); z -= 1; const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; let x = c[0]; for (let i = 1; i < 9; i++) x += c[i] / (z + i); const t = z + 7.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x; }
  const alpha = (s) => Math.pow(Math.PI, s / 2) / gamma(s / 2 + 1);
  Book.viz("ball-volume", (fig, api) => {
    const g = api.canvas(900, 380);
    let hover = 5;
    const out = api.readout("");
    function draw() {
      g.clear(); g.view(0, 20.5, 0, 5.8, 60, 870, 20, 340);
      for (let N = 1; N <= 20; N++) g.wrect(N - 0.35, N + 0.35, 0, alpha(N), N === hover ? C.yellow : "rgba(88,196,221,.75)");
      g.plot(alpha, 0.01, 20.5, "rgba(236,230,226,.6)", 2, 1, 600);
      g.axes({ xt: [1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((v) => [v, v]), yt: [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]] });
      g.text("N", 880, g.Y(0), { size: 16, color: C.grey });
      out.innerHTML = `α<sub>${hover}</sub> = ${alpha(hover).toFixed(5)}` + (hover === 2 ? " = π" : hover === 3 ? " = 4π/3" : hover === 1 ? " = 2" : "");
    }
    api.drag(g, (px, py, t) => { const N = Math.round(g.iX(px)); if (N >= 1 && N <= 20 && N !== hover) { hover = N; draw(); } });
    fig.querySelector(".controls").append(out);
    draw();
  });

  /* ---------- Explainer: Borel–Cantelli ---------- */
  const PHI = 0.6180339887;
  const bcSets = (n, typ) => {
    if (!typ) { const L = 1 / (n * n), c = (n * PHI) % 1; return [[c - L / 2, c + L / 2]]; }
    // typewriter: lengths 1/n placed end to end, wrapping around [0,1]
    let s = 0; for (let k = 1; k < n; k++) s += 1 / k; const a = s % 1, b = a + 1 / n;
    return b <= 1 ? [[a, b]] : [[a, 1], [0, b - 1]];
  };
  Book.scene("borel-cantelli", {
    draw(g, s) {
      const typ = s.seg === 3;
      const N = s.seg === 0 ? 12 : s.seg === 1 ? 12 + Math.floor(E.lin(s.p) * 48) : 60;
      const Nt = typ ? 8 + Math.floor(E.lin(s.in(3, 0.15, 0.95)) * 112) : N;
      const L = 140, R = 1140, X = (x) => L + clamp(x) * (R - L);
      g.title(typ ? "lengths 1/n (Σ = ∞): a typewriter sweeping [0,1] forever" : "Eₙ of length 1/n²  (Σ = π²/6 < ∞)", 1);
      const rows = Math.min(Nt, 40), rh = 380 / rows;
      for (let n = 1; n <= rows; n++) bcSets(n, typ).forEach(([a, b]) => g.rect(X(a), 70 + (n - 1) * rh, Math.max(2, X(b) - X(a)), Math.max(2, rh * 0.6), `hsla(${(n * 23) % 360},70%,62%,.9)`));
      if (Nt > rows) g.text(`… ${Nt - rows} more`, L, 470, { size: 22, color: C.grey, font: "sans" });
      // count function
      const bins = 500, cnt = new Array(bins).fill(0);
      for (let n = 1; n <= Nt; n++) bcSets(n, typ).forEach(([a, b]) => { for (let i = Math.max(0, Math.floor(a * bins)); i < Math.min(bins, Math.ceil(b * bins)); i++) cnt[i]++; });
      const maxc = typ ? Math.max(...cnt) : 6;
      g.line(L, 680, R, 680, C.grey, 1.5);
      g.text("# of Eₙ containing x", L, 515, { size: 22, color: C.grey, font: "sans" });
      for (let i = 0; i < bins; i++) { const h = (cnt[i] / Math.max(maxc, 1)) * 140; g.rect(L + (i * (R - L)) / bins, 680 - h, (R - L) / bins + 0.5, h, C.blue); }
      if (s.seg === 2) {
        const n0 = 1 + Math.floor(E.lin(s.in(2, 0.1, 0.8)) * 25);
        let tail = 0; for (let k = n0; k < 5000; k++) tail += 1 / (k * k);
        g.alpha(0.92, () => g.rect(760, 80, 460, 120, "rgba(14,22,33,.95)", C.yellow, 2, 12));
        g.text(`Σ_{k ≥ ${n0}} μ(Eₖ) = ${tail.toFixed(4)}`, 990, 125, { size: 30, align: "center", color: C.yellow });
        g.text("μ(lim sup Eₙ) ≤ tail → 0", 990, 170, { size: 26, align: "center", color: C.white, alpha: s.in(2, 0.5, 0.7) });
      }
      if (typ) g.text(`every x is hit ≈ log n times → ∞`, 990, 520, { size: 26, align: "center", color: C.yellow, alpha: s.in(3, 0.6, 0.8) });
    },
  });
})();
