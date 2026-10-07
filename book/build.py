#!/usr/bin/env python3
"""Build the interactive textbook into ../docs (served by GitHub Pages).

    python book/build.py              # pages only; narration falls back to the device voice
    python book/build.py --audio      # also synthesise narration with Kokoro (cached by text hash)

Audio needs `pip install kokoro-onnx soundfile` plus the model files
kokoro-v1.0.onnx and voices-v1.0.bin (from the kokoro-onnx GitHub releases)
in $KOKORO_DIR, and ffmpeg on PATH.
"""
import hashlib, html, json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
OUT = REPO / "docs"
SRC = ROOT / "src"
VOICE = "af_heart"
SPEED = 0.98

LECTURE_PDFS = ["Lecture#1.pdf", "Lecture#2.pdf", "Lect#3.pdf", "lect#4.pdf", "Lect#5.pdf", "Lect#6.pdf",
                "Lect#7.pdf", "Lect#8.pdf", "Lect#9.pdf", "Lect#10.pdf", "Lect#11.pdf", "Lect#12.pdf"]

# phoneme-level pronunciation fixes for the TTS (espeak output -> preferred)
PHONE_FIX = {
    "lˈɛbɛsɡ": "ləbˈɛɡ",
    "fˈæɾuː": "fætˈuː",
    "fˈɜːmæt": "fɛɹmˈɑː",
    "kˈɔːtʃi": "koʊʃˈiː",
    "fˈɔːɹiɚ": "fˈʊɹieɪ",
    "kˈæɹɐθˌeɪoʊdɚɹi": "kˌɑːɹəθiːˈɔːdəɹi",
    "ˈiːɡoʊɹˌɑːv": "jɪɡˈɔːɹəf",
    "dˈɪɹɪtʃlɪt": "dˌiːɹɪʃlˈeɪ",
    "bˈɔːɹəl": "bɔːɹˈɛl",
    "vaɪtˈɑːli": "vɪtˈɑːli",
}
# text-level substitutions applied before phonemisation
TEXT_FIX = [
    (r"\bi\.e\.", "that is,"), (r"\be\.g\.", "for example,"), (r"\ba\.e\.", "almost everywhere"),
    (r"\bw\.r\.t\.", "with respect to"), (r"\bs\.t\.", "such that"), (r"\bresp\.", "respectively"),
    (r"\bThm\b", "Theorem"), (r"\bProp\b", "Proposition"), (r"\bDef\b", "Definition"), (r"\bRmk\b", "Remark"),
    (r"—", ", "), (r"–", " to "),
]

SAY_RE = re.compile(r'<template class="say">(.*?)</template>', re.S)


def say_text(raw):
    t = re.sub(r"<[^>]+>", "", raw)
    t = html.unescape(t)
    return re.sub(r"\s+", " ", t).strip()


def tts_text(t):
    for a, b in TEXT_FIX:
        t = re.sub(a, b, t)
    return t


class TTS:
    def __init__(self):
        from kokoro_onnx import Kokoro
        d = Path(os.environ.get("KOKORO_DIR", "."))
        self.k = Kokoro(str(d / "kokoro-v1.0.onnx"), str(d / "voices-v1.0.bin"))

    def synth(self, text, out_mp3):
        import soundfile as sf
        ph = self.k.tokenizer.phonemize(tts_text(text), "en-us")
        for a, b in PHONE_FIX.items():
            ph = ph.replace(a, b)
        samples, sr = self.k.create(ph, voice=VOICE, speed=SPEED, is_phonemes=True)
        wav = out_mp3.with_suffix(".wav")
        sf.write(str(wav), samples, sr)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-ac", "1", "-c:a", "libmp3lame",
                        "-b:a", "48k", str(out_mp3)], check=True)
        wav.unlink()
        return round(len(samples) / sr, 2)


def page(title, body, extra_js="", desc=""):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;650&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/katex/katex.min.css">
<script defer src="assets/katex/katex.min.js"></script>
<script defer src="assets/katex/contrib/auto-render.min.js"></script>
<link rel="stylesheet" href="assets/book.css">
<script>try{{var t=localStorage.getItem("mintbook.theme");if(t)document.documentElement.setAttribute("data-theme",JSON.parse(t))}}catch(e){{}}</script>
<script defer src="assets/book.js"></script>
{extra_js}
</head>
<body>
<header class="topbar"><div class="inner">
  <a class="brand" href="index.html">∫ Measure &amp; Integration</a>
  <span class="spacer"></span>
  <button id="stepsBtn" title="Toggle the 'why?' hints on proof steps">Proof hints: on</button>
  <button id="themeBtn" title="Light / dark">◐</button>
