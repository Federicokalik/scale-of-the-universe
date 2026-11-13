import credits from '../data/credits.json';
import objects from '../data/objects.json';
import type { Credit, LocaleFile, ObjectRecord, SceneData } from './types';

const localeFiles = import.meta.glob<{ default: LocaleFile }>('../data/i18n/*.json');

/** Joins the language-independent records with one locale's names and descriptions. */
export async function loadSceneData(locale: string): Promise<SceneData> {
  const load = localeFiles[`../data/i18n/${locale}.json`];
  if (!load) throw new Error(`No translation file for locale "${locale}"`);
  const file = (await load()).default;
  return {
    locale,
    ui: file.ui,
    objects: (objects as ObjectRecord[]).map((record) => {
      const text = file.objects[record.id];
      if (!text) throw new Error(`Locale "${locale}" has no entry for object "${record.id}"`);
      const credit = (credits as Record<string, Credit>)[record.id];
      return { ...record, name: text.name, desc: text.desc, ...(record.image && credit ? { credit } : {}) };
    }),
  };
}
