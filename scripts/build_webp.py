"""批次建立遊戲全素材的 WebP 網頁輕量版本，保留 PNG 原圖作為無縫回退。"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets_dir = root / 'assets'
subdirs = ['backgrounds', 'characters', 'enemies', 'effects', 'animations', 'icons', 'ui']

total_png = 0
total_webp = 0
converted_count = 0
skipped_count = 0

print("開始批次轉換全遊戲素材為 WebP 格式...")

for subdir in subdirs:
    target_dir = assets_dir / subdir
    if not target_dir.exists():
        continue
    for source in sorted(target_dir.rglob('*.png')):
        target = source.with_suffix('.webp')
        total_png += source.stat().st_size

        # 若 webp 已存在且比 png 新，則僅計入大小
        if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
            total_webp += target.stat().st_size
            skipped_count += 1
            continue

        with Image.open(source) as image:
            # 確保保持透明通道 RGBA 或 RGB
            if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
                image = image.convert('RGBA')
            else:
                image = image.convert('RGB')
            image.save(target, 'WEBP', quality=88, method=6)

        converted_size = target.stat().st_size
        total_webp += converted_size
        converted_count += 1
        rel_path = source.relative_to(assets_dir)
        print(f"[{converted_count}] {rel_path}: {source.stat().st_size // 1024}KB → {converted_size // 1024}KB")

ratio = (1 - (total_webp / total_png)) * 100 if total_png > 0 else 0
print("-" * 50)
print(f"轉換完成！共轉換 {converted_count} 張，跳過已是最新 {skipped_count} 張。")
print(f"總容量由 {total_png / (1024*1024):.2f} MB → {total_webp / (1024*1024):.2f} MB，體積縮減 {ratio:.1f}%！")
