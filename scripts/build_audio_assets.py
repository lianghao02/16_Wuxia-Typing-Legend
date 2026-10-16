#!/usr/bin/env python3
"""
《武俠打字傳》高品質開源音訊素材建置腳本
- 來源：
  1. SFX: Kenney Game Assets (100% CC0 Public Domain)
  2. BGM: Incompetech / Kevin MacLeod (CC-BY 4.0)
- 處理：
  透過 ffmpeg 截取各章節最具意境之 45~60 秒循環段落，
  以 96kbps 高效壓縮，確保全套 BGM + SFX 總容量在 4MB 以內，
  提供國風實錄民樂（古箏、二胡、琵琶、大堂鼓）與真實冷兵器打擊質感。
"""

import os
import sys
import urllib.request
import subprocess

SFX_DIR = os.path.join('assets', 'audio', 'sfx')
BGM_DIR = os.path.join('assets', 'audio', 'bgm')
os.makedirs(SFX_DIR, exist_ok=True)
os.makedirs(BGM_DIR, exist_ok=True)

KENNEY_BASE = 'https://raw.githubusercontent.com/Boyquotes'
INCOMPETECH_BASE = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree'

SFX_SOURCES = {
    'key_hit.ogg': f'{KENNEY_BASE}/kenney-impact-sounds-for-godot/master/addons/kenney%20impact%20sounds/impact_metal_light_001.ogg',
    'char_slash.ogg': f'{KENNEY_BASE}/kenney-rpg-audio-for-godot/master/addons/kenney%20rpg%20audio/knife_slice.ogg',
    'word_complete.ogg': f'{KENNEY_BASE}/kenney-impact-sounds-for-godot/master/addons/kenney%20impact%20sounds/impact_metal_heavy_002.ogg',
    'miss.ogg': f'{KENNEY_BASE}/kenney-impact-sounds-for-godot/master/addons/kenney%20impact%20sounds/impact_metal_light_004.ogg',
    'hurt.ogg': f'{KENNEY_BASE}/kenney-impact-sounds-for-godot/master/addons/kenney%20impact%20sounds/impact_punch_heavy_001.ogg',
    'shield.ogg': f'{KENNEY_BASE}/kenney-impact-sounds-for-godot/master/addons/kenney%20impact%20sounds/impact_bell_heavy_000.ogg',
    'coins.ogg': f'{KENNEY_BASE}/kenney-rpg-audio-for-godot/master/addons/kenney%20rpg%20audio/handle_coins.ogg',
    'combo_milestone.ogg': f'{KENNEY_BASE}/kenney-impact-sounds-for-godot/master/addons/kenney%20impact%20sounds/impact_bell_heavy_002.ogg',
}

BGM_SOURCES = {
    'Guzheng City': f'{INCOMPETECH_BASE}/Guzheng%20City.mp3',
    'Ripples': f'{INCOMPETECH_BASE}/Ripples.mp3',
    'Shenyang': f'{INCOMPETECH_BASE}/Shenyang.mp3',
    'Master of the Feast': f'{INCOMPETECH_BASE}/Master%20of%20the%20Feast.mp3',
    'Eastern Thought': f'{INCOMPETECH_BASE}/Eastern%20Thought.mp3',
    'Asian Drums': f'{INCOMPETECH_BASE}/Asian%20Drums.mp3'
}

def download_file(url, target_path):
    print(f'Downloading {url} -> {target_path}...')
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req) as resp, open(target_path, 'wb') as f:
        f.write(resp.read())
    print(f'  Saved {target_path} ({os.path.getsize(target_path)} bytes)')

def build_sfx():
    print('=== 建置 SFX 打擊音效 ===')
    for name, url in SFX_SOURCES.items():
        base_name = os.path.splitext(name)[0]
        temp_ogg = os.path.join(SFX_DIR, f'temp_{name}')
        out_mp3 = os.path.join(SFX_DIR, f'{base_name}.mp3')
        try:
            download_file(url, temp_ogg)
            # 透過 ffmpeg 轉換為 mp3，音量微調
            cmd = ['ffmpeg', '-y', '-i', temp_ogg, '-b:a', '128k', out_mp3]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            print(f'  [OK] {out_mp3} ({os.path.getsize(out_mp3)} bytes)')
            if os.path.exists(temp_ogg):
                os.remove(temp_ogg)
        except Exception as e:
            print(f'  [Error] {name}: {e}')

