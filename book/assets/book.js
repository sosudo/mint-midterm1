/* Interactive textbook runtime.
 *  - KaTeX rendering
 *  - proof-step "why" popovers (.step > .why)
 *  - narrated reader over every <template class="say"> outside an explainer
 *  - explainer "videos": canvas scenes driven by narration segments
 *  - interactive figures (figure.viz)
 */
(function () {
  "use strict";
  const Book = (window.Book = window.Book || {});
  const scenes = {}, vizzes = {};
  Book.scene = (id, def) => (scenes[id] = def);
  Book.viz = (id, fn) => (vizzes[id] = fn);

  const store = {
    get(k, d) { try { const v = localStorage.getItem("mintbook." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("mintbook." + k, JSON.stringify(v)); } catch (e) {} },
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (tag, attrs = {}, html) => {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

  /* ---------------- Theme ---------------- */
  function initTheme() {
    const t = store.get("theme", null);
    if (t) document.documentElement.setAttribute("data-theme", t);
    const b = $("#themeBtn");
    if (b) b.onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme") ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const nxt = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nxt);
      store.set("theme", nxt);
    };
    const s = $("#stepsBtn");
    if (s) {
      const apply = () => { document.body.classList.toggle("no-steps", !store.get("steps", true)); s.textContent = store.get("steps", true) ? "Proof hints: on" : "Proof hints: off"; };
      s.onclick = () => { store.set("steps", !store.get("steps", true)); apply(); };
      apply();
    }
  }

  /* ---------------- Environment labels ---------------- */
  function initEnvs() {
    $$(".env[data-label]").forEach((env) => {
      const lab = el("span", { class: "env-label" }, env.dataset.label + (env.dataset.title ? ' <span class="env-title">' + env.dataset.title + "</span>" : "") + (env.classList.contains("proof") ? "." : ""));
      const first = env.firstElementChild;
      if (first && first.tagName === "P") first.prepend(lab, " ");
      else env.prepend(lab);
    });
  }

  /* ---------------- Math ---------------- */
  function renderMath(root) {
    if (!window.renderMathInElement) return;
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
      ],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "template"],
      throwOnError: false,
      macros: {
        "\\R": "\\mathbb{R}", "\\N": "\\mathbb{N}", "\\Q": "\\mathbb{Q}", "\\Z": "\\mathbb{Z}",
        "\\M": "\\mathcal{M}", "\\B": "\\mathcal{B}", "\\eps": "\\varepsilon",
        "\\ms": "\\mu^*",
      },
    });
  }

  /* ---------------- Proof-step popovers ---------------- */
  function initSteps() {
    const pop = el("div", { class: "popover", role: "dialog" });
    document.body.appendChild(pop);
    let pinned = null, hoverTimer = null, current = null;
    const show = (step) => {
      const why = step.querySelector(":scope > .why");
      if (!why) return;
      if (current) current.classList.remove("active");
      current = step;
      step.classList.add("active");
      pop.innerHTML = '<div class="pop-head">Why does this step hold?<button class="x" aria-label="close">×</button></div>' + why.innerHTML;
      pop.querySelector(".x").onclick = hide;
      pop.classList.add("show");
      place(step);
    };
    const place = (step) => {
      const r = step.getClientRects();
      const rect = r.length ? r[r.length - 1] : step.getBoundingClientRect();
      const W = Math.min(520, innerWidth - 24);
      pop.style.width = W + "px";
      let left = rect.left + scrollX;
      left = Math.max(12 + scrollX, Math.min(left, scrollX + innerWidth - W - 12));
      pop.style.left = left + "px";
      const below = rect.bottom + scrollY + 8;
      pop.style.top = below + "px";
      const ph = pop.offsetHeight;
      if (rect.bottom + ph + 16 > innerHeight && rect.top - ph - 8 > 0) pop.style.top = rect.top + scrollY - ph - 8 + "px";
    };
    const hide = () => {
      pop.classList.remove("show");
      if (current) current.classList.remove("active");
      current = null; pinned = null;
    };
    const steps = $$(".step");
    steps.forEach((s) => {
      if (!s.querySelector(":scope > .why")) return;
      s.tabIndex = 0;
      s.addEventListener("click", (e) => {
        if (document.body.classList.contains("no-steps")) return;
        if (e.target.closest("a, button")) return;
        e.stopPropagation();
        if (pinned === s) { hide(); return; }
        pinned = s; show(s);
      });
      s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); s.click(); } });
      s.addEventListener("mouseenter", (e) => {
        if (pinned || document.body.classList.contains("no-steps") || matchMedia("(hover: none)").matches) return;
        // innermost step wins when steps nest
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => { if (!pinned) show(s); }, 280);
        e.stopPropagation();
      });
      s.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimer);
        if (!pinned) hoverTimer = setTimeout(() => { if (!pinned && !pop.matches(":hover")) hide(); }, 220);
      });
    });
    pop.addEventListener("mouseleave", () => { if (!pinned) hide(); });
    pop.addEventListener("click", (e) => { e.stopPropagation(); if (current) pinned = current; });
    document.addEventListener("click", () => { if (pinned) hide(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
    addEventListener("resize", () => current && place(current));
  }

  /* ---------------- Speech engines ---------------- */
  const Voice = {
    mode: store.get("voiceMode", "builtin"), // builtin | device
    rate: store.get("rate", 1),
    deviceVoiceName: store.get("deviceVoice", ""),
    voices: [],
    loadVoices() {
      if (!("speechSynthesis" in window)) return;
      const all = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
      const score = (v) => (/natural|neural|premium|enhanced/i.test(v.name) ? 40 : 0) + (/google/i.test(v.name) ? 20 : 0) +
        (/samantha|daniel|ava|allison|aria|jenny|guy|serena|evan/i.test(v.name) ? 15 : 0) + (v.lang === "en-US" ? 4 : 0) + (v.localService ? 0 : 2);
      this.voices = all.sort((a, b) => score(b) - score(a));
      document.dispatchEvent(new Event("book:voices"));
    },
    deviceVoice() { return this.voices.find((v) => v.name === this.deviceVoiceName) || this.voices[0] || null; },
    // speak text with the device voice; Chrome cuts long utterances, so we queue sentences
    speak(text, onend, onstart) {
      if (!("speechSynthesis" in window)) { setTimeout(onend, 50); return { cancel() {} }; }
      speechSynthesis.cancel();
      const parts = text.match(/[^.!?;:]+[.!?;:]*\s*/g) || [text];
      let i = 0, cancelled = false;
      const next = () => {
        if (cancelled) return;
        if (i >= parts.length) { onend && onend(); return; }
        const u = new SpeechSynthesisUtterance(parts[i++].trim());
        const v = this.deviceVoice();
        if (v) u.voice = v;
        u.rate = this.rate;
        u.onend = next;
        u.onerror = (e) => { if (!cancelled && e.error !== "interrupted" && e.error !== "canceled") next(); };
        if (i === 1 && onstart) u.onstart = onstart;
        speechSynthesis.speak(u);
      };
      next();
      return { cancel() { cancelled = true; speechSynthesis.cancel(); } };
    },
  };
  Book.Voice = Voice;
  if ("speechSynthesis" in window) {
    Voice.loadVoices();
    speechSynthesis.onvoiceschanged = () => Voice.loadVoices();
  }
  const sharedAudio = new Audio();
  sharedAudio.preload = "auto";
  let activeOwner = null; // only one narrator at a time
  function claim(owner) { if (activeOwner && activeOwner !== owner) activeOwner.stop(true); activeOwner = owner; }

  // play one narration line (template.say) with whichever engine is selected
  function playLine(tpl, owner, onend) {
    const audio = tpl.dataset.audio;
    const text = tpl.content ? tpl.content.textContent : tpl.textContent;
    if (Voice.mode === "builtin" && audio) {
      sharedAudio.onended = null;
      sharedAudio.src = audio;
      sharedAudio.playbackRate = Voice.rate;
      sharedAudio.onended = () => onend();
      sharedAudio.onerror = () => { Voice.speak(text, onend); };
      const pr = sharedAudio.play();
      if (pr && pr.catch) pr.catch(() => {});
      return { cancel() { sharedAudio.onended = null; sharedAudio.pause(); }, pause() { sharedAudio.pause(); }, resume() { sharedAudio.play(); }, kind: "audio" };
    }
    const h = Voice.speak(text.replace(/\s+/g, " ").trim(), onend);
    return { cancel: h.cancel, pause() { speechSynthesis.pause(); }, resume() { speechSynthesis.resume(); }, kind: "device" };
  }
  function lineDuration(tpl) {
    const d = parseFloat(tpl.dataset.dur);
    if (Voice.mode === "builtin" && tpl.dataset.audio && d) return d / Voice.rate;
    const words = (tpl.content ? tpl.content.textContent : tpl.textContent).split(/\s+/).length;
    return words / (2.55 * Voice.rate) + 0.4;
  }

  /* ---------------- Narrated reader ---------------- */
  function initReader() {
    const tpls = $$("template.say").filter((t) => !t.closest(".explainer"));
    if (!tpls.length) return;
    const items = tpls.map((t) => ({ tpl: t, host: t.parentElement }));
    items.forEach((it, i) => {
      it.host.classList.add("has-say");
      const b = el("button", { class: "say-btn", title: "Read aloud from here", "aria-label": "Read aloud from here" }, "▶");
      b.onclick = (e) => { e.stopPropagation(); R.start(i); };
      it.host.prepend(b);
    });
    const bar = el("div", { class: "player" + (store.get("playerCollapsed", true) ? " collapsed" : "") });
    bar.innerHTML = `
      <div class="row">
        <button class="prev" title="Previous (←)">⏮</button>
        <button class="play" title="Play / pause (space)">▶</button>
        <button class="next" title="Next (→)">⏭</button>
        <span class="now">Lecture narration — press ▶ to have this lecture read and explained to you</span>
        <button class="more" title="Voice settings">⚙</button>
      </div>
      <div class="prog"><b></b></div>
      <div class="row extra">
        <label>Voice <select class="mode">
          <option value="builtin">Built-in natural voice (offline)</option>
          <option value="device">Device voice (Web Speech)</option>
        </select></label>
        <select class="dvoice" title="Device voice"></select>
        <label>Speed <select class="rate">
          <option>0.8</option><option>0.9</option><option>1</option><option>1.1</option><option>1.25</option><option>1.5</option><option>1.75</option>
        </select></label>
        <label><input type="checkbox" class="follow" checked> follow text</label>
      </div>`;
    document.body.appendChild(bar);
    const q = (s) => bar.querySelector(s);
    const R = {
      i: 0, playing: false, h: null,
      start(i) {
        claim(R);
        R.i = clamp(i, 0, items.length - 1);
        R.playing = true;
        R.run();
      },
      run() {
        if (R.h) R.h.cancel();
        $$(".reading").forEach((e) => e.classList.remove("reading"));
        const it = items[R.i];
        it.host.classList.add("reading");
        if (q(".follow").checked) it.host.scrollIntoView({ behavior: "smooth", block: "center" });
        q(".play").textContent = "❚❚";
        const label = it.host.querySelector(".env-label");
        q(".now").textContent = (label ? label.textContent + " — " : "") + (it.tpl.content ? it.tpl.content.textContent : "").trim().slice(0, 90) + "…";
        q(".prog b").style.width = ((R.i + 1) / items.length) * 100 + "%";
        R.h = playLine(it.tpl, R, () => {
          if (!R.playing) return;
          if (R.i < items.length - 1) { R.i++; R.run(); } else R.stop();
        });
      },
      toggle() {
        if (!R.playing && !R.h) return R.start(R.i);
        if (R.playing) { R.playing = false; R.h && R.h.pause(); q(".play").textContent = "▶"; }
        else { claim(R); R.playing = true; if (R.h && R.h.kind === "audio") { R.h.resume(); q(".play").textContent = "❚❚"; } else R.run(); }
      },
      stop(silent) {
        R.playing = false;
        if (R.h) R.h.cancel();
        R.h = null;
        q(".play").textContent = "▶";
        if (!silent) $$(".reading").forEach((e) => e.classList.remove("reading"));
      },
    };
    Book.reader = R;
    q(".play").onclick = () => R.toggle();
    q(".prev").onclick = () => R.start(R.i - 1);
    q(".next").onclick = () => R.start(R.i + 1);
    q(".more").onclick = () => { bar.classList.toggle("collapsed"); store.set("playerCollapsed", bar.classList.contains("collapsed")); };
    q(".prog").onclick = (e) => { const r = q(".prog").getBoundingClientRect(); R.start(Math.floor(((e.clientX - r.left) / r.width) * items.length)); };
    wireVoiceControls(q(".mode"), q(".dvoice"), q(".rate"));
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, select, textarea, button")) return;
      if (e.key === " " && !e.target.closest(".step")) { e.preventDefault(); R.toggle(); }
      else if (e.key === "ArrowRight" && R.h) R.start(R.i + 1);
      else if (e.key === "ArrowLeft" && R.h) R.start(R.i - 1);
    });
  }
  function wireVoiceControls(mode, dvoice, rate) {
    mode.value = Voice.mode;
    rate.value = String(Voice.rate);
    const fill = () => {
      dvoice.innerHTML = Voice.voices.map((v) => `<option>${v.name}</option>`).join("") || "<option>(no device voices)</option>";
      const v = Voice.deviceVoice();
      if (v) dvoice.value = v.name;
      dvoice.style.display = Voice.mode === "device" ? "" : "none";
    };
    fill();
    document.addEventListener("book:voices", fill);
    mode.onchange = () => { Voice.mode = mode.value; store.set("voiceMode", Voice.mode); fill(); };
    dvoice.onchange = () => { Voice.deviceVoiceName = dvoice.value; store.set("deviceVoice", dvoice.value); };
    rate.onchange = () => { Voice.rate = parseFloat(rate.value); store.set("rate", Voice.rate); sharedAudio.playbackRate = Voice.rate; };
  }

  /* ---------------- Drawing helper (3b1b-ish palette) ---------------- */
  const C = (Book.C = {
    bg: "#0e1621", white: "#ece6e2", grey: "#8a95a5", dim: "#3b4656", blue: "#58c4dd", yellow: "#f5d547",
    green: "#83c167", red: "#fc6255", orange: "#ff8c42", purple: "#b189e8", teal: "#5cd0b3", pink: "#e86ab5",
  });
  const E = (Book.ease = {
    io: (t) => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - clamp(t), 3),
    lin: clamp,
  });
  Book.lerp = (a, b, t) => a + (b - a) * t;
  Book.clamp = clamp;

  class G {
    constructor(canvas, W, H) {
      this.cv = canvas; this.W = W; this.H = H;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      this.ctx = canvas.getContext("2d");
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.vw = { x0: 0, x1: 1, y0: 0, y1: 1, L: 0, R: W, T: 0, B: H };
    }
    clear(c = C.bg) { const x = this.ctx; x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = c; x.fillRect(0, 0, this.cv.width, this.cv.height); x.restore(); }
    // world view: map [x0,x1]x[y0,y1] into pixel box [L,R]x[T,B]
    view(x0, x1, y0, y1, L = 60, R = this.W - 40, T = 40, B = this.H - 60) { this.vw = { x0, x1, y0, y1, L, R, T, B }; return this; }
    X(x) { const v = this.vw; return v.L + ((x - v.x0) / (v.x1 - v.x0)) * (v.R - v.L); }
    Y(y) { const v = this.vw; return v.B - ((y - v.y0) / (v.y1 - v.y0)) * (v.B - v.T); }
    iX(px) { const v = this.vw; return v.x0 + ((px - v.L) / (v.R - v.L)) * (v.x1 - v.x0); }
    alpha(a, fn) { const x = this.ctx; x.save(); x.globalAlpha *= clamp(a); fn(); x.restore(); }
    line(x1, y1, x2, y2, c = C.white, w = 2, dash) {
      const x = this.ctx; x.save(); x.strokeStyle = c; x.lineWidth = w; x.lineCap = "round"; if (dash) x.setLineDash(dash);
      x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); x.restore();
    }
    wline(a, b, c2, d, c, w, dash) { this.line(this.X(a), this.Y(b), this.X(c2), this.Y(d), c, w, dash); }
    rect(x, y, w, h, fill, stroke, lw = 2, r = 0) {
      const c = this.ctx; c.save(); c.beginPath();
      if (r && c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
      c.restore();
    }
    // world rectangle between x in [a,b], y in [lo,hi]
    wrect(a, b, lo, hi, fill, stroke, lw) { const x1 = this.X(a), x2 = this.X(b), y1 = this.Y(hi), y2 = this.Y(lo); this.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1), fill, stroke, lw); }
    circle(x, y, r, fill, stroke, lw = 2) {
      const c = this.ctx; c.save(); c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI);
      if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } c.restore();
    }
    dot(x, y, c = C.yellow, r = 5) { this.circle(this.X(x), this.Y(y), r, c); }
    text(s, x, y, o = {}) {
      const c = this.ctx; c.save();
      c.font = `${o.italic ? "italic " : ""}${o.weight || 400} ${o.size || 26}px ${o.font === "sans" ? "Inter, system-ui, sans-serif" : '"Latin Modern Math", "STIX Two Math", "Cambria Math", "Times New Roman", serif'}`;
      c.fillStyle = o.color || C.white; c.textAlign = o.align || "left"; c.textBaseline = o.base || "middle";
      if (o.alpha != null) c.globalAlpha *= clamp(o.alpha);
      if (o.maxw) { /* simple wrap */
        const words = s.split(" "); let line = "", yy = y; const lh = (o.size || 26) * 1.3;
        for (const w of words) { const t = line ? line + " " + w : w; if (c.measureText(t).width > o.maxw && line) { c.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
        c.fillText(line, x, yy);
      } else c.fillText(s, x, y);
      c.restore();
    }
    // plot y=f(x) over [a,b]; draw only first fraction `upto` of the curve (for write-on animation)
    plot(f, a, b, c = C.blue, w = 3, upto = 1, n = 400) {
      const x = this.ctx; x.save(); x.strokeStyle = c; x.lineWidth = w; x.lineJoin = "round"; x.beginPath();
      let pen = false; const m = Math.max(1, Math.round(n * clamp(upto)));
      for (let i = 0; i <= m; i++) {
        const t = a + ((b - a) * i) / n, y = f(t);
        if (!isFinite(y)) { pen = false; continue; }
        const px = this.X(t), py = this.Y(y);
        if (py < -2000 || py > 4000) { pen = false; continue; }
        pen ? x.lineTo(px, py) : x.moveTo(px, py); pen = true;
      }
      x.stroke(); x.restore();
    }
    fillUnder(f, a, b, c, n = 200, base = 0) {
      const x = this.ctx; x.save(); x.fillStyle = c; x.beginPath(); x.moveTo(this.X(a), this.Y(base));
      for (let i = 0; i <= n; i++) { const t = a + ((b - a) * i) / n; x.lineTo(this.X(t), this.Y(f(t))); }
      x.lineTo(this.X(b), this.Y(base)); x.closePath(); x.fill(); x.restore();
    }
    axes(o = {}) {
      const v = this.vw, c = o.color || C.grey;
      const yx = clamp(0, v.y0, v.y1), xx = clamp(0, v.x0, v.x1);
      this.line(v.L - 10, this.Y(yx), v.R + 10, this.Y(yx), c, 1.5);
      if (o.y !== false) this.line(this.X(xx), v.B + 10, this.X(xx), v.T - 10, c, 1.5);
      (o.xt || []).forEach(([t, lab]) => { this.line(this.X(t), this.Y(yx) - 5, this.X(t), this.Y(yx) + 5, c, 1.5); if (lab != null) this.text(String(lab), this.X(t), this.Y(yx) + (o.fs || 18) * 1.25, { size: o.fs || 18, align: "center", color: o.lc || C.grey }); });
      (o.yt || []).forEach(([t, lab]) => { this.line(this.X(xx) - 5, this.Y(t), this.X(xx) + 5, this.Y(t), c, 1.5); if (lab != null) this.text(String(lab), this.X(xx) - 12, this.Y(t), { size: o.fs || 18, align: "right", color: o.lc || C.grey }); });
    }
    brace(x1, x2, y, c = C.yellow, h = 10) { // horizontal brace under [x1,x2] at pixel y
      const x = this.ctx; x.save(); x.strokeStyle = c; x.lineWidth = 2; x.beginPath();
      const m = (x1 + x2) / 2; x.moveTo(x1, y); x.quadraticCurveTo(x1, y + h, x1 + h, y + h); x.lineTo(m - h, y + h);
      x.quadraticCurveTo(m, y + h, m, y + 2 * h); x.quadraticCurveTo(m, y + h, m + h, y + h); x.lineTo(x2 - h, y + h); x.quadraticCurveTo(x2, y + h, x2, y); x.stroke(); x.restore();
    }
    arrow(x1, y1, x2, y2, c = C.white, w = 2.5) {
      this.line(x1, y1, x2, y2, c, w);
      const a = Math.atan2(y2 - y1, x2 - x1), s = 11;
      const x = this.ctx; x.save(); x.fillStyle = c; x.beginPath(); x.moveTo(x2, y2);
      x.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4)); x.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4)); x.closePath(); x.fill(); x.restore();
    }
    title(s, a = 1) { this.text(s, this.W / 2, 44, { size: 30, align: "center", alpha: a, weight: 500, font: "sans" }); }
  }
  Book.G = G;

  /* ---------------- Explainer (video) player ---------------- */
  function initExplainers() {
    $$(".explainer").forEach((box) => {
      const id = box.dataset.scene, scene = scenes[id];
      const lines = $$("template.say", box);
      if (!scene || !lines.length) { console.warn("missing scene", id); return; }
      const W = scene.W || 1280, H = scene.H || 720;
      box.insertAdjacentHTML("afterbegin", `<div class="fig-tag"><span class="pill">▶ Explainer</span>${box.dataset.title || ""}</div>`);
      const stage = el("div", { class: "stage" });
      const cv = el("canvas", { width: W, height: H, "aria-label": box.dataset.title || "animation" });
      const cap = el("div", { class: "caption" });
      const big = el("button", { class: "bigplay", "aria-label": "Play explainer" }, "▶");
      stage.append(cv, cap, big);
      const bar = el("div", { class: "bar" });
      bar.innerHTML = `<button class="pp" title="Play/pause">▶</button><button class="rs" title="Restart">↺</button><div class="segs">${lines.map(() => "<i><b></b></i>").join("")}</div><span class="time"></span><button class="cc on" title="Subtitles">CC</button>`;
      box.querySelector(".fig-tag").after(stage, bar);
      if (box.dataset.caption) box.append(el("figcaption", {}, box.dataset.caption));
      const g = new G(cv, W, H);
      const state = scene.init ? scene.init() : {};
      const durs = lines.map(lineDuration);
      const P = { seg: 0, segT: 0, playing: false, h: null, voiceDone: false, last: 0 };
      const total = () => durs.reduce((a, b) => a + b, 0);
      const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
      const segEls = $$(".segs i b", bar);
      const draw = () => {
        const d = durs[P.seg];
        const p = clamp(P.segT / d);
        const s = {
          seg: P.seg, p, t: P.segT, n: lines.length, state,
          at(k) { return k < P.seg ? 1 : k > P.seg ? 0 : p; },  // progress of segment k
          in(k, a = 0, b = 1) { return k < P.seg ? 1 : k > P.seg ? 0 : clamp((p - a) / (b - a)); },
        };
        g.ctx.save(); g.clear(); scene.draw(g, s); g.ctx.restore();
        segEls.forEach((b, i) => (b.style.width = (i < P.seg ? 100 : i > P.seg ? 0 : p * 100) + "%"));
        const before = durs.slice(0, P.seg).reduce((a, b) => a + b, 0);
        bar.querySelector(".time").textContent = fmt(before + Math.min(P.segT, d)) + " / " + fmt(total());
      };
      const startSeg = () => {
        P.segT = 0; P.voiceDone = false;
        cap.textContent = lines[P.seg].content.textContent.trim();
        if (P.h) P.h.cancel();
        P.h = playLine(lines[P.seg], player, () => { P.voiceDone = true; });
      };
      const tick = (now) => {
        if (!P.playing) return;
        const dt = Math.min(0.1, (now - P.last) / 1000); P.last = now;
        P.segT += dt;
        // keep the visual in sync with real audio time when we have it
        if (P.h && P.h.kind === "audio" && !sharedAudio.paused && isFinite(sharedAudio.currentTime)) P.segT = sharedAudio.currentTime / Voice.rate;
        if (P.voiceDone && P.segT >= durs[P.seg] - 0.05) {
          if (P.seg < lines.length - 1) { P.seg++; startSeg(); }
          else { P.segT = durs[P.seg]; draw(); stopPlay(); box.classList.remove("playing"); return; }
        } else if (P.voiceDone) P.segT = Math.max(P.segT, durs[P.seg] - 0.35);
        draw();
        requestAnimationFrame(tick);
      };
      const stopPlay = () => {
        P.playing = false; bar.querySelector(".pp").textContent = "▶";
        if (P.h) { P.h.pause(); }
      };
      const player = {
        stop() { stopPlay(); if (P.h) P.h.cancel(); P.h = null; },
      };
      const play = () => {
        claim(player);
        for (let i = 0; i < lines.length; i++) durs[i] = lineDuration(lines[i]);
        P.playing = true; box.classList.add("playing"); bar.querySelector(".pp").textContent = "❚❚";
        if (P.voiceDone && P.seg === lines.length - 1 && P.segT >= durs[P.seg] - 0.06) { P.seg = 0; startSeg(); }
        else if (!P.h) startSeg();
        else if (P.h.kind === "audio") P.h.resume();
        else startSeg(); // device voices can't reliably resume mid-sentence
        P.last = performance.now();
        requestAnimationFrame(tick);
      };
      big.onclick = play;
      cv.onclick = () => (P.playing ? stopPlay() : play());
      bar.querySelector(".pp").onclick = () => (P.playing ? stopPlay() : play());
      bar.querySelector(".rs").onclick = () => { if (P.h) P.h.cancel(); P.h = null; P.seg = 0; P.segT = 0; play(); };
      bar.querySelector(".cc").onclick = (e) => { e.target.classList.toggle("on"); box.classList.toggle("no-cc"); };
      $$(".segs i", bar).forEach((s, i) => (s.onclick = () => {
        if (P.h) P.h.cancel(); P.h = null; P.seg = i; P.segT = 0; if (P.playing) startSeg(); else { draw(); }
        if (!P.playing) play();
      }));
      box._seek = (seg, p) => { P.seg = seg; P.segT = durs[seg] * p; draw(); }; // used by tests
      // poster frame: end of first segment's build-up looks best
      P.seg = 0; P.segT = durs[0] * 0.999; draw(); P.segT = 0;
      cap.textContent = "";
    });
  }

  /* ---------------- Interactive figures ---------------- */
  function initViz() {
    $$("figure.viz").forEach((fig) => {
      const fn = vizzes[fig.dataset.viz];
      if (!fn) { console.warn("missing viz", fig.dataset.viz); return; }
      fig.insertAdjacentHTML("afterbegin", `<div class="fig-tag"><span class="pill">✦ Interactive</span>${fig.dataset.title || ""}</div>`);
      const cap = fig.querySelector("figcaption");
      const controls = el("div", { class: "controls" });
      const api = {
        canvas(W = 900, H = 420) {
          const cv = el("canvas", { width: W, height: H });
          fig.insertBefore(cv, cap || null);
          fig.insertBefore(controls, cap || null);
          return new G(cv, W, H);
        },
        slider(label, min, max, step, val, on, fmt = (v) => v) {
          const l = el("label", {}, `<span>${label}</span>`);
          const i = el("input", { type: "range", min, max, step, value: val });
          const r = el("span", { class: "readout" }, fmt(+val));
          i.oninput = () => { r.textContent = fmt(+i.value); on(+i.value); };
          l.append(i, r); controls.append(l); return i;
        },
        button(label, on) { const b = el("button", { class: "btn" }, label); b.onclick = on; controls.append(b); return b; },
        check(label, val, on) { const l = el("label", {}); const i = el("input", { type: "checkbox" }); i.checked = val; i.onchange = () => on(i.checked); l.append(i, label); controls.append(l); return i; },
        select(label, opts, val, on) { const l = el("label", {}, `<span>${label}</span>`); const s = el("select", { class: "btn" }, opts.map((o) => `<option value="${o[0]}">${o[1]}</option>`).join("")); s.value = val; s.onchange = () => on(s.value); l.append(s); controls.append(l); return s; },
        readout(html) { const s = el("span", { class: "readout" }, html); controls.append(s); return s; },
        // pointer helper: callback(worldX, worldY, type)
        drag(g, cb) {
          const pos = (e) => { const r = g.cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * g.W, ((e.clientY - r.top) / r.height) * g.H]; };
          let down = false;
          g.cv.addEventListener("pointerdown", (e) => { down = true; g.cv.setPointerCapture(e.pointerId); cb(...pos(e), "down"); });
          g.cv.addEventListener("pointermove", (e) => cb(...pos(e), down ? "drag" : "move"));
          g.cv.addEventListener("pointerup", (e) => { down = false; cb(...pos(e), "up"); });
        },
        animate(fn) { let run = true; const loop = (t) => { if (!run) return; fn(t / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); return () => (run = false); },
      };
      try { fn(fig, api); } catch (e) { console.error(e); }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initEnvs();
    renderMath(document.body);
    initSteps();
    initReader();
    initViz();
    initExplainers();
  });
})();
