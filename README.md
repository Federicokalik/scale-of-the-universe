# Scale of the Universe 2026

An interactive zoom through 447 objects, from the Planck length (10⁻³⁵ m) to the observable universe (10²⁷ m), each drawn to scale.

> **Live at <https://federicokalik.github.io/scale-of-the-universe/>.**
>
> Italian is the original language. English, German, Dutch (Belgium), Portuguese (Brazil), Spanish, French, Russian, Simplified Chinese, Arabic and Japanese are automatic translations, not reviewed by native speakers. `node scripts/check-translations.mjs` checks them against the Italian for missing entries, lost placeholders and lost numbers.

## Credit

This is an independent reinterpretation of **[Scale of the Universe](https://scaleofuniverse.com/)** by Cary and Michael Huang. The idea and the list of objects come from their work. Artwork, text, code and music in this repository are new; nothing from the original was copied. Go and see the original.

## An experiment

The whole project is an experiment to try **Claude Fable 5.2**, Anthropic's model. The model wrote the code and the text, researched and checked the data and chose the images on its own, starting from Federico Calicchia's requests. No person has reviewed the result: the site is published as the model produced it, and it may contain errors.

## Privacy

No cookies, no tracking, no analytics, no third-party requests. The only thing remembered is the language you pick, and it stays in your browser.

## Run it locally

Requires Node 22.23.4 or newer.

```bash
npm install
npm run dev
```

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Builds the static site into `dist/` |
| `npm test` | Unit tests |
| `npm run test:e2e` | Browser tests against the built site (run `npm run build` first) |
| `npm run validate` | Checks the data in `src/data` for coherence |

## Where things are

- `src/data/objects.json` — sizes, kinds and flags, independent of language
- `src/data/i18n/` — names, descriptions and interface text, one file per language
- `src/engine/` — the canvas scene, input, music and glass effect
- `reference/draft.html` — the single-file draft this project started from

## Author

[Federico Calicchia](https://calicchia.design/)

## Publishing

The site deploys to GitHub Pages from `main` through `.github/workflows/deploy.yml`. Two settings live in the repository, not in the code (Settings → Pages):

1. **Source**: GitHub Actions.
2. **Custom domain**: none. The site is served at `https://federicokalik.github.io/scale-of-the-universe/`; the folder is set as `base` in `astro.config.mjs`.

## Licence

- **Code**: MIT, see [`LICENSE`](LICENSE).
- **Text, data and original illustrations** (`src/data/`, the SVG files in `public/img/`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Photographs** (the `-256.webp` and `-800.webp` files of objects listed as photographs in [`CREDITS.md`](CREDITS.md)): each keeps its own author and licence (public domain, CC0, CC BY or CC BY-SA), listed there and on the object's card.
