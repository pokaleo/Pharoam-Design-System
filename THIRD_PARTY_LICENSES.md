# Third-party licences

The Pharoam design system includes the following work by others. Each item keeps its own licence, and each licence file sits next to the files it covers. Nothing in our `LICENSE` or `brand/LICENSE` changes these licences.

## Typefaces

| Typeface | Used for | Authors | Licence | Upstream |
|---|---|---|---|---|
| Figtree | Interface and titles; outlines in the wordmark | The Figtree Project Authors (Erik D. Kennedy) | SIL Open Font License 1.1 (`OFL-1.1`) | https://github.com/erikdkennedy/figtree |
| Literata | Long-form reading | The Literata Project Authors (TypeTogether, for Google) | `OFL-1.1` | https://github.com/googlefonts/literata |
| JetBrains Mono | The "Show file" view and file paths | The JetBrains Mono Project Authors | `OFL-1.1` | https://github.com/JetBrains/JetBrainsMono |
| Noto Sans Arabic, Noto Naskh Arabic | Arabic script | The Noto Project Authors | `OFL-1.1` | https://github.com/notofonts/arabic |
| Noto Sans Hebrew | Hebrew script | The Noto Project Authors | `OFL-1.1` | https://github.com/notofonts/hebrew |

We serve these fonts from this repository. `assets/fonts/subset.py` downloads each one from its upstream release and subsets it to the character ranges we use. None of them declares a Reserved Font Name, so the subsets keep their names. Each family's folder holds its `OFL.txt` and a `SOURCE.md` with the exact release.

## Icons

| Set | Authors | Licence | Upstream |
|---|---|---|---|
| Lucide | Lucide Contributors | ISC (`ISC`) | https://lucide.dev |
| Feather icons included in Lucide (`check`, `chevron-*`, `circle`, `info`, `lock`, `search`, `x`, and others) | Cole Bemis | MIT (`MIT`) | https://github.com/feathericons/feather |

The full licence texts are in `LICENSES/`.