</div></header>
<main>
{body}
</main>
</body>
</html>
"""


def main():
    want_audio = "--audio" in sys.argv
    OUT.mkdir(exist_ok=True)
    (OUT / "assets").mkdir(exist_ok=True)
    shutil.copytree(ROOT / "assets", OUT / "assets", dirs_exist_ok=True)
    (OUT / ".nojekyll").write_text("")

    # original scans (for side-by-side checking of the transcription)
    scans = OUT / "scans"
    scans.mkdir(exist_ok=True)
    for i, pdf in enumerate(LECTURE_PDFS, 1):
        if not (scans / f"L{i:02d}-01.jpg").exists() and (REPO / pdf).exists():
            subprocess.run(["pdftoppm", "-r", "100", "-jpeg", "-jpegopt", "quality=72", str(REPO / pdf),
                            str(scans / f"L{i:02d}")], check=True)
            # pdftoppm pads page numbers to the width of the page count; normalise to 2 digits
            for p in scans.glob(f"L{i:02d}-*.jpg"):
                n = int(p.stem.split("-")[1])
                p.rename(scans / f"L{i:02d}-{n:02d}.jpg")

    audio_dir = OUT / "audio"
    audio_dir.mkdir(exist_ok=True)
    dur_file = audio_dir / "durations.json"
    durs = json.loads(dur_file.read_text()) if dur_file.exists() else {}
    tts = None
    used = set()

    lectures = []
    for src in sorted(SRC.glob("lec*.html")):
        text = src.read_text()
        m = re.match(r'\s*<lecture num="(\d+)" title="([^"]*)" desc="([^"]*)">', text)
        if not m:
            sys.exit(f"{src.name}: missing <lecture> header")
        num, title, desc = int(m.group(1)), m.group(2), m.group(3)
        body = text[m.end():].replace("</lecture>", "")
        lectures.append((num, title, desc))

        # page markers -> links to the scans
        body = re.sub(r'<pg p="(\d+)"\s*/?>', lambda mm: f'<span class="pg"><a href="scans/L{num:02d}-{int(mm.group(1)):02d}.jpg" target="_blank" rel="noopener">original notes · p. {mm.group(1)} ↗</a></span>', body)

        # <p> is not allowed inside the inline <span class="why">; use block-styled spans instead
        body = re.sub(r'<span class="why">(.*?)</span>', lambda mm: '<span class="why">' + mm.group(1).replace("<p>", '<span class="wp">').replace("</p>", "</span>") + "</span>", body, flags=re.S)

        # narration -> audio
        def fill(mm):
            nonlocal tts
            raw = mm.group(1)
            t = say_text(raw)
            h = hashlib.sha1(f"{VOICE}|{SPEED}|{tts_text(t)}".encode()).hexdigest()[:14]
            mp3 = audio_dir / f"{h}.mp3"
            if want_audio and not mp3.exists():
                if tts is None:
                    tts = TTS()
                print(f"  tts {src.name}: {t[:70]}…", flush=True)
                durs[h] = tts.synth(t, mp3)
                dur_file.write_text(json.dumps(durs))
            if mp3.exists() and h in durs:
                used.add(h)
                return f'<template class="say" data-audio="audio/{h}.mp3" data-dur="{durs[h]}">{raw}</template>'
            return f'<template class="say">{raw}</template>'
        body = SAY_RE.sub(fill, body)

        js = f'<script defer src="assets/lec{num:02d}.js"></script>' if (ROOT / "assets" / f"lec{num:02d}.js").exists() else ""
        head = f"""<div class="lecture-head"><div class="kicker">Lecture {num}</div><h1>{title}</h1></div>
<div class="howto">Every <b>underlined proof step</b> is selectable — hover or tap it for a detailed explanation of why it holds.
Press <b>▶</b> in the bar at the bottom to have the lecture <b>read and explained aloud</b>; hover a paragraph and click its ▶ to start there.
<b>Explainer</b> panels are narrated animations; <b>Interactive</b> panels respond to sliders and dragging.
The small “original notes” links open the scanned page the text was transcribed from.</div>"""
        nav = '<nav class="pager">'
        nav += f'<a href="lec{num-1:02d}.html">← Lecture {num-1}</a>' if (SRC / f"lec{num-1:02d}.html").exists() else "<span></span>"
        nav += f'<a href="lec{num+1:02d}.html">Lecture {num+1} →</a>' if (SRC / f"lec{num+1:02d}.html").exists() else '<a href="index.html">Contents</a>'
        nav += "</nav>"
        (OUT / f"lec{num:02d}.html").write_text(page(f"Lecture {num}: {title}", head + body + nav, js, desc))
        print(f"built lec{num:02d}.html")

    toc = "".join(f'<li><a href="lec{n:02d}.html"><span class="n">{n}</span><span class="t">{html.escape(t)}</span><span class="d">{html.escape(d)}</span></a></li>' for n, t, d in lectures)
    intro = """<div class="lecture-head"><div class="kicker">Interactive lecture notes</div><h1>Measure &amp; Integration</h1></div>
<p>The handwritten lecture notes in this repository, typeset as an interactive textbook. The text is transcribed from the notes;
on top of it you can select any proof step for an explanation of why it holds, listen to a narrated walk-through of each lecture,
and watch animated explainers of the key ideas.</p>
<p class="howto">Narration uses a natural neural voice that ships with the site as audio files, so it works offline once loaded.
You can switch to your device's own voice (Web Speech API) in the ⚙ menu of the player bar — that voice varies between Mac, iPhone, Chrome, etc.</p>"""
    (OUT / "index.html").write_text(page("Measure & Integration — interactive notes", intro + f'<ol class="toc">{toc}</ol>', "", "Interactive textbook for the lecture notes"))

    if want_audio:  # drop audio no page refers to any more
        for f in audio_dir.glob("*.mp3"):
            if f.stem not in used:
                f.unlink(); durs.pop(f.stem, None)
        dur_file.write_text(json.dumps(durs))
    total = sum(durs.get(h, 0) for h in used)
    print(f"{len(used)} narration clips, {total/60:.1f} min of audio")


if __name__ == "__main__":
    main()
