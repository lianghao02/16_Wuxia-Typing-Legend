// 保持字級與兩行容量，超長句依目前位置接續下一段。
export function sentenceWindow(length, index, columns) {
  const capacity = Math.max(2, Math.floor(columns) * 2);
  const left = Math.floor(Math.max(0, index) / capacity) * capacity;
  return { left, right: Math.min(length, left + capacity) };
}
