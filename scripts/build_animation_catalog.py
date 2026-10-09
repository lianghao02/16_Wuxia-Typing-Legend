"""從已驗收 manifest 建立遊戲素材索引，避免手動重複維護錨點。"""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--approve-reviewed', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
path = root / 'assets/animations/manifest.json'
manifest = json.loads(path.read_text(encoding='utf-8'))
for group in manifest['groups']:
    for pose in group['required']:
        assert group['frames'].get(pose, {}).get('approved'), f"尚未驗收：{group['id']}/{pose}"
    assert all(frame.get('approved') for frame in group['frames'].values())
if args.approve_reviewed:
    manifest['phaseAApproved'] = True
    manifest['phase'] = 'B'
    manifest['stopReason'] = ''
    for group in manifest['groups']:
        group['status'] = 'Phase A 通過：外觀、四姿態、透明邊緣與接地比較已檢查'
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert manifest['phaseAApproved'], 'Phase A 尚未通過，不得建立正式遊戲索引。'
catalog = {group['id']: {pose: {key: frame[key] for key in ('path', 'anchor', 'durationMs', 'size', 'visibleBounds')} for pose, frame in group['frames'].items()} for group in manifest['groups']}
aliases = {'enemy_wood': 'enemy_wood_dummy', 'enemy_puppet': 'enemy_earth_puppet', 'enemy_boss': 'enemy_blackwind_boss', 'yun_dragon_saber': 'yun_flame_saber', 'su_dragon_saber': 'su_flame_saber', 'yun_iron_spear': 'yun_thunder_spear', 'su_iron_spear': 'su_thunder_spear'}
output = '// 由 scripts/build_animation_catalog.py 依已驗收 manifest 產生；錨點以 manifest 為單一來源。\n'
output += 'export const battleAnimations = ' + json.dumps(catalog, ensure_ascii=False, separators=(',', ':')) + ';\n'
output += 'export const animationAliases = ' + json.dumps(aliases, ensure_ascii=False) + ';\n'
(root / 'src/data/battleAnimations.js').write_text(output, encoding='utf-8')
print(f"已建立 {len(catalog)} 組正式動畫索引。")
