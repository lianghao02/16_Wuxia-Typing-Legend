// 保持字級與兩行容量，超長句依目前位置接續下一段。
export function sentenceWindow(length, index, columns, rows=2) {
  const capacity = Math.max(1, Math.floor(columns) * rows);
  const left = Math.floor(Math.max(0, index) / capacity) * capacity;
  return { left, right: Math.min(length, left + capacity) };
}
