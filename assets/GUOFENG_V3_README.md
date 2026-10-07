# 新國風素材 v3：整合說明

本批共 37 件，採新國風水墨動畫插畫方向；命名 `_v3.png`，保留既有版本。使用內建 GPT 圖片生成工具逐件產出，再整理輸出尺寸、透明畫布與安全邊距。尚未接入遊戲。

## 技術驗證

- 17 件全身立繪：1080×1440，RGBA，四周非零透明度輪廓至少留白 15%。
- 12 件頭像與道具圖示：512×512，RGBA，置中。
- 8 件背景：1920×1080，RGB；含大地圖、6 件戰鬥背景及商店內景。
- 29 件透明素材的透明度範圍均為 0–255；沒有以白底代替透明底。
- 37 件檔案、尺寸與 SHA-256 已記錄於 `guofeng_v3_manifest.json`；總大小約 51.02 MiB。
- `guofeng_v3_sources.json` 保存每件實際生成提示詞與原始生成檔名；它是生成紀錄，不是載入設定。

## 自適應整合建議

1. 將戰鬥場景視為 1920×1080 設計座標，以等比例 contain 縮放到可用區域。題目與鍵盤保留獨立版面空間，窄螢幕降低角色顯示比例。
2. 戰鬥地面設計值為 Y=0.68。背景不宜直接 cover 裁切，避免不同螢幕將地面線移位；大地圖與商店內景不套用戰鬥地面規則。
3. 透明立繪的畫布底緣不是腳底。manifest 的 anchorSuggestion 僅提供輪廓下緣初始值；正式 anchor 應以各圖鞋底或木樁支柱實機校正。
4. 畫布採 CSS 尺寸控制排版，繪圖緩衝區依 devicePixelRatio 設定；避免把裝置像素直接當作版面座標。
5. 圖片載入與快取採非同步處理，未載入或失敗時保留既有向量繪製。人物圖已含武器，避免再次疊畫相同武器。
6. 先測試雲清川初階、稻草人與山門背景，確認題目可讀、人物接地、鍵盤不被遮擋，再套用其他素材。

## 尚需確認的視覺項目

尺寸與透明度驗證通過，不代表藝術內容全部符合逐像素規格。背景地面分界約落在設計線附近，尚未證明每張都精準在 Y=68%；請在整合時逐張校正。人物雙腳有透視差異，也需個別調整接地錨點。

部分原始生成圖的極淡輪廓延伸至畫布邊緣。本次等比例放入安全畫布，可確保交付檔留白，但無法恢復原始圖已被裁切的內容；若目視發現披風、劍尖缺角，應重生該單件。相同角色不同階級的臉部、衣飾及圖示與持武設計，也需確認一致性。

本批是靜態素材，未提供攻擊動畫逐格圖；10 件代表對手也不是 30 關各自獨立的對手造型。尚未進行遊戲內整合或跨螢幕實測。

## 素材清單

