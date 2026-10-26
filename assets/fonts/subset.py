#!/usr/bin/env python3
"""Rebuild the self-hosted fonts from their upstream releases.

Downloads each family from the author's own repository or release (never a
mirror), checks its OFL declares no Reserved Font Name, then subsets it to
the character ranges the design system uses and writes WOFF2 files, the
upstream OFL.txt and a SOURCE.md into assets/fonts/<family>/.

Usage (needs fontTools and brotli; certifi helps where Python lacks CA certificates):
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli certifi
    .venv/bin/python assets/fonts/subset.py
"""

import io
import re
import ssl
import sys
import urllib.request
import zipfile
from datetime import date
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"

# Unicode ranges, matching the unicode-range of each @font-face in tokens.css.
LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"
ARABIC = "U+0600-06FF,U+0750-077F,U+0870-089F,U+08A0-08FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC"
HEBREW = "U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F"

# Each family: where it comes from, which file in it, and what we build.
# "zip" sources name the file inside the archive; "raw" sources are direct.
FAMILIES = {
    "figtree": {
        "name": "Figtree",
        "version": "v2.0.3",
        "repo": "https://github.com/erikdkennedy/figtree",
        "font": ("raw", "https://raw.githubusercontent.com/erikdkennedy/figtree/v2.0.3/fonts/variable/Figtree%5Bwght%5D.ttf", None),
        "ofl": ("raw", "https://raw.githubusercontent.com/erikdkennedy/figtree/v2.0.3/OFL.txt", None),
        "outputs": [("figtree-latin.woff2", None, LATIN), ("figtree-latin-ext.woff2", None, LATIN_EXT)],
    },
    "literata": {
        "name": "Literata",
        "version": "3.103",
        "repo": "https://github.com/googlefonts/literata",
        "font": ("zip", "https://github.com/googlefonts/literata/releases/download/3.103/3.103.zip", "fonts/variable/Literata[opsz,wght].ttf"),
        "italic": ("zip", "https://github.com/googlefonts/literata/releases/download/3.103/3.103.zip", "fonts/variable/Literata-Italic[opsz,wght].ttf"),
        "ofl": ("zip", "https://github.com/googlefonts/literata/releases/download/3.103/3.103.zip", "OFL.txt"),
        "outputs": [("literata-latin.woff2", None, LATIN), ("literata-latin-ext.woff2", None, LATIN_EXT), ("literata-italic-latin.woff2", "italic", LATIN)],
    },
    "jetbrains-mono": {
        "name": "JetBrains Mono",
        "version": "v2.304",
        "repo": "https://github.com/JetBrains/JetBrainsMono",
        "font": ("raw", "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/v2.304/fonts/variable/JetBrainsMono%5Bwght%5D.ttf", None),
        "ofl": ("raw", "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/v2.304/OFL.txt", None),
        "outputs": [("jetbrains-mono-latin.woff2", None, LATIN)],
    },
    "noto-sans-arabic": {
        "name": "Noto Sans Arabic",
        "version": "NotoSansArabic-v2.013",
        "repo": "https://github.com/notofonts/arabic",
        "font": ("zip", "https://github.com/notofonts/arabic/releases/download/NotoSansArabic-v2.013/NotoSansArabic-v2.013.zip", "NotoSansArabic/unhinted/variable-ttf/NotoSansArabic[wdth,wght].ttf"),
        "ofl": ("zip", "https://github.com/notofonts/arabic/releases/download/NotoSansArabic-v2.013/NotoSansArabic-v2.013.zip", "OFL.txt"),
        "pin": {"wdth": 100},
        "outputs": [("noto-sans-arabic.woff2", None, ARABIC)],
    },
    "noto-naskh-arabic": {
        "name": "Noto Naskh Arabic",
        "version": "NotoNaskhArabic-v2.021",
        "repo": "https://github.com/notofonts/arabic",
        "font": ("zip", "https://github.com/notofonts/arabic/releases/download/NotoNaskhArabic-v2.021/NotoNaskhArabic-v2.021.zip", "NotoNaskhArabic/unhinted/variable-ttf/NotoNaskhArabic[wght].ttf"),
        "ofl": ("zip", "https://github.com/notofonts/arabic/releases/download/NotoNaskhArabic-v2.021/NotoNaskhArabic-v2.021.zip", "OFL.txt"),
        "outputs": [("noto-naskh-arabic.woff2", None, ARABIC)],
    },
    "noto-sans-hebrew": {
        "name": "Noto Sans Hebrew",
        "version": "NotoSansHebrew-v3.001",
        "repo": "https://github.com/notofonts/hebrew",
        "font": ("zip", "https://github.com/notofonts/hebrew/releases/download/NotoSansHebrew-v3.001/NotoSansHebrew-v3.001.zip", "NotoSansHebrew/unhinted/variable-ttf/NotoSansHebrew[wdth,wght].ttf"),
        "ofl": ("zip", "https://github.com/notofonts/hebrew/releases/download/NotoSansHebrew-v3.001/NotoSansHebrew-v3.001.zip", "OFL.txt"),
        "pin": {"wdth": 100},
        "outputs": [("noto-sans-hebrew.woff2", None, HEBREW)],
    },
}


