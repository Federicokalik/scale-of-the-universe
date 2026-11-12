# Scale of the Universe 2026

An interactive zoom through 447 objects, from the Planck length (10⁻³⁵ m) to the observable universe (10²⁷ m), each drawn to scale.

> **Work in progress.** The foundations are in place; source-checking every value, real images and translations are still to come.

## Credit

This is an independent reinterpretation of **[Scale of the Universe](https://scaleofuniverse.com/)** by Cary and Michael Huang. The idea and the list of objects come from their work. Artwork, text, code and music in this repository are new; nothing from the original was copied. Go and see the original.

## An experiment

The whole project is an experiment to try **Claude Fable 5.2**, Anthropic's model, which wrote the code and the text under the direction of Federico Calicchia.

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
2. **Custom domain**: `scale-of-universe.calicchia.design`, with a DNS `CNAME` record pointing to `federicokalik.github.io`.
