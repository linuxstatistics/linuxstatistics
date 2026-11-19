#!/usr/bin/env python3
"""Search-result lengths on every indexable page of a built site.

Usage: check-meta.py DIST [--list]
Exit 1 when any page without noindex has a <title> over 65 characters or a
meta description outside 70-155 (Bing flags titles over about 70 and
descriptions outside about 50-160). Keep in step with src/lib/meta-length.ts.
"""
import html
import os
import re
import sys

TITLE_MAX, DESC_MIN, DESC_MAX = 65, 70, 155


def pages(root):
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f.endswith(".html"):
                yield os.path.join(dirpath, f)


def main():
    root = sys.argv[1]
    listing = "--list" in sys.argv
    bad, checked = [], 0
    for path in pages(root):
        s = open(path, encoding="utf8").read()
        if re.search(r'<meta name="robots" content="[^"]*noindex', s):
            continue
        t = re.search(r"<title>(.*?)</title>", s, re.S)
        d = re.search(r'<meta name="description" content="([^"]*)"', s)
        if not t:
            continue
        checked += 1
        title = html.unescape(t.group(1)).strip()
        desc = html.unescape(d.group(1)).strip() if d else ""
        rel = "/" + os.path.relpath(path, root).replace("index.html", "")
        if len(title) > TITLE_MAX:
            bad.append((rel, f"title {len(title)} > {TITLE_MAX}", title))
        if not DESC_MIN <= len(desc) <= DESC_MAX:
            bad.append((rel, f"description {len(desc)} outside {DESC_MIN}-{DESC_MAX}", desc))
    if listing or bad:
        for rel, why, text in sorted(bad):
            print(f"{rel}: {why}: {text}")
    print(f"meta lengths: {checked} indexable pages, {len(bad)} problems")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
