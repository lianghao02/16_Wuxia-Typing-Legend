import { MOE_MINI_METADATA, MOE_MINI_SHEETS } from './moeMiniRecords.js';

export { MOE_MINI_METADATA };
const entriesByCharacter = new Map();
const examplesByWord = new Map();
for (const row of MOE_MINI_SHEETS[0].rows.slice(1)) {
  const [character, radical, strokes, radicalStrokes, reading, definition] = row;
  const entry = { character, radical, strokes, radicalStrokes, reading, definition };
  const entries = entriesByCharacter.get(character) || [];
  entries.push(Object.freeze(entry));
  entriesByCharacter.set(character, entries);
  // 僅建立查詢索引；完整原始條目在 moeMiniRecords.js 內保留。
  for (const match of definition.matchAll(/「([^」]+)」/g)) {
    const syllables = [...match[1].matchAll(/([\p{Script=Han}])((?:˙)?[ㄅ-ㄩ]+[ˊˇˋ˙]?)/gu)];
    const characters = [...match[1].matchAll(/\p{Script=Han}/gu)];
    const remainder = match[1].replace(/[\p{Script=Han}](?:˙)?[ㄅ-ㄩ]+[ˊˇˋ˙]?/gu, '')
      .replace(/&&|\s/g, '');
    if (remainder) continue;
    if (syllables.length < 2 || syllables.length !== characters.length) continue;
    const word = syllables.map((part) => part[1]).join('');
    const readings = syllables.map((part) => part[2]);
    const variants = examplesByWord.get(word) || new Map();
    variants.set(JSON.stringify(readings), readings);
    examplesByWord.set(word, variants);
  }
}

export function getDictionaryEntries(character) {
  return [...(entriesByCharacter.get(character) || [])];
}

export function getCharacterReadings(character) {
  return [...new Set(getDictionaryEntries(character).map((entry) => entry.reading))];
}

export const COMMON_CHAR_BOPOMOFO_MAP = Object.freeze(Object.fromEntries(
  [...entriesByCharacter.keys()].flatMap((character) => {
    const readings = getCharacterReadings(character);
    return readings.length === 1 ? [[character, readings[0]]] : [];
  })
));

export function getDictionaryExampleReading(word) {
  const variants = examplesByWord.get(word);
  return variants?.size === 1 ? [...variants.values()][0].slice() : null;
}

export function normalizeReadingForComparison(reading) {
  return reading.startsWith('˙') ? reading.slice(1) + '˙' : reading;
}

export function isDictionaryReading(character, reading) {
  return getCharacterReadings(character).some((candidate) =>
    normalizeReadingForComparison(candidate) === normalizeReadingForComparison(reading));
}

export function resolveDictionaryReading(text, authoredReading = null) {
  const example = getDictionaryExampleReading(text);
  if (example) return example;
  const characters = Array.from(text);
  // 已有遊戲詞庫的完整固定標音可沿用，但每一字必須符合官方收錄讀音。
  if (authoredReading?.length === characters.length &&
      characters.every((character, i) => isDictionaryReading(character, authoredReading[i]))) {
    return [...authoredReading];
  }
  const errors = [];
  const readings = characters.map((character) => {
    const candidates = getCharacterReadings(character);
    if (candidates.length === 1) return candidates[0];
    errors.push(candidates.length
      ? `「${character}」是多音字，可選 ${candidates.join('／')}，請依詞義補上注音。`
      : `「${character}」未收錄於國語小字典，請手動補上注音。`);
    return null;
  });
  if (errors.length) throw new Error([...new Set(errors)].join('\n') + '\n格式：詞語(每字一組注音，以空白分隔)。');
  return readings;
}
