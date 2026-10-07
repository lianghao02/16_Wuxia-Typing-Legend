# 新國風美術素材 v2 與自適應接入說明

日期：2026-10-06（臺灣）。使用 Codex 內建 imagegen 重新生成，再整理成指定尺寸。只新增 v2 PNG 與本說明；未修改既有程式或 v1 素材。

## 全域規則
新國風水墨動畫插畫、乾淨輪廓、沉穩淡彩、柔和光影、適合學童；避免暗黑血腥、日系動漫符號及美式厚塗。
主角面朝右，敵人面朝左，3/4 視角，完整武器與飄帶，透明背景及四周至少 15% 安全留白。
背景中央保持低對比與薄霧；演武場設計基準 Y=68%。
後續道具及頭像：512×512，透明背景，單一主體置中。本批沒有生成圖示。

## 檔案與驗證
| 路徑 | 尺寸 | 模式 | 非零 alpha 邊界 |
|---|---|---|---|
| assets/characters/yun_wood_idle_v2.png | 1080×1440 | RGBA | (176,220,904,1220) |
| assets/enemies/straw_idle_v2.png | 1080×1440 | RGBA | (186,220,894,1220) |
| assets/backgrounds/mountain_gate_v2.png | 1920×1080 | RGB | 不適用 |

alpha 邊界格式為 (left,top,right,bottom)，右與下不包含端點。
兩張立繪均確認 alpha 範圍 0–255；所有非透明像素在 x=162..918、y=216..1224 內。實際安全區檢查通過。
生成原圖尺寸為 1086×1448 與 1672×941；成品經過尺寸整理，立繪等比例縮放並放入透明畫布，未把背景改成白色或另作去背。
兩張是靜態待機圖，不是動畫圖集。背景地面轉折目視接近 68%；水墨筆觸不是逐像素銳利的邊界，不能宣稱地面每個像素精準落在 734.4。
腳部具有 3/4 透視前後差，不是兩個鞋底在同一像素列；接入時用接地 anchor 作共同地面定位。

## 透明邊界與接地定位
非零 alpha 包含極淡邊緣，不能直接把最大 alpha 邊界下緣當作可見腳底。
alpha≥128 的可見主體邊界：
- 主角：(348,421,833,1152)
- 稻草人：(293,396,786,1127)

起始接地 anchor（視覺估計，必須實機微調）：
- 主角約 (540,1152)，亦即 (0.5000,0.8000)。
- 稻草人約 (560,1127)，亦即 (0.5185,0.7826)。
主角定位點是兩腳接地區域，稻草人是木柱底部。不要以圖片中心或整張圖最下緣定位。

## 自適應規則（供 Antigravity）
1. 先算出「戰鬥區」，扣除 HUD、題目及鍵盤／工具列需要的空間。不要直接以整個螢幕高度決定人物大小。
2. 戰鬥區以 1920×1080 設計座標為基準，scale=min(可用寬/1920,可用高/1080)。等比例縮放，置中，剩餘空間以背景色／延伸裝飾填滿。
3. 設計地面線為 y=1080×0.68=734.4；畫面位置為戰鬥區偏移量加上 734.4×scale。禁止任意 cover 裁掉上／下方，否則 68% 基準會漂移。
4. 主角與敵人接地 anchor 對齊同一邏輯地面線。主角 x≈24%、敵人 x≈76% 作起點，但需看劍尖、稻草手臂與實際 UI 邊界。
5. 兩張素材透明留白很多。顯示大小用「可見主體高度」而非整張 PNG 高度估算；例如主角可見高度約 731 像素，稻草人約 731 像素。
6. 立繪顯示倍率不應超出可用戰鬥高度，也不要遮住下一鍵指法提示。狹窄螢幕優先縮小、調整配置或提示橫向操作，不拉伸人物。
7. 高 DPI：Canvas backing store 使用 CSS 尺寸×devicePixelRatio；繪圖座標維持 CSS／設計座標，避免把 DPR 再乘到人物大小。
8. 圖片非同步快取；載入前、失敗、缺檔保持原向量備援。切換角色／裝備／敵人時，只用對應素材，不把 yun 木劍套到 su 或其他裝備。
9. 背景已有地面，避免原程式不透明地板覆蓋；人物已持劍，避免重複畫一把劍。
10. 保留題目、注音、數值與按鍵提示的原生文字顯示。背景可按實際畫面套一致的淡色遮罩以調整對比，先驗證可讀性。

