/**
 * 臺灣標準大千注音鍵盤（Daqian Bopomofo Layout）與指法對應表
 * 支援實體鍵碼 (KeyboardEvent.code) 映射，徹底脫離作業系統輸入法選字框干擾
 */

export const KEYBOARD_ROWS = [
  [
    { code: 'Digit1', en: '1', zy: 'ㄅ', finger: '左手小指' },
    { code: 'Digit2', en: '2', zy: 'ㄉ', finger: '左手無名指' },
    { code: 'Digit3', en: '3', zy: 'ˇ', finger: '左手中指', isTone: true },
    { code: 'Digit4', en: '4', zy: 'ˋ', finger: '左手食指', isTone: true },
    { code: 'Digit5', en: '5', zy: 'ㄓ', finger: '左手食指' },
    { code: 'Digit6', en: '6', zy: 'ˊ', finger: '右手食指', isTone: true },
    { code: 'Digit7', en: '7', zy: '˙', finger: '右手食指', isTone: true },
    { code: 'Digit8', en: '8', zy: 'ㄚ', finger: '右手中指' },
    { code: 'Digit9', en: '9', zy: 'ㄞ', finger: '右手無名指' },
    { code: 'Digit0', en: '0', zy: 'ㄢ', finger: '右手小指' },
    { code: 'Minus',  en: '-', zy: 'ㄦ', finger: '右手小指' }
  ],
  [
    { code: 'KeyQ', en: 'Q', zy: 'ㄆ', finger: '左手小指' },
    { code: 'KeyW', en: 'W', zy: 'ㄊ', finger: '左手無名指' },
    { code: 'KeyE', en: 'E', zy: 'ㄍ', finger: '左手中指' },
    { code: 'KeyR', en: 'R', zy: 'ㄐ', finger: '左手食指' },
    { code: 'KeyT', en: 'T', zy: 'ㄔ', finger: '左手食指' },
    { code: 'KeyY', en: 'Y', zy: 'ㄗ', finger: '右手食指' },
    { code: 'KeyU', en: 'U', zy: 'ㄧ', finger: '右手食指' },
    { code: 'KeyI', en: 'I', zy: 'ㄛ', finger: '右手中指' },
    { code: 'KeyO', en: 'O', zy: 'ㄟ', finger: '右手無名指' },
    { code: 'KeyP', en: 'P', zy: 'ㄣ', finger: '右手小指' }
  ],
  [
    { code: 'KeyA', en: 'A', zy: 'ㄇ', finger: '左手小指' },
    { code: 'KeyS', en: 'S', zy: 'ㄋ', finger: '左手無名指' },
    { code: 'KeyD', en: 'D', zy: 'ㄎ', finger: '左手中指' },
    { code: 'KeyF', en: 'F', zy: 'ㄑ', finger: '左手食指' },
    { code: 'KeyG', en: 'G', zy: 'ㄕ', finger: '左手食指' },
    { code: 'KeyH', en: 'H', zy: 'ㄘ', finger: '右手食指' },
    { code: 'KeyJ', en: 'J', zy: 'ㄨ', finger: '右手食指' },
    { code: 'KeyK', en: 'K', zy: 'ㄜ', finger: '右手中指' },
    { code: 'KeyL', en: 'L', zy: 'ㄠ', finger: '右手無名指' },
    { code: 'Semicolon', en: ';', zy: 'ㄤ', finger: '右手小指' }
  ],
  [
    { code: 'KeyZ', en: 'Z', zy: 'ㄈ', finger: '左手小指' },
    { code: 'KeyX', en: 'X', zy: 'ㄌ', finger: '左手無名指' },
    { code: 'KeyC', en: 'C', zy: 'ㄏ', finger: '左手中指' },
    { code: 'KeyV', en: 'V', zy: 'ㄒ', finger: '左手食指' },
    { code: 'KeyB', en: 'B', zy: 'ㄖ', finger: '左手食指' },
    { code: 'KeyN', en: 'N', zy: 'ㄙ', finger: '右手食指' },
    { code: 'KeyM', en: 'M', zy: 'ㄩ', finger: '右手食指' },
    { code: 'Comma', en: ',', zy: 'ㄝ', finger: '右手中指' },
    { code: 'Period', en: '.', zy: 'ㄡ', finger: '右手無名指' },
    { code: 'Slash', en: '/', zy: 'ㄥ', finger: '右手小指' }
  ],
  [
    { code: 'Space', en: 'Space', zy: '␣', label: '一聲 / 空白鍵', finger: '大拇指', isTone: true, isWide: true }
  ]
];

export const CODE_TO_BOPOMOFO = {};
export const BOPOMOFO_TO_KEY_INFO = {};
export const EN_TO_KEY_INFO = {};

KEYBOARD_ROWS.forEach((row, rowIndex) => {
  row.forEach((keyInfo, colIndex) => {
    const enriched = { ...keyInfo, row: rowIndex, col: colIndex };
    CODE_TO_BOPOMOFO[keyInfo.code] = keyInfo.zy;
    BOPOMOFO_TO_KEY_INFO[keyInfo.zy] = enriched;
    EN_TO_KEY_INFO[keyInfo.en.toLowerCase()] = enriched;
  });
});

// 支援空白字元與一聲符號的雙向映射
BOPOMOFO_TO_KEY_INFO[' '] = BOPOMOFO_TO_KEY_INFO['␣'];
EN_TO_KEY_INFO[' '] = BOPOMOFO_TO_KEY_INFO['␣'];

export const TONE_MARKS = new Set(['ˊ', 'ˇ', 'ˋ', '˙', '␣']);

/**
 * 將單字注音字串正規化為按鍵序列
 * 例如：
 * - "ㄑㄧㄠˊ" -> ['ㄑ', 'ㄧ', 'ㄠ', 'ˊ']
 * - "˙ㄉㄜ"   -> ['ㄉ', 'ㄜ', '˙'] (符合臺灣鍵盤先打字音再按 7 輕聲的輸入習慣)
 * - "ㄑㄧㄥ"  -> 若 requireSpaceForFirstTone 為 true 則為 ['ㄑ', 'ㄧ', 'ㄥ', '␣']，否則為 ['ㄑ', 'ㄧ', 'ㄥ']
 */
export function normalizeBopomofoSequence(rawBopomofo, requireSpaceForFirstTone = false) {
  if (!rawBopomofo) return [];
  const trimmed = rawBopomofo.trim();
  const chars = Array.from(trimmed);

  // 處理輕聲符號在字首的情況（如教育部字典格式 "˙ㄉㄜ" -> 轉為打字順序 "ㄉㄜ˙"）
  let hasNeutralLeading = false;
  const filtered = [];
  for (const ch of chars) {
    if (ch === '˙' && filtered.length === 0 && chars.length > 1) {
      hasNeutralLeading = true;
    } else if (ch !== ' ') {
      filtered.push(ch);
    }
  }
  if (hasNeutralLeading) {
    filtered.push('˙');
  }

  // 檢查是否已有二、三、四、輕聲
  const lastChar = filtered[filtered.length - 1];
  const hasExplicitTone = TONE_MARKS.has(lastChar);

  // 若為單純一聲字（有超過1個符號或非純單鍵練習），依設定決定是否加空白鍵
  if (!hasExplicitTone && requireSpaceForFirstTone && filtered.length > 0) {
    filtered.push('␣');
  }

  return filtered;
}
