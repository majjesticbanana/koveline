#!/usr/bin/env python3
"""Audit the token pairs that Koveline relies on in every selectable theme.

This runs without a production build. It deliberately checks the study states
that used to clash: muted copy, accent controls, correct/wrong sheets and the
filled right/wrong buttons.
"""
from math import *

THEMES = {
    "mahogany": {
        "bg":"#190c09","surface":"#29150f","text":"#f7e8df","text2":"#dcc7bc","muted":"#b19489",
        "accent":"#c66340","accent_bright":"#e48662","accent_ink":"#1a0b07",
        "positive":"#9bc1a0","positive_bg":"#1d251d","negative":"#ee8a80","negative_bg":"#351918",
    },
    "graphite": {
        "bg":"#11161c","surface":"#1b232c","text":"#edf2f6","text2":"#cbd5dd","muted":"#94a2ae",
        "accent":"#7d98ad","accent_bright":"#a9c0d1","accent_ink":"#0b1116",
        "positive":"#9fbea2","positive_bg":"#19241d","negative":"#e09a94","negative_bg":"#321d1e",
    },
    "moss": {
        "bg":"#0f1712","surface":"#19231c","text":"#eef2eb","text2":"#ccd6c8","muted":"#95a38f",
        "accent":"#a47c4f","accent_bright":"#c99a63","accent_ink":"#11100a",
        "positive":"#a6c1a2","positive_bg":"#19251b","negative":"#dc958b","negative_bg":"#321d1b",
    },
    "mulberry": {
        "bg":"#171116","surface":"#261c25","text":"#f3ebf0","text2":"#d8c8d2","muted":"#a894a1",
        "accent":"#a77a8e","accent_bright":"#cf9fb3","accent_ink":"#160d12",
        "positive":"#a8bea1","positive_bg":"#1b251d","negative":"#e09a92","negative_bg":"#331c20",
    },
    "ivory": {
        "bg":"#f3efe7","surface":"#fffcf7","text":"#29231e","text2":"#4b4239","muted":"#6f6359",
        "accent":"#8c553f","accent_bright":"#714330","accent_ink":"#fffaf4",
        "positive":"#3f6547","positive_bg":"#e7efe6","negative":"#984b45","negative_bg":"#f4e4e1",
    },
}


def luminance(hex_value):
    h = hex_value.lstrip("#")
    channels = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    channels = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2]


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + .05) / (min(la, lb) + .05)


CHECKS = [
    ("body text", "text", "bg", 4.5),
    ("secondary text", "text2", "bg", 4.5),
    ("muted text", "muted", "bg", 4.5),
    ("muted on cards", "muted", "surface", 4.5),
    ("accent link", "accent_bright", "bg", 4.5),
    ("accent on cards", "accent_bright", "surface", 4.5),
    ("accent button", "accent_ink", "accent", 4.5),
    ("accent hover button", "accent_ink", "accent_bright", 4.5),
    ("correct state", "positive", "positive_bg", 4.5),
    ("wrong state", "negative", "negative_bg", 4.5),
    # Filled mark buttons use the page background token as their foreground.
    ("filled correct button", "bg", "positive", 4.5),
    ("filled wrong button", "bg", "negative", 4.5),
]

failed = []
for theme, palette in THEMES.items():
    print(f"\n{theme}")
    for label, fg, bg, minimum in CHECKS:
        ratio = contrast(palette[fg], palette[bg])
        print(f"  {ratio:5.2f}:1  {label}")
        if ratio < minimum:
            failed.append((theme, label, ratio, minimum))

if failed:
    print("\nFAILED")
    for theme, label, ratio, minimum in failed:
        print(f"  {theme}: {label} = {ratio:.2f}:1 (needs {minimum}:1)")
    raise SystemExit(1)

print("\nAll canonical theme text/state pairs meet WCAG AA 4.5:1.")
