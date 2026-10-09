"""依正式倍率與接地錨點建立素材比較圖，不修改任何原始素材。"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'assets/animations/manifest.json').read_text(encoding='utf-8'))
font = ImageFont.load_default()
for batch in range(3):
    groups = manifest['groups'][batch * 7:(batch + 1) * 7]
    canvas = Image.new('RGB', (1500, len(groups) * 300), '#e5e4d8')
    draw = ImageDraw.Draw(canvas)
    for row, group in enumerate(groups):
        ref = next(item for item in manifest['inventory'] if item['path'] == group['reference'])
        frames = [{'pose': 'idle', **ref}, *group['frames'].values()]
        for col, frame in enumerate(frames):
            with Image.open(root / frame['path']) as image:
                anchor = frame.get('anchor') or {'x': .5, 'y': .8, 'scale': 1}
                factor = 280 * anchor.get('scale', 1) / image.height
                resized = image.resize((round(image.width * factor), round(image.height * factor)), Image.Resampling.LANCZOS)
                x, y = col * 300 + 145, row * 300 + 268
                draw.line((col * 300, y, col * 300 + 300, y), fill='#938c7d')
                canvas.paste(resized, (round(x - anchor['x'] * resized.width), round(y - anchor['y'] * resized.height)), resized)
                draw.text((col * 300 + 5, row * 300 + 5), group['id'] + '/' + frame['pose'], fill='#20302b', font=font)
    canvas.save(root / f'assets/animations/review_{batch + 1}.jpg', quality=92)
print('已輸出三張接地比較圖。')
