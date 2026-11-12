/**
 * Research files (research/<batch>.json) hold the outcome of checking each object
 * against its sources. They are validated, then applied to src/data; nothing
 * reaches the site without a source, its supporting evidence and a date.
 */
import type { Flag, LocaleFile, ObjectRecord, Source } from './types.ts';

export type Verdict = 'confirmed' | 'corrected' | 'uncertain' | 'remove';

export interface ResearchSource extends Source {
  publisher: string;
  /** The figure or short phrase in the source that supports the value. Kept in the research file only. */
  evidence: string;
}

export interface ResearchEntry {
  id: string;
  /** Diameter or largest extent, in metres, as supported by the sources. */
  size: number;
  /** What the size measures, e.g. "diametro medio", "lunghezza", "diametro dell'orizzonte degli eventi". */
  basis: string;
  verdict: Verdict;
  /** The object's flags after the check. */
  flags: Flag[];
  /** Italian description, two or three sentences. */
  desc: string;
  sources: ResearchSource[];
  /** What changed and why; required for corrected values and removals. */
  note: string;
  /** ISO date of the check. */
  verified: string;
}

export interface Applied {
  objects: ObjectRecord[];
  locale: LocaleFile;
  /** Ids whose data was updated. */
  applied: string[];
  /** Objects the research suggests dropping; left untouched until someone decides. */
  proposedRemovals: { id: string; note: string }[];
}

const VERDICTS: readonly Verdict[] = ['confirmed', 'corrected', 'uncertain', 'remove'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** A sentence ends at . ! or ? followed by a capitalised start, or by the end of the text. */
const SENTENCE_END = /[.!?](?=\s+[\p{Lu}\d«"“(]|\s*$)/gu;
/** Sizes are compared with a little tolerance so 1.2742e7 and 12742000 count as equal. */
const sameSize = (a: number, b: number) => Math.abs(a - b) <= Math.abs(b) * 1e-9;

export function validateResearch(entries: ResearchEntry[], objects: ObjectRecord[]): string[] {
  const problems: string[] = [];
  const current = new Map(objects.map((o) => [o.id, o]));
  const seen = new Set<string>();

  for (const e of entries) {
    const object = current.get(e.id);
    if (!object) {
      problems.push(`${e.id}: no such object`);
      continue;
    }
    if (seen.has(e.id)) problems.push(`${e.id}: appears more than once`);
    seen.add(e.id);

    if (!VERDICTS.includes(e.verdict)) problems.push(`${e.id}: unknown verdict "${e.verdict}"`);
    if (!ISO_DATE.test(e.verified)) problems.push(`${e.id}: verified must be a date like 2026-11-12`);
    if (e.verdict === 'remove') {
      if (!e.note.trim()) problems.push(`${e.id}: a removal needs a note saying why`);
      continue;
    }

    if (!(Number.isFinite(e.size) && e.size > 0)) problems.push(`${e.id}: size must be a positive number`);
    if (!e.basis.trim()) problems.push(`${e.id}: basis is missing (what does the size measure?)`);

    const changed = !sameSize(e.size, object.size);
    if (e.verdict === 'corrected') {
      if (!changed) problems.push(`${e.id}: verdict is "corrected" but the size is unchanged`);
      if (!e.flags.includes('r')) problems.push(`${e.id}: a corrected value needs the "r" flag`);
      if (!e.note.trim()) problems.push(`${e.id}: a corrected value needs a note saying what changed`);
    }
    if (e.verdict === 'confirmed' && changed) problems.push(`${e.id}: size changed but verdict is "confirmed"`);
    if (e.verdict === 'uncertain' && !e.flags.includes('u')) problems.push(`${e.id}: an uncertain value needs the "u" flag`);

    const sentences = e.desc.match(SENTENCE_END)?.length ?? 0;
    if (sentences < 2 || sentences > 3) problems.push(`${e.id}: description must be 2 or 3 sentences, found ${sentences}`);

    if (!e.sources.length) problems.push(`${e.id}: no source`);
    e.sources.forEach((source, i) => {
      const label = `${e.id}: source ${i + 1}`;
      if (!source.title.trim()) problems.push(`${label} has no title`);
      if (!source.url.startsWith('https://')) problems.push(`${label} address must start with https://`);
      if (!source.evidence.trim()) problems.push(`${label} has no evidence`);
      if (/(^|\.)wikipedia\.org\//.test(source.url.replace(/^https?:\/\//, ''))) {
        problems.push(`${label} is Wikipedia, cite the primary source instead`);
      }
    });
  }
  return problems;
}

/** Returns updated copies of the data; the inputs are left as they were. */
export function applyResearch(objects: ObjectRecord[], locale: LocaleFile, entries: ResearchEntry[]): Applied {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const applied: string[] = [];
  const proposedRemovals: Applied['proposedRemovals'] = [];
  const texts = { ...locale.objects };

  const updated = objects.map((object) => {
    const e = byId.get(object.id);
    if (!e) return object;
    if (e.verdict === 'remove') {
      proposedRemovals.push({ id: e.id, note: e.note });
      return object;
    }
    applied.push(e.id);
    texts[e.id] = { name: texts[e.id].name, desc: e.desc };
    return {
      ...object,
      size: e.size,
      flags: [...e.flags],
      sources: e.sources.map(({ title, url, publisher }) => ({ title, url, publisher })),
      verified: e.verified,
    };
  });

  // The scene relies on size order; a corrected size can move an object.
  updated.sort((a, b) => a.size - b.size);
  return { objects: updated, locale: { ui: locale.ui, objects: texts }, applied: applied.sort(), proposedRemovals };
}
