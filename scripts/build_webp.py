"""建立背景圖的網頁版本，保留 PNG 原圖與尺寸。"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
total_png = total_webp = 0
for source in sorted((root / 'assets' / 'backgrounds').glob('*.png')):
    if not source.stem.endswith(('_v3', '_v4')):
        continue
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        image.save(target, 'WEBP', quality=88, method=6)
    total_png += source.stat().st_size
    total_webp += target.stat().st_size
    print(f'{source.name}: {source.stat().st_size} → {target.stat().st_size} bytes')
print(f'總計 {total_png} → {total_webp} bytes，減少 {100 * (1-total_webp/total_png):.1f}%')
