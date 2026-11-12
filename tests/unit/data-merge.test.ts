import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { loadSceneData } from '../../src/lib/data';

const objects = JSON.parse(readFileSync(new URL('../../src/data/objects.json', import.meta.url), 'utf8'));

test('loadSceneData joins every object with its localized name', async () => {
  const data = await loadSceneData('it');
  expect(data.locale).toBe('it');
  expect(data.objects.length).toBe(objects.length);
  expect(data.objects.find((o) => o.id === 'terra')).toMatchObject({ name: 'Terra', size: 1.2742e7, kind: 'p' });
  expect(data.ui['about.button']).toBe('Metodo e fonti');
});

test('loadSceneData rejects a locale without a translation file', async () => {
  await expect(loadSceneData('xx')).rejects.toThrow('No translation file for locale "xx"');
});
