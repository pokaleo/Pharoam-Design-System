# Pharoam design system

The visual language, domain vocabulary and components Pharoam is built from, in light and dark, compact and comfortable.

Open `index.html` in a browser for the full system. Two sample views show it applied:

- `samples/skills.html`: the skills overview
- `samples/gap.html`: the gap to a pathway

Every page has switches for theme, density and contrast. In the samples, "Name the vocabulary" labels each domain item where it appears. You can also open a page with `?theme=dark`, `?density=comfortable`, `?contrast=more` or `?dir=rtl`. The pages work straight from the file system; nothing loads from a third party.

## Brand

The identity is the Line P seal in the Graphite and channel colour scheme. It lives in `brand/`: open `brand/index.html` for the brand board, and see `brand/README.md` for the files, colours and rules. The design system and both sample views use it.

## Asset licensing

This design system is © 2026 The Pharoam authors, all rights reserved. It is public so people can see it, but it is not open source:
- **Allowed:** viewing it and forking it on GitHub.
- **Not allowed without our written permission:** using, copying, modifying or building on it, commercially or not.

See `LICENSE`. The Pharoam name and brand assets are covered by `brand/LICENSE`. To ask for permission, start a GitHub Discussion in this repository.

Only third-party fonts and icons are under other licences, listed in `THIRD_PARTY_LICENSES.md`.

### Adding a third-party asset

1. **Check the licence first.** It must let us bundle, self-host, modify and redistribute the asset, including commercially.
   - **Allowed:** `OFL-1.1` (fonts), `Apache-2.0`, `MIT`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`, `CC0-1.0`, `CC-BY-4.0` (images, with credit).
   - **Not allowed:** "free for personal use", freeware with unclear terms, any non-commercial or no-derivatives licence (`CC-BY-NC-*`, `CC-BY-ND-*`), and commercial licences. Ask before adding anything else.
2. **Get it from upstream:** the author's or foundry's own repository or release, never a download mirror or CDN.
3. **Check for a Reserved Font Name** in a font's OFL. If there is one, ship the font unmodified, or choose another font.
4. **Put it in its own folder** with its licence file and a `SOURCE.md` giving the upstream URL, version and download date:
   - fonts in `assets/fonts/<family>/`
   - icons in `assets/icons/<set>/`
   - images in `assets/images/<source>/`
5. **Subset or convert with the recorded script** (`assets/fonts/subset.py`), so the result can be reproduced.
6. **Add it to `REUSE.toml`** and to `THIRD_PARTY_LICENSES.md`.
7. **Don't load it from the network.** No Google Fonts, no CDNs, no remote images. Everything is served from this repository.

### Adding our own asset

1. **Brand files** (name, seal, wordmark, and icons made from them) go in `brand/`.
2. **Everything else** goes where it belongs. It is covered by `LICENSE`.
3. **Record how it was made** in the commit message: by hand, from a template (which one), or with an AI tool (which one). Never use stock images or templates whose licence we can't check.

## What is where

| Path | Contents |
| --- | --- |
| `index.html` | Identity, foundations, domain vocabulary (each item in light and dark), components, organisation slots, accessibility and languages, voice |
| `assets/css/tokens.css` | Every value: colour for both themes, type, density, shape, motion, more-contrast mode, and the shadcn/ui variable names mapped onto Pharoam roles |
| `assets/css/pharoam.css` | Components. Logical properties throughout, so they mirror for right-to-left languages |
| `assets/css/doc.css` | Layout of the document and sample frames only, not part of the product |
| `brand/` | The identity: seal, wordmark (outlined), line P, favicon, app icon, brand board; its own `LICENSE` |
| `LICENSE`, `THIRD_PARTY_LICENSES.md`, `REUSE.toml`, `LICENSES/` | What is ours (all rights reserved), what is third-party, and the licence of every file |
| `assets/fonts/` | Figtree, Literata, JetBrains Mono, Noto Arabic and Hebrew: one folder per family with its upstream `OFL.txt` and `SOURCE.md`, rebuilt by `subset.py` |
| `assets/icons/lucide/` | Lucide icon sprite, with its licence (ISC and MIT) |
| `assets/js/glyphs.js`, `brand/marks.js` | Our AI monogram, and the seal and wordmark for inline use |

## Main decisions

- **Identity:** the Line P seal. A capital P drawn as a lighthouse in one even line sits in a seal with a beam running past the edge. In the wordmark the open line P is the first letter. See `brand/`.
- **Colour:** Graphite and channel. Graphite is the brand and the one filled button; Channel blue is the one hue for evidence, links and the main data; gold appears only in the seal and as a highlight. There is no green anywhere. Amber means "needs attention" and red means a real problem.
- **Type:** Figtree for the interface and every title; Literata for long reading only.
- **Levels:** five named steps. The stair glyph lights only the step you are on, so it never reads as a meter.
- **AI:** everything AI-made has a dashed edge, the AI monogram, the model's name and a disclaimer.

## Before this is used for real

- The Arabic and German specimens are illustrative and need a translator's review.
- The people, organisations and records in the samples (Maya Varnhollow, Pellwick Energy, Ostmere University, Tarrowen College, "Sample data roles") are invented, and web addresses use the reserved `example.org` and `example.net` domains.
