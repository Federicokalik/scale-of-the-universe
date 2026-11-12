# Research brief (read fully before starting)

You are verifying data for a public educational website, "Scala dell'Universo 2026" (Italian): an interactive zoom through objects from 10⁻³⁵ m to 10²⁷ m. People will trust what it says, so every value must be backed by a source you actually opened.

Repo: `C:\Users\Utente\Desktop\ventisei`. You are given one batch name, e.g. `stars-2`.

- **Input**: `research/_input/<batch>.json` — the objects to check: `id`, Italian `name`, current `size` in metres, current `flags`, current Italian `desc` (may be empty).
- **Output**: `research/<batch>.json` — a JSON array with one entry per input object. This is the ONLY file you may create or change. Do not touch anything else, do not run git, do not start servers.
- **Format and rules**: read `research/README.md` first. `research/black-holes.json` is a finished example to imitate.
- `verified` is `2026-11-12`.

## What to do for each object

1. Work out what the current size is meant to measure (diameter, length, height, wavelength, distance, largest extent). Write that in `basis`, in Italian.
2. Find a primary or institutional source for that measure and open it (WebSearch, then WebFetch). One good source is enough; add a second only when it adds something (a second measurement, or the claim in the description).
3. Decide the verdict:
   - `confirmed` — the source supports the current size within about 5% (or within the natural spread of the thing: an "average" cat, a typical cell). Keep `size` exactly as given.
   - `corrected` — the best supported value differs by more than that. Set the new `size`, add the `r` flag (keep the other flags), and say in `note` from what to what and why.
   - `uncertain` — sources disagree, error bars are wide, or the size is a convention rather than a measurement. Add the `u` flag and give the range or the caveat in the description.
   - `remove` — you found no reliable source at all. Explain in `note`.
4. Write `desc`: Italian, exactly 2 or 3 sentences, plain and factual. Say what the thing is, give the key figure, add one fact that makes it worth a look. Italian number formatting (decimal comma, dot for thousands). No em dashes, no marketing words, no exclamation marks. Keep any still-true, checked fact from the current description; drop what you cannot support and say so in `note`.
5. Keep the existing flags unless the rules above change them. `n` = not in the original 2012 list, `i` = hypothetical/never observed, `u` = uncertain, `r` = value updated.

## Hard rules

- **Never invent** a number, URL, author, date or quote. If you cannot find it, say so.
- **Open every URL you cite** and confirm the page states the figure. `evidence` is the figure or short phrase copied from that page (under 15 words). If a page will not open, do not cite it.
- **No Wikipedia** as a cited source (fine for finding the primary one). No content farms, no AI-generated summaries, no forums.
- Prefer, in order: the measuring body or mission (NASA/JPL fact sheets and mission pages, ESA, ESO, NOIRLab, STScI), standards bodies (BIPM, NIST/CODATA, ISO summaries, IAU, Minor Planet Center), databases (SIMBAD, NED, JPL Small-Body Database, PDG, PubChem, RCSB PDB, UniProt), the paper itself (journal page, arXiv abstract, ADS), official bodies and manufacturers for buildings, vehicles and products, universities and museums, established encyclopedias (Britannica, Treccani) for everyday things.
- Units: convert carefully to metres and show the arithmetic in `note` whenever you change a size or derive it (for example an angular size and a distance, or a radius doubled to a diameter).
- Superlatives and dated claims ("il più grande", "scoperto nel", "arriva nel 2029") must be checked too. Soften or drop the ones you cannot support.

## Category notes

- **particles**: elementary particles have no measured size. The current values are conventions or experimental upper limits. Keep the size, use `uncertain` with `u` (or keep `i` for hypothetical ones), and source the physical fact in the description (mass, limit, experiment) from PDG, CERN, Fermilab, DESY or the paper.
- **atoms**: state which radius is meant (covalent, van der Waals, charge radius, Bohr) and that the size is twice that radius. CODATA/NIST for nuclei and constants.
- **waves**: the size is a wavelength. Source the band limits or the specific line (ITU, NIST, NASA, ESA).
- **molecules**: bond lengths and molecular dimensions from NIST CCCBDB, PubChem, RCSB PDB, or the paper.
- **units**: the size is the unit's length. Source the definition (BIPM SI Brochure, NIST) and give one concrete comparison in the description.
- **biology**: sizes vary; say "tipicamente" or give the range. Sources: university or museum pages, NCBI Bookshelf, Animal Diversity Web, IUCN, Britannica.
- **objects** and **places**: official or manufacturer figures, standards, government and UNESCO pages, Britannica, Guinness World Records for records.
- **solar-system**: NASA NSSDCA fact sheets, JPL Solar System Dynamics, JPL Small-Body Database, mission pages. Size is the mean diameter unless the object is irregular (then the longest axis).
- **stars**: diameter = 2 × radius; radii from the measurement paper or SIMBAD-linked references. Supergiant radii are often contested: use `uncertain` freely and give the range in solar radii.
- **distances**: the size is a distance or an extent; say between what and what.
- **nebulae**, **galaxies**, **cosmic**: physical size usually comes from angular size × distance; state both and the source of each. NED, SIMBAD, ESA/Hubble, NOIRLab, ESO, the discovery paper. Structures whose reality is debated stay `uncertain`.

## Working method

- Write the output file early and update it as you go, so finished entries are never lost.
- Keep searches focused: aim for one or two page fetches per object.
- Before finishing, run `node scripts/apply-research.mjs --check research/<batch>.json` and fix everything it reports until it exits cleanly. It writes nothing to the site data.

## Report back (under 120 words)

Counts per verdict; then one line for each `corrected` or `remove` entry (id, old → new, source publisher); then anything you are unsure about. Do not paste the JSON.
