// 從保留原樣的教育部資料建立字音與例詞索引；不修改原始條目。
import { writeFile } from 'node:fs/promises';
import { MOE_MINI_METADATA, MOE_MINI_SHEETS } from '../src/data/moeMiniRecords.js';
const readings = {}, examples = {}, usage = {};
for (const [character,,,, reading, definition] of MOE_MINI_SHEETS[0].rows.slice(1)) {
  (readings[character] ||= []);
  if (!readings[character].includes(reading)) readings[character].push(reading);
  for (const match of definition.matchAll(/「([^」]+)」/g)) {
    const parts = [...match[1].matchAll(/([\p{Script=Han}])((?:˙)?[ㄅ-ㄩ]+[ˊˇˋ˙]?)/gu)];
    const remainder = match[1].replace(/[\p{Script=Han}](?:˙)?[ㄅ-ㄩ]+[ˊˇˋ˙]?/gu, '').replace(/&&|\s/g, '');
    if (remainder || parts.length < 2) continue;
    const word = parts.map(p => p[1]).join('');
    const sounds = parts.map(p => p[2]);
    (examples[word] ||= []);
    if (!examples[word].some(v => JSON.stringify(v) === JSON.stringify(sounds))) examples[word].push(sounds);
    const key = `${character}|${reading}`;
    (usage[key] ||= []);
    if (usage[key].length < 3 && !usage[key].includes(word)) usage[key].push(word);
  }
}
// 例詞音節以該字讀音索引保存，避免重複存放相同注音字串。
for (const [word, variants] of Object.entries(examples)) {
  examples[word] = variants.map(sounds => Array.from(word).map((character, i) => {
    const index = readings[character]?.indexOf(sounds[i]) ?? -1;
    return index >= 0 ? index : sounds[i];
  }));
}
const output = `// 由 scripts/build_dictionary_index.mjs 產生，來源與授權見 MOE_MINI_METADATA。\nexport const MOE_MINI_METADATA = ${JSON.stringify(MOE_MINI_METADATA)};\nexport const CHARACTER_READINGS = ${JSON.stringify(readings)};\nexport const EXAMPLE_READINGS = ${JSON.stringify(examples)};\nexport const CHARACTER_USAGE = ${JSON.stringify(usage)};\n`;
await writeFile(new URL('../src/data/moeMiniIndex.js', import.meta.url), output, 'utf8');
console.log(`輕量索引 ${Buffer.byteLength(output).toLocaleString()} bytes`);
