# 第一組美術素材交接：山門演武場

- 日期：2026-10-06（臺灣）
- 產生方式：Codex 內建 imagegen；原始 PNG 保留，未縮放、裁切或另外去背。
- 範圍：僅新增素材與本說明，沒有修改遊戲程式。由 Antigravity 負責載入、快取、比例對齊與實機驗證。
- 三張圖均為獨立素材；人物與稻草人是單張待機立繪，不是動作圖集。

## 檔案與已驗證資訊

| 專案相對路徑 | 尺寸 | 色彩模式 | 用途 |
|---|---|---|---|
| assets/backgrounds/mountain_gate_v1.png | 1672 × 941 | RGB、不透明 | 山門演武場戰鬥背景，約 16:9 |
| assets/characters/yun_wood_idle_v1.png | 1086 × 1448 | RGBA | 雲清川初階布衣＋桃木劍，朝右 |
| assets/enemies/straw_idle_v1.png | 1086 × 1448 | RGBA | 稻草人練功靶，朝左 |

人物與稻草人的 alpha 範圍均為 0–255，已確認存在真正透明像素，無須線上去背。
人物檔約 1.12 MB，稻草人約 1.30 MB，背景約 2.50 MB。

非零 alpha 邊界採 Pillow 的 (left, top, right, bottom) 格式，右／下為不包含端點：
- 雲清川：(25, 33, 1083, 1420)
- 稻草人：(25, 13, 1039, 1433)

非零 alpha 邊界包含極淡邊緣，不能直接當成角色碰撞區。角色整張圖包含武器及衣襬，定位時應看腳底／木柱底部，不要只用整張圖片中心。

## 接入建議（待實機校正）

1. 背景對應 sceneTheme = mountain_gate。使用等比例 cover 或 contain；不得拉伸。cover 在非 16:9 視窗會裁切，需確認兩側場地仍可用。
2. 主角對應 hero.id = yun 且 weapon.id = wood_sword（tier 1）。
3. 稻草人先對應簡單難度第一關；中階鐵甲稻草人與高階機關草人尚未提供專屬圖，不宜視為已完成。
4. 兩張立繪原本就分別朝右／朝左，不必再次鏡像。
5. 保留現有向量繪製作為載入前、缺檔及解碼失敗時的備援；圖片非同步載入，不要阻塞遊戲。快取成功與失敗狀態，避免每一影格重試。
6. 待機、受擊位移、呼吸、格擋粒子可以搭配此立繪；沒有提供出劍姿勢，不要宣稱已完成逐格攻擊動畫。
7. 保留角色名稱、題目、注音、下一鍵提示、血條及數值由程式顯示。不要烘焙進圖片。
8. 背景圖已包含地面。接入後確認原本不透明的程式地板不會蓋掉背景。
9. 陰影、劍氣、警示環及角色名牌分開繪製；劍已在主角圖內，避免再畫一把向量劍。

初始擺位可沿用現有左右位置（畫面寬度約 24%／76%），但腳底高度與人物尺寸必須依題目卷軸、鍵盤和工具列的實際邊界調整。
建議先以完整立繪顯示高度 180–240 CSS px 起測，保持原始長寬比。這是起始值，不是已通過驗證的尺寸。
雲清川腳底 anchor 可從約 (0.48, 0.981) 起測；稻草人木柱底部約 (0.58, 0.990)。這兩組是視覺估計，需實機校正。

## 驗收項目

- 人物、劍尖與稻草人手臂不被裁切，不遮住題目或鍵盤。
- 三張圖都有載入成功的證據；用錯誤路徑檢查備援繪製。
- 小視窗與高 DPI 顯示下仍能閱讀題目、注音與下一鍵。
- 切換其他角色、裝備、關卡不會沿用錯誤圖片。
- 保持圖檔原始 alpha；不把透明區繪製成黑底或白底。

已完成：檔案可解碼、尺寸檢查、透明度檢查與生成結果目視檢查。
未完成：遊戲圖片載入、實機比例／遮擋檢查、瀏覽器效能與動畫驗證。

## 本次實際生成提示詞

以下為內建 imagegen 使用的完整提示詞；人物與敵人設定 transparent_background=true，背景設定 false。未使用 Midjourney 專用參數。

### 雲清川
Use case: stylized-concept. Asset type: production standalone 2D game character sprite for a Taiwanese schoolchild wuxia typing game. Generate ONE full-body martial arts boy Yun Qingchuan, age 12, gentle determined expression, simple humble greyish-blue cotton cross-collar scholar robe, cloth belt, fabric arm wraps, cloth boots, half-tied dark hair. Holding a peach wood training short sword pointing slightly downward towards the right. Three-quarter SIDE view facing RIGHT, gaze and torso clearly towards right, ready relaxed standing pose. Clean strong silhouette, crisp fine anime outlines with soft muted watercolor ink wash coloring, elegant new Chinese wuxia anime aesthetic, natural child proportions, not chibi, not realistic 3D. Full head, hair, both feet, both hands and entire sword visible, generous 8 percent empty margin, portrait 3:4 composition. Actual transparent alpha background; no white backing, no checkerboard painted into image, no scenery, no ground shadow, no pedestal, no aura, no motion effects, no text, no logo or watermark. Separate usable game sprite, not a character sheet.

### 稻草人
Use case: stylized-concept. Asset type: ONE standalone transparent 2D enemy sprite for a Taiwanese schoolchild wuxia typing game. Full-body traditional martial arts training straw dummy, woven golden straw bundles tied to bamboo frame and upright wooden post, conical bamboo straw hat, torn faded brown cotton training vest, simple friendly nonhuman target face, rustic handmade practice target. Three-quarter side orientation facing LEFT. Full hat, outstretched straw arms and complete bottom of wooden post visible, generous margin. Clean fine anime outlines, soft watercolor ink wash coloring, elegant muted new Chinese wuxia illustration, warm straw yellow and earthy brown, matching an anime boy with greyish-blue cotton robe and peachwood sword. Actual transparent alpha background. No white backing, no painted checkerboard, no ground shadow, no scenery, no text, no watermark, no glow, no blood, no additional objects, not a sheet. Portrait 3:4 composition.

### 山門演武場
Use case: stylized-concept. Asset type: ONE standalone 2D wuxia game battle background, panoramic horizontal 16:9 composition. Mountain martial arts academy gate training ground, distant misty blue-grey peaks, gentle morning clouds, traditional wooden Chinese mountain gate with tiled roof beyond stone stairs in middle distance, broad EMPTY level stone-paved training ground in foreground. Soft muted watercolor ink-wash illustration with delicate anime environment outlines, grey blue, subdued sage and warm pale stone palette, low contrast and desaturated, matching a grey-blue robed anime child swordsman and warm yellow straw practice dummy, peaceful morning academy atmosphere. Eye-level side-battle camera, NOT top-down map, keep foreground fighting plane across 65 to 75 percent of image height, left and right foreground clear for separately composited characters. Upper central region quiet mist with no busy ornament so an opaque question scroll can sit there. No characters, no straw dummies, no weapons, no text or signage lettering, no interface, no border, no watermark. Finished edge-to-edge opaque background, not a mockup.

