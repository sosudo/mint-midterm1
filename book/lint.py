#!/usr/bin/env python3
"""Catch HTML nesting mistakes in book/src that browsers silently 'repair'."""
import re, sys
from pathlib import Path
bad = 0
for f in sorted(Path(__file__).parent.glob("src/*.html")):
    s = f.read_text()
    for m in re.finditer(r"<p[ >](?:(?!</p>).)*?<(div|ul|ol|figure|svg|table|h\d)\b", s, re.S):
        line = s[: m.start()].count("\n") + 1
        print(f"{f.name}:{line}: <{m.group(1)}> inside <p>"); bad += 1
    for m in re.finditer(r'<span class="why">((?:(?!</span>).)*?)<(div|ul|ol|span)\b', s, re.S):
        line = s[: m.start()].count("\n") + 1
        print(f"{f.name}:{line}: <{m.group(2)}> inside span.why"); bad += 1
    for m in re.finditer(r"\$\$(.*?)\$\$", s, re.S):
        if re.search(r"<(?!/?(sub|sup)\b)[a-z]", m.group(1)):
            print(f"{f.name}:{s[:m.start()].count(chr(10))+1}: HTML tag inside display math"); bad += 1
sys.exit(1 if bad else 0)
