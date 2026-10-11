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
  const targetDiff = difficulty || 'easy';
  const unique = [...new Map(pool.map(word => [word.text, word])).values()];
  const ratio = getGradeQuestionRatio(gradeLevel, targetDiff);
  const selected = ratio.flatMap((count, group) => {
    if (count === 0) return [];
    let candidates = unique.filter(word => getQuestionLengthGroup(word) === group);
    // 同屬長句時，初階先練短句；宗師則提高較長散文出現的機率。
    if (group === 2 && gradeLevel >= 5) {
      candidates.sort((a, b) => Array.from(a.text).length - Array.from(b.text).length);
      const preferred = targetDiff === 'easy' ? candidates.slice(0, Math.ceil(candidates.length / 2))
        : targetDiff === 'hard' ? candidates.slice(Math.floor(candidates.length / 3)) : candidates;
      if (preferred.length >= count) candidates = preferred;
    }
    // 優先從對應難度（difficultyTier === targetDiff）與當學年專屬字庫抽取，不足才由同級其他字庫遞補
    const tierMatches = candidates.filter(word => {
      if (group === 0 && word.isCurrentGradeChar !== undefined) {
        return word.isCurrentGradeChar && word.difficultyTier === targetDiff;
      }
      return word.difficultyTier === targetDiff;
    });
    if (tierMatches.length >= count) {
      candidates = tierMatches;
    } else if (tierMatches.length > 0) {
      const rest = candidates.filter(w => !tierMatches.includes(w));
      return [...shuffled(tierMatches, random), ...shuffled(rest, random).slice(0, count - tierMatches.length)];
    }
    if (candidates.length < count) throw new Error(`${gradeLevel} 年級${targetDiff}的第 ${group + 1} 類題目不足。`);
    return shuffled(candidates, random).slice(0, count);
  });
  return shuffled(selected, random);
}

export function describeGradeQuestionRatio(gradeLevel, difficulty) {
  const [single, short, long] = getGradeQuestionRatio(gradeLevel, difficulty);
  return `每關：單字 ${single} 題・2～4 字詞 ${short} 題・5 字以上 ${long} 題`;
}
