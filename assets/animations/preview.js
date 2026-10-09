const labels = { idle: '正式待機基準', windup: '預備', attack: '攻擊', impact: '命中', recover: '收招', hit: '受擊', stagger: '擊退／破防', defeat: '擊敗' };
const root = new URL('../../', import.meta.url);
const pendingImages = [];

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function card(path, title, description, bounds) {
  const figure = element('figure');
  const canvas = element('canvas');
  canvas.width = 360;
  canvas.height = 480;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${title}：${description}`);
  figure.append(canvas);
  const caption = element('figcaption');
  caption.append(element('strong', title), element('div', description));
  const link = element('a', path.split('/').pop());
  link.href = new URL(path, root).href;
  link.target = '_blank';
  link.rel = 'noopener';
  caption.append(link);
  figure.append(caption);
  const task = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      let box = bounds;
      if (!box) {
        const check = document.createElement('canvas');
        check.width = img.width;
        check.height = img.height;
        const checkCtx = check.getContext('2d', { willReadFrequently: true });
        checkCtx.drawImage(img, 0, 0);
        const data = checkCtx.getImageData(0, 0, img.width, img.height).data;
        let left = img.width, top = img.height, right = 0, bottom = 0;
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            if (data[(y * img.width + x) * 4 + 3] < 128) continue;
            left = Math.min(left, x); top = Math.min(top, y);
            right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
          }
        }
        if (right <= left || bottom <= top) { reject(new Error(`素材沒有可見內容：${path}`)); return; }
        box = [left, top, right, bottom];
      }
      const [left, top, right, bottom] = box;
      const scale = Math.min(320 / (right - left), 420 / (bottom - top));
      ctx.strokeStyle = '#9b9380';
      ctx.beginPath(); ctx.moveTo(8, 450); ctx.lineTo(352, 450); ctx.stroke();
      ctx.drawImage(img, left, top, right - left, bottom - top,
        (360 - (right - left) * scale) / 2, 450 - (bottom - top) * scale,
        (right - left) * scale, (bottom - top) * scale);
      canvas.dataset.loaded = 'true';
      resolve();
    };
    img.onerror = () => reject(new Error(`圖片載入失敗：${path}`));
    img.src = new URL(path, root).href;
  });
  pendingImages.push(task);
  task.catch(error => { document.querySelector('#error').textContent = error.message; });
  return figure;
}

try {
  const response = await fetch('./manifest.json');
  if (!response.ok) throw new Error(`素材清單讀取失敗：${response.status}`);
  const manifest = await response.json();
  let selectedGroup, loadedFrames = new Map(), elapsed = 0;
  const poseSelector = document.querySelector('#pose');
  const animationCanvas = document.querySelector('#animation');
  async function loadSequence(group) {
    selectedGroup = group; elapsed = 0; loadedFrames = new Map();
    poseSelector.replaceChildren();
    const ref = manifest.inventory.find(item => item.path === group.reference);
    const sequence = [{ pose: 'idle', path: group.reference, anchor: ref?.anchor, size: ref?.size, durationMs: 650 }, ...Object.values(group.frames)];
    const results = await Promise.all(sequence.map(async frame => {
      poseSelector.append(element('option', frame.pose));
      const img = new Image(); img.src = new URL(frame.path, root).href;
      await img.decode(); return [frame.pose, { ...frame, img }];
    }));
    if (selectedGroup === group) loadedFrames = new Map(results);
  }
  let last = performance.now();
  function animate(now) {
    elapsed += Math.min(50, now - last); last = now;
    const frames = [...loadedFrames.values()];
    const total = frames.reduce((sum, f) => sum + f.durationMs, 0);
    let offset = total ? elapsed % total : 0;
    const frame = document.querySelector('#animate').checked ? frames.find(f => { offset -= f.durationMs; return offset < 0; }) : loadedFrames.get(poseSelector.value);
    const ctx = animationCanvas.getContext('2d'); ctx.clearRect(0, 0, 900, 520);
    ctx.strokeStyle = '#9b9380'; ctx.beginPath(); ctx.moveTo(0, 460); ctx.lineTo(900, 460); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(420, 20); ctx.lineTo(420, 500); ctx.stroke();
    if (frame) {
      const anchor = frame.anchor || { x: .5, y: .8, scale: 1 };
      const h = 470 * (anchor.scale || 1), w = h * frame.img.width / frame.img.height;
      ctx.drawImage(frame.img, 420 - anchor.x * w, 460 - anchor.y * h, w, h);
      document.querySelector('#animation-status').textContent = `${selectedGroup.id}｜${labels[frame.pose]}｜共用接地基準，使用正式動畫倍率 ${anchor.scale || 1}`;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  const selector = document.querySelector('#group');
  manifest.groups.forEach(group => {
    const option = element('option', group.id);
    option.value = group.id;
    selector.append(option);
  });
  document.querySelector('#summary').textContent = `已盤點 ${manifest.inventory.length} 張既有素材，規劃 ${manifest.groups.length} 組動作。Phase A ${manifest.phaseAApproved ? '通過' : '尚未通過'}；生成圖必須完成身份、比例、透明邊界及錨點驗收後才可整合。`;
  function showGroup() {
    const group = manifest.groups.find(item => item.id === selector.value);
    const container = document.querySelector('#frames');
    container.replaceChildren();
    document.querySelector('#group-title').textContent = `${group.id} 姿態比較`;
    document.querySelector('#group-status').textContent = group.reviewNote || group.status;
    loadSequence(group).catch(error => { document.querySelector('#error').textContent = error.message; });
    const ref = manifest.inventory.find(item => item.path === group.reference);
    container.append(card(group.reference, labels.idle, '正式外觀基準；保留原圖', ref?.visibleBounds));
    for (const pose of [...group.required, ...(group.optional || [])]) {
      const frame = group.frames[pose];
      if (frame) container.append(card(frame.path, labels[pose], frame.approved ? '已通過本組素材驗收' : `候選未驗收：${frame.issue || '待檢查'}`, frame.visibleBounds));
      else {
        const figure = element('figure');
        figure.append(element('div', '尚未製作', 'missing'), element('figcaption', `${labels[pose]}：${group.required.includes(pose) ? '必要姿態' : '選擇性姿態'}`));
        container.append(figure);
      }
    }
  }
  selector.addEventListener('change', showGroup);
  document.querySelector('#background').addEventListener('change', event => document.documentElement.style.setProperty('--preview-bg', event.target.value));
  const inventory = document.querySelector('#inventory');
  for (const item of manifest.inventory) inventory.append(card(item.path, `${item.grade} 級｜保留`, item.inspection, item.visibleBounds));
  showGroup();
  await Promise.all(pendingImages);
  document.documentElement.dataset.ready = 'true';
} catch (error) {
  document.querySelector('#error').textContent = `${error.message}。請透過專案本機靜態伺服器開啟此頁。`;
}
