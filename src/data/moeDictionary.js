import { MOE_MINI_METADATA, CHARACTER_READINGS, EXAMPLE_READINGS, CHARACTER_USAGE } from './moeMiniIndex.js?v=20261007_beta2_final';

export { MOE_MINI_METADATA };
let fullDictionaryPromise;
// 完整釋義只在查詢時載入；失敗後允許重新查詢重試。
export async function getDictionaryEntries(character) {
  fullDictionaryPromise ||= import('./moeMiniRecords.js').then(({ MOE_MINI_SHEETS }) => {
    const entries = new Map();
    for (const [character, radical, strokes, radicalStrokes, reading, definition] of MOE_MINI_SHEETS[0].rows.slice(1)) {
      if (!entries.has(character)) entries.set(character, []);
      entries.get(character).push({ character, radical, strokes, radicalStrokes, reading, definition });
    }
    return entries;
  }).catch(error => { fullDictionaryPromise = null; throw error; });
  return [...((await fullDictionaryPromise).get(character) || [])];
}

export function getCharacterReadings(character) {
  return [...(CHARACTER_READINGS[character] || [])];
}

export const COMMON_CHAR_BOPOMOFO_MAP = Object.freeze(Object.fromEntries(
  Object.keys(CHARACTER_READINGS).flatMap((character) => {
    const readings = getCharacterReadings(character);
    return readings.length === 1 ? [[character, readings[0]]] : [];
  })
));

export function getDictionaryExampleReading(word) {
  const variants = EXAMPLE_READINGS[word];
  return variants?.length === 1 ? Array.from(word).map((character, i) => {
    const value = variants[0][i];
    return typeof value === 'number' ? CHARACTER_READINGS[character][value] : value;
  }) : null;
}

export function getDictionaryUsage(character, reading) {
  const matched = getCharacterReadings(character).find(candidate =>
    normalizeReadingForComparison(candidate) === normalizeReadingForComparison(reading));
  return [...(CHARACTER_USAGE[`${character}|${matched}`] || [])];
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

/**
 * 從教育部《國語小字典》離線索引 EXAMPLE_READINGS 中，依該年級可用字集結構化提取
 * 具備單一明確讀音且逐字通過字典核對之 2～4 字詞語與四字成語。
 */
export function getGradeDictionaryExampleWords(allowedCharSet, focusCharSet, gradeLevel, maxCount = 80) {
  const idioms = [];
  const words = [];
  for (const text of Object.keys(EXAMPLE_READINGS)) {
    const chars = Array.from(text);
    if (chars.length < 2 || chars.length > 4) continue;
    if (!chars.every(ch => allowedCharSet.has(ch))) continue;
    if (gradeLevel > 1 && focusCharSet?.size && !chars.some(ch => focusCharSet.has(ch))) continue;
    const reading = getDictionaryExampleReading(text);
    if (!reading || reading.length !== chars.length) continue;
    if (!chars.every((ch, idx) => isDictionaryReading(ch, reading[idx]))) continue;
    const item = {
      text,
      bopomofo: reading,
      gradeLevel,
      sourceKind: 'dictionary-example',
      meaning: `教育部國語小字典例詞・${chars.length === 4 ? '四字詞語與成語' : '常用詞彙'}練習。`
    };
    if (chars.length === 4) idioms.push(item);
    else words.push(item);
  }
  const targetIdioms = gradeLevel >= 3 ? Math.min(idioms.length, Math.floor(maxCount * 0.45)) : Math.min(idioms.length, 10);
  const pickedIdioms = idioms.slice(0, targetIdioms);
  const pickedWords = words.slice(0, Math.max(0, maxCount - pickedIdioms.length));
  return [...pickedWords, ...pickedIdioms];
}
