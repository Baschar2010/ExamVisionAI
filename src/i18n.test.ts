import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { words } from './i18n.ts';

const languages = ['de', 'en', 'ar', 'fr', 'es'];

test('every language has the same translation keys', () => {
  const base = Object.keys(words.de).sort();
  for (const lang of languages) {
    assert.deepEqual(Object.keys(words[lang]).sort(), base, `missing keys in ${lang}`);
    assert.ok(Object.values(words[lang]).every(value => typeof value === 'string' && String(value).length > 0));
  }
});

test('Arabic translations contain real Arabic script and no untranslated placeholders', () => {
  assert.match(words.ar.greeting, /[\u0600-\u06ff]/);
  assert.doesNotMatch(words.ar.fbFull, /[A-Za-z]{3,}/);
});

test('all keys referenced in the UI exist in every language', () => {
  const sources = ['./main.tsx', './platform-ui.tsx']
    .map(file => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n');
  const used = new Set([...sources.matchAll(/\bt\.([A-Za-z][A-Za-z0-9]*)/g)].map(match => match[1]));
  for (const lang of languages) {
    const missing = [...used].filter(key => !(key in words[lang]));
    assert.deepEqual(missing, [], `${lang} misses ${missing.join(', ')}`);
  }
});
