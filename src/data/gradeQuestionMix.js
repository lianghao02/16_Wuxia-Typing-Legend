// 每關十題依長度分層抽樣，而非從單字占多數的大題庫直接抽十題。
export const GRADE_QUESTION_RATIOS = {
  lower: { easy: [9, 1, 0], medium: [8, 2, 0], hard: [6, 3, 1] },
  middle: { easy: [2, 7, 1], medium: [1, 7, 2], hard: [0, 6, 4] },
  upper: { easy: [1, 3, 6], medium: [0, 2, 8], hard: [0, 1, 9] }
};

export function getGradeQuestionRatio(gradeLevel, difficulty) {
  const group = gradeLevel <= 2 ? 'lower' : gradeLevel <= 4 ? 'middle' : 'upper';
  return [...GRADE_QUESTION_RATIOS[group][difficulty || 'easy']];
}

export function getQuestionLengthGroup(word) {
  const length = Array.from(word.text).length;
  return length === 1 ? 0 : length <= 4 ? 1 : 2;
}

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildGradeQuestionQueue(pool, gradeLevel, difficulty, random = Math.random) {
  const unique = [...new Map(pool.map(word => [word.text, word])).values()];
  const ratio = getGradeQuestionRatio(gradeLevel, difficulty);
  const selected = ratio.flatMap((count, group) => {
    let candidates = unique.filter(word => getQuestionLengthGroup(word) === group);
    // 同屬長句時，初階先練短句；宗師則提高較長散文出現的機率。
    if (group === 2 && gradeLevel >= 5) {
      candidates.sort((a, b) => Array.from(a.text).length - Array.from(b.text).length);
      const preferred = difficulty === 'easy' ? candidates.slice(0, Math.ceil(candidates.length / 2))
        : difficulty === 'hard' ? candidates.slice(Math.floor(candidates.length / 3)) : candidates;
      if (preferred.length >= count) candidates = preferred;
    }
    if (candidates.length < count) throw new Error(`${gradeLevel} 年級${difficulty}的第 ${group + 1} 類題目不足。`);
    return shuffled(candidates, random).slice(0, count);
  });
  return shuffled(selected, random);
}

export function describeGradeQuestionRatio(gradeLevel, difficulty) {
  const [single, short, long] = getGradeQuestionRatio(gradeLevel, difficulty);
  return `每關：單字 ${single} 題・2～4 字詞 ${short} 題・5 字以上 ${long} 題`;
}

function selectByCycleAndRecency(candidates, count, {
  sessionSet,
  recentSetFull,
  recentSetShort,
  immediateTail,
  practicedCounts = {},
  random = Math.random
}) {
  if (count <= 0 || candidates.length === 0) return [];

  const picked = [];
  const pickedTexts = new Set();
  const takeFrom = (list) => {
    if (picked.length >= count || list.length === 0) return;
    const avail = list.filter(w => !pickedTexts.has(w.text));
    if (avail.length === 0) return;
    for (const item of shuffled(avail, random)) {
      if (picked.length >= count) break;
      picked.push(item);
      pickedTexts.add(item.text);
      sessionSet.add(item.text);
    }
  };

  // Layer 1: 排除本場已出題目
  const unaskedInSession = candidates.filter(w => !sessionSet.has(w.text));

  // Layer 3 (完整題庫循環防重): 依累計練習次數由少至多結晶分層 (0 -> 1 -> 2 ...)
  // 確保題庫中未出過的題目 100% 用完一輪後，才會進入下一輪循環
  const strataMap = new Map();
  for (const w of unaskedInSession) {
    const c = Math.max(0, Number(practicedCounts[w.text]) || 0);
    if (!strataMap.has(c)) strataMap.set(c, []);
    strataMap.get(c).push(w);
  }
  const sortedCounts = [...strataMap.keys()].sort((a, b) => a - b);

  // Layer 2 (跨關近期防重): 在同一輪熟練度層級內，優先排除最近 60 題，次之排除最近 15 題，最後才取同層剩餘題目
  for (const c of sortedCounts) {
    if (picked.length >= count) break;
    const stratum = strataMap.get(c);
    takeFrom(stratum.filter(w => !recentSetFull.has(w.text)));
    takeFrom(stratum.filter(w => !recentSetShort.has(w.text)));
    takeFrom(stratum);
  }

  // 若單場戰鬥極長、超越該分組總題數上限，才放寬同場限制（但避開剛出過的最後數題）
  if (picked.length < count) {
    takeFrom(candidates.filter(w => !immediateTail.has(w.text)));
  }

  // 終極保底：題庫極小時循環補滿且避免相鄰同題
  while (picked.length < count) {
    for (const item of shuffled(candidates, random)) {
      if (picked.length >= count) break;
      if (picked[picked.length - 1]?.text !== item.text || candidates.length === 1) {
        picked.push(item);
      }
    }
  }

  return picked;
}

/**
 * 四層防重與動態補題抽樣器（支援完整題庫循環防重、中英分池、跨關近期排除、錯題 20% 溫故知新複習、題庫不足自動降級）
 */
