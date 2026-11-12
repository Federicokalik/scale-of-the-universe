import { FLAGS, KINDS, type LocaleFile, type ObjectRecord } from './types.ts';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Returns a list of human-readable problems; empty when the data is coherent.
 * `strict` adds the requirements that only hold once research is complete.
 */
export function validateData(
  objects: ObjectRecord[],
  locales: Record<string, LocaleFile>,
  { strict = false }: { strict?: boolean } = {},
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();

  // The scene draws and steps through objects in file order, so it must be size order.
  objects.forEach((o, i) => {
    const before = objects[i - 1];
    if (before && o.size < before.size) problems.push(`${o.id}: out of size order (must not be smaller than ${before.id})`);
  });

  for (const o of objects) {
    if (ids.has(o.id)) problems.push(`duplicate id: ${o.id}`);
    ids.add(o.id);
    if (!SLUG.test(o.id)) problems.push(`${o.id}: id is not a slug`);
    if (!(Number.isFinite(o.size) && o.size > 0)) problems.push(`${o.id}: size must be a positive number`);
    if (!KINDS.includes(o.kind)) problems.push(`${o.id}: unknown kind "${o.kind}"`);
    for (const f of o.flags) if (!FLAGS.includes(f)) problems.push(`${o.id}: unknown flag "${f}"`);
    if (strict) {
      if (!o.sources.length) problems.push(`${o.id}: no source`);
      if (!o.verified) problems.push(`${o.id}: no verification date`);
      if (!o.image) problems.push(`${o.id}: no image`);
    }
  }

  for (const [code, file] of Object.entries(locales)) {
    for (const id of ids) {
      const entry = file.objects[id];
      if (!entry) problems.push(`${code}: missing entry for ${id}`);
      else {
        if (!entry.name.trim()) problems.push(`${code}: ${id} has no name`);
        if (strict && !entry.desc.trim()) problems.push(`${code}: ${id} has no description`);
      }
    }
    for (const id of Object.keys(file.objects)) if (!ids.has(id)) problems.push(`${code}: entry for unknown object ${id}`);
  }

  return problems;
}
