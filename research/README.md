# Research files

One JSON file per batch of objects. Each entry records the outcome of checking one object against its sources. Nothing reaches `src/data` without going through here.

## Entry format

```json
{
  "id": "m87",
  "size": 3.8e13,
  "basis": "diametro dell'orizzonte degli eventi (due raggi di Schwarzschild)",
  "verdict": "confirmed",
  "flags": ["n"],
  "desc": "Due o tre frasi in italiano.",
  "sources": [
    {
      "title": "First M87 Event Horizon Telescope Results. I.",
      "url": "https://...",
      "publisher": "Event Horizon Telescope Collaboration, ApJL",
      "evidence": "M = (6.5 ± 0.7) × 10^9 Msun"
    }
  ],
  "note": "",
  "verified": "2026-11-12"
}
```

- **size**: metres; the diameter or largest extent the sources support.
- **basis**: what the size measures. Required, because "size" is ambiguous for most objects.
- **verdict**
  - `confirmed`: the current value is supported as it is.
  - `corrected`: the value changes. Needs the `r` flag and a `note` saying from what to what and why.
  - `uncertain`: sources disagree or the error bars are wide. Needs the `u` flag; the description gives the range.
  - `remove`: no reliable source. Needs a `note`. The object is not removed automatically; it is listed for a decision.
- **flags**: the object's flags after the check (`r` updated, `n` new since the 2012 list, `i` hypothetical, `u` uncertain).
- **desc**: two or three sentences, plain Italian, no marketing tone. Time-sensitive facts are fine: the `verified` date covers them.
- **sources**: at least one. Primary or institutional only (NASA/JPL, ESA, ESO, CODATA/NIST, IAU/MPC, SIMBAD/NED, peer-reviewed papers or arXiv, official bodies). Wikipedia can help find a source but is never cited.
- **evidence**: the figure or short phrase in the source that supports the value, copied as written. It stays in the research file so anyone can re-check the claim.

## Commands

```bash
node scripts/apply-research.mjs --check research/<batch>.json
```

```bash
node scripts/check-links.mjs research/<batch>.json
```

```bash
node scripts/apply-research.mjs research/<batch>.json
```
