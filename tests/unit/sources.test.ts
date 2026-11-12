import { expect, test } from 'vitest';
import { countSources, sourceIndex } from '../../src/lib/sources';

const nasa = { title: 'Earth Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html' };
const moon = { title: 'Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' };
const eso = { title: 'Eris', url: 'https://www.eso.org/public/news/eso1142/' };

test('lists each address once, however many objects cite it', () => {
  const groups = sourceIndex([{ sources: [nasa, eso] }, { sources: [nasa] }]);
  expect(countSources(groups)).toBe(2);
});

test('groups by site, drops "www.", puts the most cited site first', () => {
  const groups = sourceIndex([{ sources: [eso] }, { sources: [moon, nasa] }]);
  expect(groups.map((group) => group.host)).toEqual(['nssdc.gsfc.nasa.gov', 'eso.org']);
  expect(groups[0].sources.map((source) => source.title)).toEqual(['Earth Fact Sheet', 'Moon Fact Sheet']);
});

test('an object without sources adds nothing', () => {
  expect(sourceIndex([{ sources: [] }])).toEqual([]);
});