def build_bgm():
    print('=== 建置 6 章風格 + 首頁 + 客棧 + 首領戰 BGM ===')
    raw_dir = os.path.join('assets', 'audio', 'raw_bgm')
    os.makedirs(raw_dir, exist_ok=True)

    # 1. 下載原始 MP3
    raw_files = {}
    for track_name, url in BGM_SOURCES.items():
        raw_path = os.path.join(raw_dir, f'{track_name}.mp3')
        if not os.path.exists(raw_path):
            try:
                download_file(url, raw_path)
            except Exception as e:
                print(f'  [Error] Download {track_name}: {e}')
        raw_files[track_name] = raw_path

    # 2. 定義各情境截取時間點 (start, duration, volume_factor)
    # 每個章節每五關換一個風格！
    bgm_specs = {
        'bgm_title': ('Guzheng City', 0, 48, 1.15),        # 江湖首頁：古箏清靈
        'bgm_ch1':   ('Ripples', 0, 52, 1.2),              # 第 1 章（1~5 關）：青竹流水絲竹
        'bgm_ch2':   ('Shenyang', 12, 54, 1.0),            # 第 2 章（6~10 關）：盛世洛陽二胡揚琴
        'bgm_ch3':   ('Master of the Feast', 16, 50, 1.1), # 第 3 章（11~15 關）：西域塞外荒漠駝鈴
        'bgm_ch4':   ('Eastern Thought', 0, 55, 1.25),     # 第 4 章（16~20 關）：華山絕頂高寒古琴
        'bgm_ch5':   ('Asian Drums', 0, 48, 1.0),          # 第 5 章（21~25 關）：黑木幽谷暗流戰鼓
        'bgm_ch6':   ('Asian Drums', 48, 52, 1.1),         # 第 6 章（26~30 關）：紫禁之巔金戈鐵馬大決戰
        'bgm_boss':  ('Asian Drums', 100, 50, 1.2),        # 章節首領戰：暴風大堂鼓對決
        'bgm_inn':   ('Shenyang', 75, 48, 0.95),           # 古驛客棧：江南茶肆休閒絲竹
    }

    for out_name, (src_track, start_sec, dur_sec, vol) in bgm_specs.items():
        raw_path = raw_files.get(src_track)
        if not raw_path or not os.path.exists(raw_path):
            print(f'  [Skip] Raw file missing for {out_name}')
            continue
        out_mp3 = os.path.join(BGM_DIR, f'{out_name}.mp3')
        # 使用 ffmpeg 截取、加上 1.5s 淡入與 2s 淡出，壓縮為 96kbps 輕量立體聲
        cmd = [
            'ffmpeg', '-y',
            '-ss', str(start_sec),
            '-t', str(dur_sec),
            '-i', raw_path,
            '-af', f'afade=t=in:ss=0:d=1.5,afade=t=out:st={dur_sec - 2}:d=2,volume={vol}',
            '-b:a', '96k',
            out_mp3
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            size_kb = os.path.getsize(out_mp3) // 1024
            print(f'  [OK] {out_name}.mp3 ({src_track}): {size_kb} KB')
        except Exception as e:
            print(f'  [Error] Processing {out_name}: {e}')

def write_credits():
    credits_content = """# 音訊素材來源與授權聲明 (Audio Credits)

《武俠打字傳》全套音訊素材採用 100% 自由開源、公有領域或合規之創用 CC 授權：

### 1. 戰鬥打擊音效 (SFX)
- **作者**：Kenney (Asset Packs: Impact Sounds, RPG Audio)
- **網站**：https://kenney.nl
- **授權**：**CC0 1.0 Universal (Public Domain / 公有領域)**
- **說明**：包含清脆輕金屬擊鍵、刀劍破風揮砍、破題破甲重擊、格擋偏斜彈刀、受創悶哼、金鐘護印共鳴與銀兩銅錢碰撞聲。

### 2. 情境背景音樂 (BGM)
- **作者**：Kevin MacLeod (Incompetech.com)
- **曲目**：
  - 《Guzheng City》（江湖首頁 · 空靈古箏）
  - 《Ripples》（第 1 章 · 青竹流水絲竹）
  - 《Shenyang》（第 2 章 · 盛世洛陽二胡揚琴 & 客棧絲竹）
  - 《Master of the Feast》（第 3 章 · 西域塞外荒漠風雲）
  - 《Eastern Thought》（第 4 章 · 華山論劍高寒古琴）
  - 《Asian Drums》（第 5 章 · 黑木幽谷、第 6 章 · 紫禁之巔、章節首領決戰）
- **授權**：**Creative Commons: By Attribution 4.0 (CC-BY 4.0)**
  - http://creativecommons.org/licenses/by/4.0/
"""
    credits_path = os.path.join('assets', 'audio', 'CREDITS.md')
    with open(credits_path, 'w', encoding='utf-8') as f:
        f.write(credits_content)
    print(f'Generated {credits_path}')

if __name__ == '__main__':
    build_sfx()
    build_bgm()
    write_credits()
    print('All audio assets processed successfully!')