def fetch(url: str) -> bytes:
    """Download once into the cache, then reuse."""
    CACHE.mkdir(exist_ok=True)
    cached = CACHE / re.sub(r"[^A-Za-z0-9._-]", "_", url)
    if not cached.exists():
        try:  # python.org builds on macOS ship without CA certificates
            import certifi
            context = ssl.create_default_context(cafile=certifi.where())
        except ImportError:
            context = ssl.create_default_context()
        with urllib.request.urlopen(url, context=context) as response:
            cached.write_bytes(response.read())
    return cached.read_bytes()


def read(source) -> bytes:
    kind, url, member = source
    data = fetch(url)
    if kind == "raw":
        return data
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = [n for n in archive.namelist() if n.endswith(member) and "__MACOSX" not in n]
        if not names:
            sys.exit(f"{member} not found in {url}")
        return archive.read(min(names, key=len))


def to_unicodes(ranges: str) -> list[int]:
    codes = []
    for part in ranges.split(","):
        part = part.strip().removeprefix("U+")
        start, _, end = part.partition("-")
        codes.extend(range(int(start, 16), int(end or start, 16) + 1))
    return codes


def build(slug: str, spec: dict) -> None:
    out_dir = HERE / slug
    out_dir.mkdir(exist_ok=True)

    ofl = read(spec["ofl"]).decode("utf-8")
    if re.search(r"with Reserved Font Names?", ofl, re.IGNORECASE):
        sys.exit(f"{spec['name']} declares a Reserved Font Name: ship it unmodified or choose another font.")
    (out_dir / "OFL.txt").write_text(ofl, encoding="utf-8")

    for filename, style, ranges in spec["outputs"]:
        font = TTFont(io.BytesIO(read(spec[style or "font"])))
        if spec.get("pin"):
            # Pin unused axes (width), then reload so the subsetter sees plain tables.
            pinned = io.BytesIO()
            instancer.instantiateVariableFont(font, spec["pin"]).save(pinned)
            font = TTFont(io.BytesIO(pinned.getvalue()))
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=to_unicodes(ranges))
        subsetter.subset(font)
        font.flavor = "woff2"
        font.save(out_dir / filename)
        print(f"{slug}/{filename}: {(out_dir / filename).stat().st_size // 1024} KB")

    files = "\n".join(f"- `{name}`: {'italic, ' if style else ''}{ranges}" for name, style, ranges in spec["outputs"])
    (out_dir / "SOURCE.md").write_text(
        f"# {spec['name']}\n\n"
        f"- Upstream: {spec['repo']}\n"
        f"- Release: {spec['version']}\n"
        f"- Font file: {spec['font'][1]}" + (f" ({spec['font'][2]})" if spec["font"][2] else "") + "\n"
        f"- Licence: SIL Open Font License 1.1, in `OFL.txt` (no Reserved Font Name)\n"
        f"- Built: {date.today().isoformat()} by `assets/fonts/subset.py`"
        + (f", with axes pinned {spec['pin']}" if spec.get("pin") else "")
        + "\n\nSubset to WOFF2:\n\n" + files + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    for slug, spec in FAMILIES.items():
        build(slug, spec)