素材對應：
- yun + wood_sword → characters/yun_wood_idle_v2.png
- 基礎稻草人 → enemies/straw_idle_v2.png（尚無鐵甲或機關草人新版）
- mountain_gate → backgrounds/mountain_gate_v2.png

## 尚待實機驗證
1366×768、1920×1080、2560×1440、窄視窗與高 DPI；確認頭髮、劍尖與手臂無裁切，題目不受遮擋，接地自然，圖檔失敗時仍可遊玩。
本次沒有執行瀏覽器整合或自適應程式修改。

## 完整生成提示詞
主角與敵人設定 transparent_background=true，背景為 false。生成工具為內建 imagegen。

### 主角
Generate ONE production game asset: Yun Qingchuan, 12-year-old boy swordsman, for a Taiwanese elementary school wuxia educational game. GLOBAL STYLE: high-quality contemporary GUOFENG Chinese INK-WASH ANIMATION ILLUSTRATION, clean clear ink contour lines, elegant subdued grey-blue cotton robe, soft diffuse shading, grounded Chinese illustrated facial proportions, child-friendly, NOT Japanese anime, NOT American painterly concept art, not dark or bloody. Half-tied black hair, cloth waist belt, fabric wrist wraps, plain cloth boots, peachwood short training sword. THREE-QUARTER SIDE VIEW, head body and gaze facing RIGHT. Static ready stance holding wooden sword diagonally downward to the right; both feet flat at a common horizontal baseline. TRUE TRANSPARENT PNG alpha, isolated, no ground shadow, no white backdrop, no solid color, no scenery, no aura, no text. Target canvas 1080x1440 portrait 3:4. CRITICAL FRAMING: ALL visible parts including hair ribbons and entire sword must be INSIDE central 70 percent rectangle: x=162 through 918, y=216 through 1224. Exactly at least 15 percent EMPTY TRANSPARENT padding on ALL FOUR SIDES. Draw the whole character relatively SMALL inside this frame, do not fill canvas; head near y=230, flat feet baseline y=1210. Hands anatomically clean, full sword tip and robe hem intact. Single complete sprite only.

### 稻草人
ONE standalone 2D enemy sprite for an elementary-school educational wuxia game. High-quality NEW GUOFENG CHINESE INK-WASH ANIMATION ILLUSTRATION, clean expressive ink contour, subtle watercolor straw fibers, elegant muted warm gold and brown, soft light, friendly nonthreatening, NOT Japanese anime or American heavy painted art. Traditional training straw dummy constructed from bundled straw and bamboo framework secured to a single upright wooden post; bamboo conical hat, worn brown training vest, charming simple practice target face. Entire dummy in THREE-QUARTER view facing LEFT, stationary arms extended. Full post bottom lies flat on the baseline. Pure transparent alpha PNG, no ground shadow, no pedestal, no landscape, no white or solid background, no text. 1080x1440 portrait 3:4. Reserve AT LEAST 15 PERCENT COMPLETELY EMPTY TRANSPARENT MARGINS ON ALL SIDES: every straw tip, hat, arms, cloth and wooden post must fit within x162..918, y216..1224. Deliberately SMALL centered full-body sprite inside middle 70 percent, not a tight crop. Lowest post point at y1210. No glow or smoke, no checkerboard painted into background, single asset.

### 背景
ONE production 2D educational wuxia battle BACKGROUND, exact target 1920x1080 landscape 16:9. High-quality NEW GUOFENG CHINESE INK-WASH ANIMATION ILLUSTRATION, beautiful economical clean ink contours, subtle watercolor texture, restrained pale grey-blue and sage mountains, soft morning light, child-friendly elegance, NOT Japanese anime, NOT American heavy painting, NOT photorealistic. Mountain martial arts gate academy with distant misty layered peaks and a small traditional tiled-roof wooden gate set towards the RIGHT edge in far middle distance. Central upper and middle field mostly quiet pale mist and ink-wash negative space, very low contrast, no prominent objects in center. STRICT COMPOSITION: all foreground flat stone training ground occupies EXACTLY LOWER 32 PERCENT of frame, TOP EDGE OF FLAT FOREGROUND FLOOR is a straight HORIZONTAL LINE at Y=68 percent (734.4 pixels of 1080). Everything above this line is distant misty landscape; everything below is low contrast clear level stone-paved fighting platform. No foreground stairs, floor must not begin halfway up the image. Clear left and right fighting positions. No people, no training dummies, no animals, no UI, no text, no watermark, no border. Full edge-to-edge opaque background.