export function buildAdaptiveQuestionBatch(pool, gradeOrOpts = '1', difficultyArg = 'easy', maybeOpts = {}) {
  const opts = typeof gradeOrOpts === 'object' && gradeOrOpts !== null
    ? gradeOrOpts
    : { ...maybeOpts, grade: gradeOrOpts, difficulty: difficultyArg };
  const grade = String(opts.grade ?? '1');
  const difficulty = opts.difficulty || 'easy';
  const count = Math.max(1, Number(opts.count) || 10);
  const sessionUsed = opts.sessionUsed || opts.sessionAsked || [];
  const recentHistory = opts.recentHistory || opts.recentList || [];
  const practicedCounts = opts.practicedCounts || opts.practicedMap || {};
  const weakMap = opts.weakMap || {};
  const random = opts.random || Math.random;

  const unique = [...new Map((pool || []).map(word => [word.text, word])).values()];
  if (unique.length === 0) return [];

  const sessionSet = new Set(sessionUsed);
  const recentSetFull = new Set(recentHistory.slice(-60));
  const recentSetShort = new Set(recentHistory.slice(-15));
  const immediateTail = new Set(sessionUsed.slice(-Math.min(3, Math.max(0, unique.length - 1))));

  const selectFromGroup = (groupCandidates, needed) => selectByCycleAndRecency(groupCandidates, needed, {
    sessionSet,
    recentSetFull,
    recentSetShort,
    immediateTail,
    practicedCounts,
    random
  });

  let batch = [];
  if (grade === 'english') {
    batch = selectFromGroup(unique, count).map(w => ({ ...w }));
  } else {
    const gradeNum = Number(grade) || 1;
    const baseRatio = getGradeQuestionRatio(gradeNum, difficulty);
    const scaledCounts = baseRatio.map(r => Math.round((r / 10) * count));
    let sum = scaledCounts.reduce((a, b) => a + b, 0);
    while (sum < count) { scaledCounts[1]++; sum++; }
    while (sum > count) {
      const idx = scaledCounts.findIndex(x => x > 0);
      if (idx >= 0) { scaledCounts[idx]--; sum--; } else break;
    }

    const pickedByGroup = scaledCounts.flatMap((groupNeed, group) => {
      if (groupNeed <= 0) return [];
      let candidates = unique.filter(word => getQuestionLengthGroup(word) === group);
      if (candidates.length === 0) candidates = unique;
      if (group === 2 && gradeNum >= 5) {
        candidates.sort((a, b) => Array.from(a.text).length - Array.from(b.text).length);
        const preferred = difficulty === 'easy'
          ? candidates.slice(0, Math.ceil(candidates.length / 2))
          : difficulty === 'hard'
          ? candidates.slice(Math.floor(candidates.length / 3))
          : candidates;
        if (preferred.length >= groupNeed) candidates = preferred;
      }
      return selectFromGroup(candidates, groupNeed);
    });
    batch = shuffled(pickedByGroup, random).map(w => ({ ...w }));
  }

  // Layer 4: 錯題複習回流（最多占 20%，標記 isReview: true）
  const maxReviewCount = Math.max(1, Math.floor(count * 0.2));
  const weakEntries = Object.entries(weakMap || {})
    .filter(([, misses]) => misses > 0)
    .sort((a, b) => b[1] - a[1]);

  let injected = 0;
  for (const [weakText] of weakEntries) {
    if (injected >= maxReviewCount) break;
    if (sessionSet.has(weakText) || batch.some(w => w.text === weakText)) continue;
    const candidate = unique.find(w => w.text === weakText);
    if (!candidate) continue;
    const targetGroup = getQuestionLengthGroup(candidate);
    const replaceIdx = grade === 'english'
      ? batch.findIndex(w => !w.isReview)
      : batch.findIndex(w => !w.isReview && getQuestionLengthGroup(w) === targetGroup);
    if (replaceIdx >= 0) {
      batch[replaceIdx] = { ...candidate, isReview: true };
      injected++;
    }
  }

  return batch;
}

/**
 * 更新中英文獨立近期題庫與長期熟練度計數
 */
export function recordQuestionHistory(profile, completedWords = [], isEnglish = false) {
  if (!profile) return;
  profile.practiced ||= {};
  profile.weak ||= {};
  const list = Array.isArray(completedWords) ? completedWords : [completedWords];
  const texts = list.map(w => (typeof w === 'string' ? w : w?.text)).filter(Boolean);
  for (const t of texts) {
    profile.practiced[t] = (profile.practiced[t] || 0) + 1;
    if (profile.weak[t]) {
      profile.weak[t] = Math.max(0, profile.weak[t] - 1);
    }
  }
  if (isEnglish) {
    profile.recentEn = [...new Set([...(profile.recentEn || []), ...texts])].slice(-60);
  } else {
    profile.recentZh = [...new Set([...(profile.recentZh || []), ...texts])].slice(-60);
  }
  profile.recent = [...new Set([...(profile.recent || []), ...texts])].slice(-60);
}