| 編號 | 素材 | 檔案 | 尺寸 |
|---|---|---|---|
| 1 | 雲清川・初階 | [characters/yun_wood_idle_v3.png](characters/yun_wood_idle_v3.png) | 1080×1440 |
| 2 | 雲清川・中階 | [characters/yun_qingfeng_idle_v3.png](characters/yun_qingfeng_idle_v3.png) | 1080×1440 |
| 3 | 雲清川・高階 | [characters/yun_xuantie_idle_v3.png](characters/yun_xuantie_idle_v3.png) | 1080×1440 |
| 4 | 雲清川・頭像 | [icons/yun_avatar_v3.png](icons/yun_avatar_v3.png) | 512×512 |
| 5 | 蘇映雪・初階 | [characters/su_wood_idle_v3.png](characters/su_wood_idle_v3.png) | 1080×1440 |
| 6 | 蘇映雪・中階 | [characters/su_qingfeng_idle_v3.png](characters/su_qingfeng_idle_v3.png) | 1080×1440 |
| 7 | 蘇映雪・高階 | [characters/su_xuantie_idle_v3.png](characters/su_xuantie_idle_v3.png) | 1080×1440 |
| 8 | 蘇映雪・頭像 | [icons/su_avatar_v3.png](icons/su_avatar_v3.png) | 512×512 |
| 9 | 普通稻草人 | [enemies/straw_idle_v3.png](enemies/straw_idle_v3.png) | 1080×1440 |
| 10 | 少林木人樁 | [enemies/wood_dummy_idle_v3.png](enemies/wood_dummy_idle_v3.png) | 1080×1440 |
| 11 | 巡山小賊 | [enemies/bandit_scout_idle_v3.png](enemies/bandit_scout_idle_v3.png) | 1080×1440 |
| 12 | 斗笠刀客 | [enemies/bandit_saber_idle_v3.png](enemies/bandit_saber_idle_v3.png) | 1080×1440 |
| 13 | 雙斧悍匪 | [enemies/bandit_axes_idle_v3.png](enemies/bandit_axes_idle_v3.png) | 1080×1440 |
| 14 | 武當小道童 | [enemies/wudang_novice_idle_v3.png](enemies/wudang_novice_idle_v3.png) | 1080×1440 |
| 15 | 黑風左護法 | [enemies/left_protector_idle_v3.png](enemies/left_protector_idle_v3.png) | 1080×1440 |
| 16 | 擂台巨力士 | [enemies/arena_champion_idle_v3.png](enemies/arena_champion_idle_v3.png) | 1080×1440 |
| 17 | 地煞機關傀儡 | [enemies/earth_puppet_idle_v3.png](enemies/earth_puppet_idle_v3.png) | 1080×1440 |
| 18 | 黑風山大王 | [enemies/blackwind_boss_idle_v3.png](enemies/blackwind_boss_idle_v3.png) | 1080×1440 |
| 19 | 江湖歷練地圖 | [backgrounds/jianghu_map_v3.png](backgrounds/jianghu_map_v3.png) | 1920×1080 |
| 20 | 山門演武場 | [backgrounds/mountain_gate_v3.png](backgrounds/mountain_gate_v3.png) | 1920×1080 |
| 21 | 翠竹林 | [backgrounds/bamboo_forest_v3.png](backgrounds/bamboo_forest_v3.png) | 1920×1080 |
| 22 | 古驛客棧外景 | [backgrounds/ancient_inn_v3.png](backgrounds/ancient_inn_v3.png) | 1920×1080 |
| 23 | 襄陽古城擂台 | [backgrounds/arena_v3.png](backgrounds/arena_v3.png) | 1920×1080 |
| 24 | 月下練武場 | [backgrounds/moon_dojo_v3.png](backgrounds/moon_dojo_v3.png) | 1920×1080 |
| 25 | 雲海山巔 | [backgrounds/cloud_peak_v3.png](backgrounds/cloud_peak_v3.png) | 1920×1080 |
| 26 | 客棧神兵閣內景 | [backgrounds/inn_shop_v3.png](backgrounds/inn_shop_v3.png) | 1920×1080 |
| 27 | 掌櫃店小二 | [characters/shopkeeper_idle_v3.png](characters/shopkeeper_idle_v3.png) | 1080×1440 |
| 28 | 桃木短劍 | [icons/wood_sword_v3.png](icons/wood_sword_v3.png) | 512×512 |
| 29 | 三尺青鋒劍 | [icons/qingfeng_sword_v3.png](icons/qingfeng_sword_v3.png) | 512×512 |
| 30 | 流雲玄鐵神劍 | [icons/xuantie_sword_v3.png](icons/xuantie_sword_v3.png) | 512×512 |
| 31 | 布衣短打 | [icons/linen_outfit_v3.png](icons/linen_outfit_v3.png) | 512×512 |
| 32 | 青藍俠客服 | [icons/wanderer_outfit_v3.png](icons/wanderer_outfit_v3.png) | 512×512 |
| 33 | 流雲宗師袍 | [icons/grandmaster_outfit_v3.png](icons/grandmaster_outfit_v3.png) | 512×512 |
| 34 | 金創藥 | [icons/healing_powder_v3.png](icons/healing_powder_v3.png) | 512×512 |
| 35 | 九轉大還丹 | [icons/restoration_elixir_v3.png](icons/restoration_elixir_v3.png) | 512×512 |
| 36 | 靜心護身符 | [icons/serenity_amulet_v3.png](icons/serenity_amulet_v3.png) | 512×512 |
| 37 | 通寶銅錢 | [icons/copper_coins_v3.png](icons/copper_coins_v3.png) | 512×512 |
