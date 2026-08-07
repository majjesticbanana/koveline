#!/usr/bin/env python3
"""Walk every text node in the built HTML, resolve its inherited text/bg
utilities against the emitted CSS, and flag any pair under 3:1.
Run AFTER `npm run build`:   python3 scripts/audit-contrast.py
Requires: pip install beautifulsoup4
"""
import re, glob, sys
from bs4 import BeautifulSoup

css = " ".join(open(f, encoding="utf8", errors="ignore").read()
               for f in glob.glob(".next/static/**/*.css", recursive=True))
if not css:
    sys.exit("no built CSS found — run `npm run build` first")

def utils(prop):
    out = {}
    for m in re.finditer(
        r'\.((?:text|bg)-[a-z0-9\-\/\[\]#\.\\]+?)\s*\{[^}]*?' + prop + r':\s*([^;}]+)[;}]', css):
        out[m.group(1).replace("\\", "")] = m.group(2).strip()
    return out

TXT = {k: v for k, v in utils("color").items() if k.startswith("text-")}
BG = {k: v for k, v in utils("background-color").items() if k.startswith("bg-")}
BODY_COLOR, BODY_BG = "#2a1f16", "#f6efe2"   # keep in sync with globals.css

def lum(v):
    m = re.match(r'#([0-9a-f]{6})', v)
    if m:
        c = [int(m.group(1)[i:i+2], 16) / 255 for i in (0, 2, 4)]
    else:
        m = re.match(r'rgb\((\d+)[ ,]+(\d+)[ ,]+(\d+)', v)
        if not m:
            return None
        c = [int(x) / 255 for x in m.groups()]
    c = [x/12.92 if x <= 0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]

def contrast(a, b):
    la, lb = lum(a), lum(b)
    if la is None or lb is None:
        return None
    return (max(la, lb) + .05) / (min(la, lb) + .05)

bad, seen = [], set()
for page in glob.glob(".next/server/app/**/*.html", recursive=True):
    soup = BeautifulSoup(open(page, encoding="utf8"), "html.parser")
    for el in soup.find_all(True):
        t = el.find(string=True, recursive=False)
        if not t or len(t.strip()) < 2:
            continue
        # decorative text (aria-hidden anywhere up the chain) is exempt —
        # e.g. the oversized margin unit numbers, which have a visible twin
        if any((n.get("aria-hidden") == "true") for n in [el] + list(el.parents) if hasattr(n, "get")):
            continue
        color, bg = BODY_COLOR, BODY_BG
        chain = [el] + list(el.parents)
        for n in chain:
            hit = [c for c in (n.get("class") or []) if c in TXT]
            if hit:
                color = TXT[hit[-1]]; break
        for n in chain:
            hit = [c for c in (n.get("class") or []) if c in BG and "/" not in c]
            if hit:
                bg = BG[hit[-1]]; break
        r = contrast(color, bg)
        if r is not None and r < 3:
            key = (round(r, 2), color, bg, t.strip()[:30])
            if key in seen:
                continue
            seen.add(key)
            bad.append((page.split("app/")[-1], *key))

for b in bad:
    print(f"{b[1]:>5}:1  {b[2][:18]} on {b[3][:18]}  {b[0]}  \"{b[4]}\"")
print(f"{len(bad)} low-contrast text node(s)")
sys.exit(1 if bad else 0)
