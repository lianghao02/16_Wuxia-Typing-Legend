// 純視覺時鐘：不保存傷害、不延遲輸入，最多合併一筆尚未播放的動作。
export class BattlePoseAnimation {
  constructor() { this.reset(); }
  reset() { this.pose = 'idle'; this.steps = []; this.index = 0; this.remaining = 0; this.priority = -1; this.pending = null; this.pendingAge = 0; }
  request(steps, priority = 0, hold = false) {
    const action = { steps, priority, hold };
    if (this.pose === 'defeat') return;
    if (this.pose === 'idle' || priority > this.priority) this.start(action);
    else if (priority >= this.priority) { this.pending = action; this.pendingAge = 0; }
  }
  start({ steps, priority, hold }) {
    this.steps = steps; this.priority = priority; this.hold = hold;
    this.index = 0; this.pending = null; this.pendingAge = 0;
    this.pose = steps[0].pose; this.remaining = steps[0].durationMs;
  }
  tick(dt) {
    if (this.pose === 'idle' || (this.hold && this.index === this.steps.length - 1)) return;
    this.pendingAge += dt; this.remaining -= dt;
    while (this.remaining <= 0) {
      this.index++;
      if (this.index >= this.steps.length) {
        const pending = this.pendingAge <= 500 ? this.pending : null;
        const overflow = -this.remaining;
        this.reset();
        if (pending) { this.start(pending); this.remaining -= overflow; continue; }
        return;
      }
      this.pose = this.steps[this.index].pose;
      this.remaining += this.steps[this.index].durationMs;
      if (this.hold && this.index === this.steps.length - 1) return;
    }
  }
}
