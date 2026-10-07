/**
 * 《武俠打字傳》全套題庫與常用國字注音大字典 (vocabulary.js)
 * 涵蓋：
 * 1. 教育部國語小字典離線查詢（含多音字與完整條目）
 * 2. 暗黑式三大難度題庫：
 *    - 易（初出茅廬）：1~2 年級單鍵、拼音單字、基礎生活詞
 *    - 中（名震江湖）：3~4 年級課本生詞、教育部實用四字成語
 *    - 難（一代宗師）：5~6 年級進階成語、唐詩名句、課文長句
 * 3. 英文雙語對應庫
 */

import { COMMON_CHAR_BOPOMOFO_MAP, resolveDictionaryReading, getCharacterReadings,
  isDictionaryReading, getDictionaryExampleReading, normalizeReadingForComparison } from './moeDictionary.js';
export { COMMON_CHAR_BOPOMOFO_MAP };

/**
 * 暗黑三大難度題庫庫房
 * 每一關精選 10 道目標題，完全符合每關擊破 10 題之戰鬥循環
 */
export const DIFFICULTY_BANKS = {
  // 境界一：初出茅廬（易）- 低年級適合：單鍵注音、拼音單字、基礎生活短詞
  easy: {
    stage_1: [ // 稻草人：唇音與舌尖聲母
      { text: 'ㄅ', bopomofo: ['ㄅ'], meaning: '聲母練習：ㄅ（左手小指 1）', isSingleKey: true },
      { text: 'ㄆ', bopomofo: ['ㄆ'], meaning: '聲母練習：ㄆ（左手小指 Q）', isSingleKey: true },
      { text: 'ㄇ', bopomofo: ['ㄇ'], meaning: '聲母練習：ㄇ（左手小指 A）', isSingleKey: true },
      { text: 'ㄈ', bopomofo: ['ㄈ'], meaning: '聲母練習：ㄈ（左手小指 Z）', isSingleKey: true },
      { text: 'ㄉ', bopomofo: ['ㄉ'], meaning: '聲母練習：ㄉ（左手無名指 2）', isSingleKey: true },
      { text: 'ㄊ', bopomofo: ['ㄊ'], meaning: '聲母練習：ㄊ（左手無名指 W）', isSingleKey: true },
      { text: 'ㄋ', bopomofo: ['ㄋ'], meaning: '聲母練習：ㄋ（左手無名指 S）', isSingleKey: true },
      { text: 'ㄌ', bopomofo: ['ㄌ'], meaning: '聲母練習：ㄌ（左手無名指 X）', isSingleKey: true },
      { text: 'ㄍ', bopomofo: ['ㄍ'], meaning: '聲母練習：ㄍ（左手中指 E）', isSingleKey: true },
      { text: 'ㄎ', bopomofo: ['ㄎ'], meaning: '聲母練習：ㄎ（左手中指 D）', isSingleKey: true }
    ],
    stage_2: [ // 木人樁：介音與單韻母
      { text: 'ㄧ', bopomofo: ['ㄧ'], meaning: '介音練習：ㄧ（右手食指 U）', isSingleKey: true },
      { text: 'ㄨ', bopomofo: ['ㄨ'], meaning: '介音練習：ㄨ（右手食指 J）', isSingleKey: true },
      { text: 'ㄩ', bopomofo: ['ㄩ'], meaning: '介音練習：ㄩ（右手食指 M）', isSingleKey: true },
      { text: 'ㄚ', bopomofo: ['ㄚ'], meaning: '韻母練習：ㄚ（右手中指 8）', isSingleKey: true },
      { text: 'ㄛ', bopomofo: ['ㄛ'], meaning: '韻母練習：ㄛ（右手中指 I）', isSingleKey: true },
      { text: 'ㄜ', bopomofo: ['ㄜ'], meaning: '韻母練習：ㄜ（右手中指 K）', isSingleKey: true },
      { text: 'ㄝ', bopomofo: ['ㄝ'], meaning: '韻母練習：ㄝ（右手中指 ,）', isSingleKey: true },
      { text: 'ㄞ', bopomofo: ['ㄞ'], meaning: '複韻母：ㄞ（右手無名指 9）', isSingleKey: true },
      { text: 'ㄟ', bopomofo: ['ㄟ'], meaning: '複韻母：ㄟ（右手無名指 O）', isSingleKey: true },
      { text: 'ㄠ', bopomofo: ['ㄠ'], meaning: '複韻母：ㄠ（右手無名指 L）', isSingleKey: true }
    ],
    stage_3: [ // 巡山小賊：單字拼音初試
      { text: '大', bopomofo: ['ㄉㄚˋ'], meaning: '面積或體積廣闊。' },
      { text: '小', bopomofo: ['ㄒㄧㄠˇ'], meaning: '體積或數量不多。' },
      { text: '上', bopomofo: ['ㄕㄤˋ'], meaning: '高處或往前進。' },
      { text: '下', bopomofo: ['ㄒㄧㄚˋ'], meaning: '低處或往後退。' },
      { text: '人', bopomofo: ['ㄖㄣˊ'], meaning: '人類萬物之靈。' },
      { text: '口', bopomofo: ['ㄎㄡˇ'], meaning: '嘴巴，發音說話之器官。' },
      { text: '手', bopomofo: ['ㄕㄡˇ'], meaning: '人體上肢拿取物體之部位。' },
      { text: '足', bopomofo: ['ㄗㄨˊ'], meaning: '腳，行走跑跳之部位。' },
      { text: '心', bopomofo: ['ㄒㄧㄣ'], meaning: '思想情感的來源。' },
      { text: '山', bopomofo: ['ㄕㄢ'], meaning: '地面高聳隆起的部分。' }
    ],
    stage_4: [ // 斗笠山賊：自然單字
      { text: '水', bopomofo: ['ㄕㄨㄟˇ'], meaning: '萬物生長所依賴之液體。' },
      { text: '火', bopomofo: ['ㄏㄨㄛˇ'], meaning: '燃燒所產生之光熱。' },
      { text: '木', bopomofo: ['ㄇㄨˋ'], meaning: '樹木木材。' },
      { text: '土', bopomofo: ['ㄊㄨˇ'], meaning: '地面的泥土。' },
      { text: '日', bopomofo: ['ㄖˋ'], meaning: '太陽或白天。' },
      { text: '月', bopomofo: ['ㄩㄝˋ'], meaning: '夜空發光的星球。' },
      { text: '風', bopomofo: ['ㄈㄥ'], meaning: '空氣流動形成的現象。' },
      { text: '雲', bopomofo: ['ㄩㄣˊ'], meaning: '漂浮在空中的水氣。' },
      { text: '雨', bopomofo: ['ㄩˇ'], meaning: '天空中降下的水滴。' },
      { text: '天', bopomofo: ['ㄊㄧㄢ'], meaning: '頭頂上無邊無際的蒼穹。' }
    ],
    stage_5: [ // 雙斧悍匪：基礎雙字詞
      { text: '朋友', bopomofo: ['ㄆㄥˊ', 'ㄧㄡˇ'], meaning: '互相扶持的夥伴。' },
      { text: '少俠', bopomofo: ['ㄕㄠˋ', 'ㄒㄧㄚˊ'], meaning: '年少正直的劍客。' },
      { text: '竹林', bopomofo: ['ㄓㄨˊ', 'ㄌㄧㄣˊ'], meaning: '竹子生長聚集成林。' },
      { text: '小橋', bopomofo: ['ㄒㄧㄠˇ', 'ㄑㄧㄠˊ'], meaning: '跨越溪流的小型通道。' },
      { text: '流水', bopomofo: ['ㄌㄧㄡˊ', 'ㄕㄨㄟˇ'], meaning: '涓涓不息的山泉溪流。' },
      { text: '明月', bopomofo: ['ㄇㄧㄥˊ', 'ㄩㄝˋ'], meaning: '皎潔清朗的月亮。' },
      { text: '清風', bopomofo: ['ㄑㄧㄥ', 'ㄈㄥ'], meaning: '清涼舒適的微風。' },
      { text: '白雲', bopomofo: ['ㄅㄞˊ', 'ㄩㄣˊ'], meaning: '天空中純白的雲朵。' },
      { text: '青山', bopomofo: ['ㄑㄧㄥ', 'ㄕㄢ'], meaning: '綠樹覆蓋的高山。' },
      { text: '春風', bopomofo: ['ㄔㄨㄣ', 'ㄈㄥ'], meaning: '春天溫暖宜人的風。' }
    ],
    stage_6: [ // 武當小道童：校園與生活詞彙
      { text: '讀書', bopomofo: ['ㄉㄨˊ', 'ㄕㄨ'], meaning: '閱讀典籍吸收新知。' },
      { text: '寫字', bopomofo: ['ㄒㄧㄝˇ', 'ㄗˋ'], meaning: '拿筆一筆一畫書寫。' },
      { text: '同學', bopomofo: ['ㄊㄨㄥˊ', 'ㄒㄩㄝˊ'], meaning: '在同一學堂共修之人。' },
      { text: '老師', bopomofo: ['ㄌㄠˇ', 'ㄕ'], meaning: '傳道授業解惑的長者。' },
      { text: '快樂', bopomofo: ['ㄎㄨㄞˋ', 'ㄌㄜˋ'], meaning: '心情歡喜無憂。' },
      { text: '光明', bopomofo: ['ㄍㄨㄤ', 'ㄇㄧㄥˊ'], meaning: '亮麗照耀、充滿希望。' },
      { text: '平安', bopomofo: ['ㄆㄧㄥˊ', 'ㄢ'], meaning: '心神寧靜、平穩無災。' },
      { text: '健康', bopomofo: ['ㄐㄧㄢˋ', 'ㄎㄤ'], meaning: '身強體健無病痛。' },
      { text: '禮貌', bopomofo: ['ㄌㄧˇ', 'ㄇㄠˋ'], meaning: '以謙遜敬意待人。' },
      { text: '誠實', bopomofo: ['ㄔㄥˊ', 'ㄕˊ'], meaning: '真心以對不作偽。' }
    ],
    stage_7: [ // 黑風左護法：武俠初探詞彙
      { text: '江湖', bopomofo: ['ㄐㄧㄤ', 'ㄏㄨˊ'], meaning: '四方武林遊俠的世界。' },
      { text: '客棧', bopomofo: ['ㄎㄜˋ', 'ㄓㄢˋ'], meaning: '江湖遊子落腳歇息之所。' },
      { text: '寶劍', bopomofo: ['ㄅㄠˇ', 'ㄐㄧㄢˋ'], meaning: '鋒利尊貴的佩劍。' },
      { text: '刀光', bopomofo: ['ㄉㄠ', 'ㄍㄨㄤ'], meaning: '刀刃掠過的雪白亮光。' },
      { text: '劍氣', bopomofo: ['ㄐㄧㄢˋ', 'ㄑㄧˋ'], meaning: '長劍揮動激發的氣勁。' },
      { text: '武藝', bopomofo: ['ㄨˇ', 'ㄧˋ'], meaning: '修煉有成的武學招式。' },
      { text: '英雄', bopomofo: ['ㄧㄥ', 'ㄒㄩㄥˊ'], meaning: '膽識過人立大功之人。' },
      { text: '門派', bopomofo: ['ㄇㄣˊ', 'ㄆㄞˋ'], meaning: '傳承武學之宗門。' },
      { text: '修行', bopomofo: ['ㄒㄧㄡ', 'ㄒㄧㄥˊ'], meaning: '修養心性練就本領。' },
      { text: '正氣', bopomofo: ['ㄓㄥˋ', 'ㄑㄧˋ'], meaning: '光明磊落的正道浩氣。' }
    ],
    stage_8: [ // 擂台力士：成語小試
      { text: '一心一意', bopomofo: ['ㄧ', 'ㄒㄧㄣ', 'ㄧ', 'ㄧˋ'], meaning: '專心一致毫無二心。' },
      { text: '十全十美', bopomofo: ['ㄕˊ', 'ㄑㄩㄢˊ', 'ㄕˊ', 'ㄇㄟˇ'], meaning: '圓滿無缺極為美好。' },
      { text: '三言兩語', bopomofo: ['ㄙㄢ', 'ㄧㄢˊ', 'ㄌㄧㄤˇ', 'ㄩˇ'], meaning: '簡短幾句話就說明清楚。' },
      { text: '五顏六色', bopomofo: ['ㄨˇ', 'ㄧㄢˊ', 'ㄌㄧㄡˋ', 'ㄙㄜˋ'], meaning: '形容色彩繽紛鮮豔。' },
      { text: '七上八下', bopomofo: ['ㄑㄧ', 'ㄕㄤˋ', 'ㄅㄚ', 'ㄒㄧㄚˋ'], meaning: '心情忐忑不安懸在半空。' },
      { text: '千山萬水', bopomofo: ['ㄑㄧㄢ', 'ㄕㄢ', 'ㄨㄢˋ', 'ㄕㄨㄟˇ'], meaning: '路途遙遠歷盡艱辛。' },
      { text: '大同小異', bopomofo: ['ㄉㄚˋ', 'ㄊㄨㄥˊ', 'ㄒㄧㄠˇ', 'ㄧˋ'], meaning: '大體相同僅有微小差別。' },
      { text: '長長久久', bopomofo: ['ㄔㄤˊ', 'ㄔㄤˊ', 'ㄐㄧㄡˇ', 'ㄐㄧㄡˇ'], meaning: '時間久遠持之以恆。' },
      { text: '開開心心', bopomofo: ['ㄎㄞ', 'ㄎㄞ', 'ㄒㄧㄣ', 'ㄒㄧㄣ'], meaning: '歡喜舒暢毫無煩憂。' },
      { text: '快快樂樂', bopomofo: ['ㄎㄨㄞˋ', 'ㄎㄨㄞˋ', 'ㄌㄜˋ', 'ㄌㄜˋ'], meaning: '充滿歡笑輕鬆度日。' }
    ],
    stage_9: [ // 機關傀儡：短句暖身
      { text: '白日依山盡', bopomofo: ['ㄅㄞˊ', 'ㄖˋ', 'ㄧ', 'ㄕㄢ', 'ㄐㄧㄣˋ'], meaning: '夕陽依傍著西山慢慢落下。' },
      { text: '黃河入海流', bopomofo: ['ㄏㄨㄤˊ', 'ㄏㄜˊ', 'ㄖㄨˋ', 'ㄏㄞˇ', 'ㄌㄧㄡˊ'], meaning: '黃河流水滔滔奔向大海。' },
      { text: '欲窮千里目', bopomofo: ['ㄩˋ', 'ㄑㄩㄥˊ', 'ㄑㄧㄢ', 'ㄌㄧˇ', 'ㄇㄨˋ'], meaning: '想要看得更遠更廣。' },
      { text: '更上一層樓', bopomofo: ['ㄍㄥˋ', 'ㄕㄤˋ', 'ㄧ', 'ㄘㄥˊ', 'ㄌㄡˊ'], meaning: '勉勵人精益求精再跨一步。' },
      { text: '舉頭望明月', bopomofo: ['ㄐㄩˇ', 'ㄊㄡˊ', 'ㄨㄤˋ', 'ㄇㄧㄥˊ', 'ㄩㄝˋ'], meaning: '抬頭看著天上的明月。' },
      { text: '低頭思故鄉', bopomofo: ['ㄉㄧ', 'ㄊㄡˊ', 'ㄙ', 'ㄍㄨˋ', 'ㄒㄧㄤ'], meaning: '低下頭思念家鄉故人。' },
      { text: '春去花還在', bopomofo: ['ㄔㄨㄣ', 'ㄑㄩˋ', 'ㄏㄨㄚ', 'ㄏㄞˊ', 'ㄗㄞˋ'], meaning: '春天離去但花兒依舊盛開。' },
      { text: '人來鳥不驚', bopomofo: ['ㄖㄣˊ', 'ㄌㄞˊ', 'ㄋㄧㄠˇ', 'ㄅㄨˋ', 'ㄐㄧㄥ'], meaning: '人走過來鳥兒也不害怕。' },
      { text: '松下問童子', bopomofo: ['ㄙㄨㄥ', 'ㄒㄧㄚˋ', 'ㄨㄣˋ', 'ㄊㄨㄥˊ', 'ㄗˇ'], meaning: '在松樹下詢問小童子。' },
      { text: '言師採藥去', bopomofo: ['ㄧㄢˊ', 'ㄕ', 'ㄘㄞˇ', 'ㄧㄠˋ', 'ㄑㄩˋ'], meaning: '說師父已經上山採藥。' }
    ],
    stage_10: [ // 山大王黑風盜：境界一決戰 10 題
      { text: '橋', bopomofo: ['ㄑㄧㄠˊ'], meaning: '橫跨水面的通道。' },
      { text: '小橋倒影', bopomofo: ['ㄒㄧㄠˇ', 'ㄑㄧㄠˊ', 'ㄉㄠˋ', 'ㄧㄥˇ'], meaning: '小橋映照在清溪中。' },
      { text: '行俠仗義', bopomofo: ['ㄒㄧㄥˊ', 'ㄒㄧㄚˊ', 'ㄓㄤˋ', 'ㄧˋ'], meaning: '見義勇為幫助弱小。' },
      { text: '自強不息', bopomofo: ['ㄗˋ', 'ㄑㄧㄤˊ', 'ㄅㄨˋ', 'ㄒㄧˊ'], meaning: '奮發圖強永不懈怠。' },
      { text: '見義勇為', bopomofo: ['ㄐㄧㄢˋ', 'ㄧˋ', 'ㄩㄥˇ', 'ㄨㄟˊ'], meaning: '勇敢挺身而出主持正義。' },
      { text: '風起雲湧', bopomofo: ['ㄈㄥ', 'ㄑㄧˇ', 'ㄩㄣˊ', 'ㄩㄥˇ'], meaning: '聲勢盛大迅速崛起。' },
      { text: '一氣呵成', bopomofo: ['ㄧ', 'ㄑㄧˋ', 'ㄏㄜ', 'ㄔㄥˊ'], meaning: '連貫流暢一口氣完成。' },
      { text: '全力以赴', bopomofo: ['ㄑㄩㄢˊ', 'ㄌㄧˋ', 'ㄧˇ', 'ㄈㄨˋ'], meaning: '傾盡所有心力向前衝。' },
      { text: '十年磨一劍', bopomofo: ['ㄕˊ', 'ㄋㄧㄢˊ', 'ㄇㄛˊ', 'ㄧ', 'ㄐㄧㄢˋ'], meaning: '長期刻苦修煉終於有成。' },
      { text: '霜刃未曾試', bopomofo: ['ㄕㄨㄤ', 'ㄖㄣˋ', 'ㄨㄟˋ', 'ㄘㄥˊ', 'ㄕˋ'], meaning: '雪亮的鋒芒即將出鞘！' }
    ]
  },

  // 境界二：名震江湖（中）- 中年級適合：成語大成、生詞修煉、多音字挑戰
  medium: {
    stage_1: [ // 鐵甲稻草人
      { text: '走過小橋', bopomofo: ['ㄗㄡˇ', 'ㄍㄨㄛˋ', 'ㄒㄧㄠˇ', 'ㄑㄧㄠˊ'], meaning: '康軒二上課本生詞。' },
      { text: '清溪倒影', bopomofo: ['ㄑㄧㄥ', 'ㄒㄧ', 'ㄉㄠˋ', 'ㄧㄥˇ'], meaning: '溪水清澈可見倒影。' },
      { text: '秋天的信', bopomofo: ['ㄑㄧㄡ', 'ㄊㄧㄢ', 'ㄉㄜ˙', 'ㄒㄧㄣˋ'], meaning: '秋季涼爽捎來書信。' },
      { text: '落葉繽紛', bopomofo: ['ㄌㄨㄛˋ', 'ㄧㄝˋ', 'ㄅㄧㄣ', 'ㄈㄣ'], meaning: '樹葉隨風灑落如雨。' },
      { text: '溫暖陽光', bopomofo: ['ㄨㄣ', 'ㄋㄨㄢˇ', 'ㄧㄤˊ', 'ㄍㄨㄤ'], meaning: '和煦日光照耀大地。' },
      { text: '歡樂時光', bopomofo: ['ㄏㄨㄢ', 'ㄌㄜˋ', 'ㄕˊ', 'ㄍㄨㄤ'], meaning: '相聚的愉悅時刻。' },
      { text: '志同道合', bopomofo: ['ㄓˋ', 'ㄊㄨㄥˊ', 'ㄉㄠˋ', 'ㄏㄜˊ'], meaning: '目標志向一致的夥伴。' },
      { text: '同心協力', bopomofo: ['ㄊㄨㄥˊ', 'ㄒㄧㄣ', 'ㄒㄧㄝˊ', 'ㄌㄧˋ'], meaning: '齊心合力完成目標。' },
      { text: '勤學好問', bopomofo: ['ㄑㄧㄣˊ', 'ㄒㄩㄝˊ', 'ㄏㄠˋ', 'ㄨㄣˋ'], meaning: '認真求學並主動請益。' },
      { text: '腳踏實地', bopomofo: ['ㄐㄧㄠˇ', 'ㄊㄚˋ', 'ㄕˊ', 'ㄉㄧˋ'], meaning: '做事認真穩健不虛浮。' }
    ],
    stage_2: [ // 銅臂木人樁：成語基礎
      { text: '臥虎藏龍', bopomofo: ['ㄨㄛˋ', 'ㄏㄨˇ', 'ㄘㄤˊ', 'ㄌㄨㄥˊ'], meaning: '潛藏未被發現的高手。' },
      { text: '守株待兔', bopomofo: ['ㄕㄡˇ', 'ㄓㄨ', 'ㄉㄞˋ', 'ㄊㄨˋ'], meaning: '死守成規不知變通。' },
      { text: '亡羊補牢', bopomofo: ['ㄨㄤˊ', 'ㄧㄤˊ', 'ㄅㄨˇ', 'ㄌㄠˊ'], meaning: '出了差錯及時補救。' },
      { text: '畫龍點睛', bopomofo: ['ㄏㄨㄚˋ', 'ㄌㄨㄥˊ', 'ㄉㄧㄢˇ', 'ㄐㄧㄥ'], meaning: '在關鍵處加上精彩一筆。' },
      { text: '對牛彈琴', bopomofo: ['ㄉㄨㄟˋ', 'ㄋㄧㄡˊ', 'ㄊㄢˊ', 'ㄑㄧㄣˊ'], meaning: '比喻對不懂的人說深奧道理。' },
      { text: '井底之蛙', bopomofo: ['ㄐㄧㄥˇ', 'ㄉㄧˇ', 'ㄓ', 'ㄨㄚ'], meaning: '見識狹窄目光短淺。' },
      { text: '狐假虎威', bopomofo: ['ㄏㄨˊ', 'ㄐㄧㄚˇ', 'ㄏㄨˇ', 'ㄨㄟ'], meaning: '借用他人的聲勢欺人。' },
      { text: '拔苗助長', bopomofo: ['ㄅㄚˊ', 'ㄇㄧㄠˊ', 'ㄓㄨˋ', 'ㄓㄤˇ'], meaning: '急於求成反而壞了大事。' },
      { text: '盲人摸象', bopomofo: ['ㄇㄤˊ', 'ㄖㄣˊ', 'ㄇㄛ', 'ㄒㄧㄤˋ'], meaning: '以偏概全不見全貌。' },
      { text: '杯弓蛇影', bopomofo: ['ㄅㄟ', 'ㄍㄨㄥ', 'ㄕㄜˊ', 'ㄧㄥˇ'], meaning: '疑神疑鬼自己嚇自己。' }
    ],
    stage_3: [ // 黑風寨刀客
      { text: '百步穿楊', bopomofo: ['ㄅㄞˇ', 'ㄅㄨˋ', 'ㄔㄨㄢ', 'ㄧㄤˊ'], meaning: '箭法精準百發百中。' },
      { text: '鐵杵磨針', bopomofo: ['ㄊㄧㄝˇ', 'ㄔㄨˇ', 'ㄇㄛˊ', 'ㄓㄣ'], meaning: '有恆心毅力必有所成。' },
      { text: '聞雞起舞', bopomofo: ['ㄨㄣˊ', 'ㄐㄧ', 'ㄑㄧˇ', 'ㄨˇ'], meaning: '及時奮發刻苦磨練。' },
      { text: '懸梁刺股', bopomofo: ['ㄒㄩㄢˊ', 'ㄌㄧㄤˊ', 'ㄘˋ', 'ㄍㄨˇ'], meaning: '刻苦用功廢寢忘食。' },
      { text: '程門立雪', bopomofo: ['ㄔㄥˊ', 'ㄇㄣˊ', 'ㄌㄧˋ', 'ㄒㄩㄝˇ'], meaning: '尊師重道極有誠意。' },
      { text: '破釜沉舟', bopomofo: ['ㄆㄛˋ', 'ㄈㄨˇ', 'ㄔㄣˊ', 'ㄓㄡ'], meaning: '下定決心絕不後退。' },
      { text: '迎刃而解', bopomofo: ['ㄧㄥˊ', 'ㄖㄣˋ', 'ㄦˊ', 'ㄐㄧㄝˇ'], meaning: '問題順暢解決。' },
      { text: '水到渠成', bopomofo: ['ㄕㄨㄟˇ', 'ㄉㄠˋ', 'ㄑㄩˊ', 'ㄔㄥˊ'], meaning: '條件成熟事情自然辦成。' },
      { text: '胸有成竹', bopomofo: ['ㄒㄩㄥ', 'ㄧㄡˇ', 'ㄔㄥˊ', 'ㄓㄨˊ'], meaning: '做事早有周全打算。' },
      { text: '循序漸進', bopomofo: ['ㄒㄩㄣˊ', 'ㄒㄩˋ', 'ㄐㄧㄢˋ', 'ㄐㄧㄣˋ'], meaning: '按步驟穩健向前推進。' }
    ],
    stage_4: [ // 奪命連環刀
      { text: '行雲流水', bopomofo: ['ㄒㄧㄥˊ', 'ㄩㄣˊ', 'ㄌㄧㄡˊ', 'ㄕㄨㄟˇ'], meaning: '自然流暢毫無阻礙。' },
      { text: '天衣無縫', bopomofo: ['ㄊㄧㄢ', 'ㄧ', 'ㄨˊ', 'ㄈㄥˋ'], meaning: '完美無瑕毫無破綻。' },
      { text: '妙手回春', bopomofo: ['ㄇㄧㄠˋ', 'ㄕㄡˇ', 'ㄏㄨㄟˊ', 'ㄔㄨㄣ'], meaning: '醫術高超使人起死回生。' },
      { text: '出神入化', bopomofo: ['ㄔㄨ', 'ㄕㄣˊ', 'ㄖㄨˋ', 'ㄏㄨㄚˋ'], meaning: '技藝達到極高境界。' },
      { text: '爐火純青', bopomofo: ['ㄌㄨˊ', 'ㄏㄨㄛˇ', 'ㄔㄨㄣˊ', 'ㄑㄧㄥ'], meaning: '功夫純熟達到頂尖。' },
      { text: '神鬼莫測', bopomofo: ['ㄕㄣˊ', 'ㄍㄨㄟˇ', 'ㄇㄛˋ', 'ㄘㄜˋ'], meaning: '變化多端無法預料。' },
      { text: '登峰造極', bopomofo: ['ㄉㄥ', 'ㄈㄥ', 'ㄗㄠˋ', 'ㄐㄧˊ'], meaning: '達到最高成就。' },
      { text: '巧奪天工', bopomofo: ['ㄑㄧㄠˇ', 'ㄉㄨㄛˊ', 'ㄊㄧㄢ', 'ㄍㄨㄥ'], meaning: '技藝精巧勝過天然造化。' },
      { text: '舉世無雙', bopomofo: ['ㄐㄩˇ', 'ㄕˋ', 'ㄨˊ', 'ㄕㄨㄤ'], meaning: '世界上沒有人能比得上。' },
      { text: '無與倫比', bopomofo: ['ㄨˊ', 'ㄩˇ', 'ㄌㄨㄣˊ', 'ㄅㄧˇ'], meaning: '卓越超群無可比擬。' }
    ],
    stage_5: [ // 開山巨斧手
      { text: '浩然正氣', bopomofo: ['ㄏㄠˋ', 'ㄖㄢˊ', 'ㄓㄥˋ', 'ㄑㄧˋ'], meaning: '剛直宏大之正義氣概。' },
      { text: '頂天立地', bopomofo: ['ㄉㄧㄥˇ', 'ㄊㄧㄢ', 'ㄌㄧˋ', 'ㄉㄧˋ'], meaning: '行事光明磊落極有擔當。' },
      { text: '威風凜凜', bopomofo: ['ㄨㄟ', 'ㄈㄥ', 'ㄌㄧㄣˇ', 'ㄌㄧㄣˇ'], meaning: '氣勢威武令人敬畏。' },
      { text: '氣宇軒昂', bopomofo: ['ㄑㄧˋ', 'ㄩˇ', 'ㄒㄩㄢ', 'ㄤˊ'], meaning: '氣度寬宏神采飛揚。' },
      { text: '意氣風發', bopomofo: ['ㄧˋ', 'ㄑㄧˋ', 'ㄈㄥ', 'ㄈㄚ'], meaning: '精神振奮充滿活力。' },
      { text: '神采奕奕', bopomofo: ['ㄕㄣˊ', 'ㄘㄞˇ', 'ㄧˋ', 'ㄧˋ'], meaning: '精神飽滿容光煥發。' },
      { text: '神勇無比', bopomofo: ['ㄕㄣˊ', 'ㄩㄥˇ', 'ㄨˊ', 'ㄅㄧˇ'], meaning: '勇猛超群無所畏懼。' },
      { text: '勢如破竹', bopomofo: ['ㄕˋ', 'ㄖㄨˊ', 'ㄆㄛˋ', 'ㄓㄨˊ'], meaning: '氣勢強大無可阻擋。' },
      { text: '雷霆萬鈞', bopomofo: ['ㄌㄟˊ', 'ㄊㄧㄥˊ', 'ㄨㄢˋ', 'ㄐㄩㄣ'], meaning: '力量極其巨大震撼。' },
      { text: '翻江倒海', bopomofo: ['ㄈㄢ', 'ㄐㄧㄤ', 'ㄉㄠˇ', 'ㄏㄞˇ'], meaning: '聲勢驚人力量強大。' }
    ],
    stage_6: [ // 武當劍俠
      { text: '清心寡慾', bopomofo: ['ㄑㄧㄥ', 'ㄒㄧㄣ', 'ㄍㄨㄚˇ', 'ㄩˋ'], meaning: '心境清幽無雜念。' },
      { text: '寧靜致遠', bopomofo: ['ㄋㄧㄥˊ', 'ㄐㄧㄥˋ', 'ㄓˋ', 'ㄩㄢˇ'], meaning: '靜心思考方能看得長遠。' },
      { text: '淡泊明志', bopomofo: ['ㄉㄢˋ', 'ㄅㄛˊ', 'ㄇㄧㄥˊ', 'ㄓˋ'], meaning: '不慕名利方顯崇高志向。' },
      { text: '海納百川', bopomofo: ['ㄏㄞˇ', 'ㄋㄚˋ', 'ㄅㄞˇ', 'ㄔㄨㄢ'], meaning: '心胸寬大包容一切。' },
      { text: '有容乃大', bopomofo: ['ㄧㄡˇ', 'ㄖㄨㄥˊ', 'ㄋㄞˇ', 'ㄉㄚˋ'], meaning: '能夠包容方成偉大。' },
      { text: '剛柔並濟', bopomofo: ['ㄍㄤ', 'ㄖㄡˊ', 'ㄅㄧㄥˋ', 'ㄐㄧˋ'], meaning: '堅毅與溫和相輔相成。' },
      { text: '動靜相生', bopomofo: ['ㄉㄨㄥˋ', 'ㄐㄧㄥˋ', 'ㄒㄧㄤ', 'ㄕㄥ'], meaning: '動作與沉靜相輔。' },
      { text: '陰陽相調', bopomofo: ['ㄧㄣ', 'ㄧㄤˊ', 'ㄒㄧㄤ', 'ㄊㄧㄠˊ'], meaning: '平衡調和達到圓融。' },
      { text: '天人合一', bopomofo: ['ㄊㄧㄢ', 'ㄖㄣˊ', 'ㄏㄜˊ', 'ㄧ'], meaning: '心靈與大自然融為一體。' },
      { text: '道法自然', bopomofo: ['ㄉㄠˋ', 'ㄈㄚˇ', 'ㄗˋ', 'ㄖㄢˊ'], meaning: '順應自然之真理。' }
    ],
    stage_7: [ // 奪命右護法
      { text: '草木皆兵', bopomofo: ['ㄘㄠˇ', 'ㄇㄨˋ', 'ㄐㄧㄝ', 'ㄅㄧㄥ'], meaning: '緊張疑慮自己嚇自己。' },
      { text: '風聲鶴唳', bopomofo: ['ㄈㄥ', 'ㄕㄥ', 'ㄏㄜˋ', 'ㄌㄧˋ'], meaning: '慌張逃亡驚恐萬分。' },
      { text: '四面楚歌', bopomofo: ['ㄙˋ', 'ㄇㄧㄢˋ', 'ㄔㄨˇ', 'ㄍㄜ'], meaning: '孤立無援處境危險。' },
      { text: '千鈞一髮', bopomofo: ['ㄑㄧㄢ', 'ㄐㄩㄣ', 'ㄧ', 'ㄈㄚˇ'], meaning: '情況萬分緊急。' },
      { text: '危在旦夕', bopomofo: ['ㄨㄟˊ', 'ㄗㄞˋ', 'ㄉㄢˋ', 'ㄒㄧˋ'], meaning: '危險迫在眉睫。' },
      { text: '化險為夷', bopomofo: ['ㄏㄨㄚˋ', 'ㄒㄧㄢˇ', 'ㄨㄟˊ', 'ㄧˊ'], meaning: '轉危為安順利脫險。' },
      { text: '逢凶化吉', bopomofo: ['ㄈㄥˊ', 'ㄒㄩㄥ', 'ㄏㄨㄚˋ', 'ㄐㄧˊ'], meaning: '遇到危難化解為吉祥。' },
      { text: '轉危為安', bopomofo: ['ㄓㄨㄢˇ', 'ㄨㄟˊ', 'ㄨㄟˊ', 'ㄢ'], meaning: '平安度過危險關頭。' },
      { text: '絕處逢生', bopomofo: ['ㄐㄩㄝˊ', 'ㄔㄨˋ', 'ㄈㄥˊ', 'ㄕㄥ'], meaning: '在極端困境中找到生路。' },
      { text: '柳暗花明', bopomofo: ['ㄌㄧㄡˇ', 'ㄢˋ', 'ㄏㄨㄚ', 'ㄇㄧㄥˊ'], meaning: '在困境中突然見到新希望。' }
    ],
    stage_8: [ // 塞外刀王
      { text: '長風破浪會有時', bopomofo: ['ㄔㄤˊ', 'ㄈㄥ', 'ㄆㄛˋ', 'ㄌㄤˋ', 'ㄏㄨㄟˋ', 'ㄧㄡˇ', 'ㄕˊ'], meaning: '李白名句：終有一天能乘風破浪。' },
      { text: '直掛雲帆濟滄海', bopomofo: ['ㄓˊ', 'ㄍㄨㄚˋ', 'ㄩㄣˊ', 'ㄈㄢˊ', 'ㄐㄧˋ', 'ㄘㄤ', 'ㄏㄞˇ'], meaning: '高掛風帆橫渡浩瀚大海。' },
      { text: '天生我材必有用', bopomofo: ['ㄊㄧㄢ', 'ㄕㄥ', 'ㄨㄛˇ', 'ㄘㄞˊ', 'ㄅㄧˋ', 'ㄧㄡˇ', 'ㄩㄥˋ'], meaning: '每個人天生都有獨特本領。' },
      { text: '千金散盡還復來', bopomofo: ['ㄑㄧㄢ', 'ㄐㄧㄣ', 'ㄙㄢˋ', 'ㄐㄧㄣˋ', 'ㄏㄨㄢˊ', 'ㄈㄨˋ', 'ㄌㄞˊ'], meaning: '財富用盡還可以再賺回來。' },
      { text: '會當凌絕頂', bopomofo: ['ㄏㄨㄟˋ', 'ㄉㄤ', 'ㄌㄧㄥˊ', 'ㄐㄩㄝˊ', 'ㄉㄧㄥˇ'], meaning: '杜甫名句：定要登上最高山峰。' },
      { text: '一覽眾山小', bopomofo: ['ㄧ', 'ㄌㄢˇ', 'ㄓㄨㄥˋ', 'ㄕㄢ', 'ㄒㄧㄠˇ'], meaning: '俯瞰群山皆覺渺小。' },
      { text: '大漠孤煙直', bopomofo: ['ㄉㄚˋ', 'ㄇㄛˋ', 'ㄍㄨ', 'ㄧㄢ', 'ㄓˊ'], meaning: '王維名句：廣闊沙漠中孤煙挺拔。' },
      { text: '長河落日圓', bopomofo: ['ㄔㄤˊ', 'ㄏㄜˊ', 'ㄌㄨㄛˋ', 'ㄖˋ', 'ㄩㄢˊ'], meaning: '大河盡頭落日渾圓壯麗。' },
      { text: '明月松間照', bopomofo: ['ㄇㄧㄥˊ', 'ㄩㄝˋ', 'ㄙㄨㄥ', 'ㄐㄧㄢ', 'ㄓㄠˋ'], meaning: '皎潔月光穿透松林灑落。' },
      { text: '清泉石上流', bopomofo: ['ㄑㄧㄥ', 'ㄑㄩㄢˊ', 'ㄕˊ', 'ㄕㄤˋ', 'ㄌㄧㄡˊ'], meaning: '清澈泉水在山石間流淌。' }
    ],
    stage_9: [ // 地煞重裝傀儡
      { text: '春風得意馬蹄疾', bopomofo: ['ㄔㄨㄣ', 'ㄈㄥ', 'ㄉㄜˊ', 'ㄧˋ', 'ㄇㄚˇ', 'ㄊㄧˊ', 'ㄐㄧˊ'], meaning: '心情歡暢馬步飛快。' },
      { text: '一日看盡長安花', bopomofo: ['ㄧ', 'ㄖˋ', 'ㄎㄢˋ', 'ㄐㄧㄣˋ', 'ㄔㄤˊ', 'ㄢ', 'ㄏㄨㄚ'], meaning: '形容得意之極賞盡風光。' },
      { text: '兩岸猿聲啼不住', bopomofo: ['ㄌㄧㄤˇ', 'ㄢˋ', 'ㄩㄢˊ', 'ㄕㄥ', 'ㄊㄧˊ', 'ㄅㄨˋ', 'ㄓㄨˋ'], meaning: '兩岸猿啼聲不斷回響。' },
      { text: '輕舟已過萬重山', bopomofo: ['ㄑㄧㄥ', 'ㄓㄡ', 'ㄧˇ', 'ㄍㄨㄛˋ', 'ㄨㄢˋ', 'ㄔㄨㄥˊ', 'ㄕㄢ'], meaning: '輕舟早已越過千重山巒。' },
      { text: '無邊落木蕭蕭下', bopomofo: ['ㄨˊ', 'ㄅㄧㄢ', 'ㄌㄨㄛˋ', 'ㄇㄨˋ', 'ㄒㄧㄠ', 'ㄒㄧㄠ', 'ㄒㄧㄚˋ'], meaning: '無盡落葉紛紛揚揚飄落。' },
      { text: '不盡長江滾滾來', bopomofo: ['ㄅㄨˋ', 'ㄐㄧㄣˋ', 'ㄔㄤˊ', 'ㄐㄧㄤ', 'ㄍㄨㄣˇ', 'ㄍㄨㄣˇ', 'ㄌㄞˊ'], meaning: '浩蕩長江滾滾東流。' },
      { text: '隨風潛入夜', bopomofo: ['ㄙㄨㄟˊ', 'ㄈㄥ', 'ㄑㄧㄢˊ', 'ㄖㄨˋ', 'ㄧㄝˋ'], meaning: '好雨隨風在夜裡無聲滋潤。' },
      { text: '潤物細無聲', bopomofo: ['ㄖㄨㄣˋ', 'ㄨˋ', 'ㄒㄧˋ', 'ㄨˊ', 'ㄕㄥ'], meaning: '無私奉獻春風化雨。' },
      { text: '野火燒不盡', bopomofo: ['ㄧㄝˇ', 'ㄏㄨㄛˇ', 'ㄕㄠ', 'ㄅㄨˋ', 'ㄐㄧㄣˋ'], meaning: '小草生命力頑強野火燒不滅。' },
      { text: '春風吹又生', bopomofo: ['ㄔㄨㄣ', 'ㄈㄥ', 'ㄔㄨㄟ', 'ㄧㄡˋ', 'ㄕㄥ'], meaning: '春風一吹又展現蓬勃生機。' }
    ],
    stage_10: [ // 黑風教教主：境界二終極戰
      { text: '萬事俱備只欠東風', bopomofo: ['ㄨㄢˋ', 'ㄕˋ', 'ㄐㄩˋ', 'ㄅㄟˋ', 'ㄓˇ', 'ㄑㄧㄢˋ', 'ㄉㄨㄥ', 'ㄈㄥ'], meaning: '萬事準備齊全只缺關鍵契機。' },
      { text: '失之毫釐差以千里', bopomofo: ['ㄕ', 'ㄓ', 'ㄏㄠˊ', 'ㄌㄧˊ', 'ㄔㄚ', 'ㄧˇ', 'ㄑㄧㄢ', 'ㄌㄧˇ'], meaning: '起步微小差距導致巨大結果。' },
      { text: '千里之行始於足下', bopomofo: ['ㄑㄧㄢ', 'ㄌㄧˇ', 'ㄓ', 'ㄒㄧㄥˊ', 'ㄕˇ', 'ㄩˊ', 'ㄗㄨˊ', 'ㄒㄧㄚˋ'], meaning: '遠大目標從第一步踏實開始。' },
      { text: '不經一番寒徹骨', bopomofo: ['ㄅㄨˋ', 'ㄐㄧㄥ', 'ㄧ', 'ㄈㄢ', 'ㄏㄢˊ', 'ㄔㄜˋ', 'ㄍㄨˇ'], meaning: '若沒有經歷艱辛磨練。' },
      { text: '怎得梅花撲鼻香', bopomofo: ['ㄗㄣˇ', 'ㄉㄜˊ', 'ㄇㄟˊ', 'ㄏㄨㄚ', 'ㄆㄨ', 'ㄅㄧˊ', 'ㄒㄧㄤ'], meaning: '怎能收穫芬芳的梅花清香。' },
      { text: '路遙知馬力', bopomofo: ['ㄌㄨˋ', 'ㄧㄠˊ', 'ㄓ', 'ㄇㄚˇ', 'ㄌㄧˋ'], meaning: '時間久了方知實力深淺。' },
      { text: '日久見人心', bopomofo: ['ㄖˋ', 'ㄐㄧㄡˇ', 'ㄐㄧㄢˋ', 'ㄖㄣˊ', 'ㄒㄧㄣ'], meaning: '相處久了方知為人品格。' },
      { text: '海內存知己', bopomofo: ['ㄏㄞˇ', 'ㄋㄟˋ', 'ㄘㄨㄣˊ', 'ㄓ', 'ㄐㄧˇ'], meaning: '天下只要有懂自己的知音。' },
      { text: '天涯若比鄰', bopomofo: ['ㄊㄧㄢ', 'ㄧㄚˊ', 'ㄖㄨㄛˋ', 'ㄅㄧˇ', 'ㄌㄧㄣˊ'], meaning: '即使遠在天邊也如在眼前。' },
      { text: '欲窮千里目更上一層樓', bopomofo: ['ㄩˋ', 'ㄑㄩㄥˊ', 'ㄑㄧㄢ', 'ㄌㄧˇ', 'ㄇㄨˋ', 'ㄍㄥˋ', 'ㄕㄤˋ', 'ㄧ', 'ㄘㄥˊ', 'ㄌㄡˊ'], meaning: '登高望遠，追求卓越！' }
    ]
  },

  // 境界三：一代宗師（難）- 高年級與高手：古文名篇長句、快速盲打、雙語對決
  hard: {
    stage_1: [ // 墨家旋風草人
      { text: '學而時習之不亦說乎', bopomofo: ['ㄒㄩㄝˊ', 'ㄦˊ', 'ㄕˊ', 'ㄒㄧˊ', 'ㄓ', 'ㄅㄨˋ', 'ㄧˋ', 'ㄩㄝˋ', 'ㄏㄨ'], meaning: '論語名句：時常溫習所學之事心中喜悅。' },
      { text: '有朋自遠方來不亦樂乎', bopomofo: ['ㄧㄡˇ', 'ㄆㄥˊ', 'ㄗˋ', 'ㄩㄢˇ', 'ㄈㄤ', 'ㄌㄞˊ', 'ㄅㄨˋ', 'ㄧˋ', 'ㄌㄜˋ', 'ㄏㄨ'], meaning: '好友自遠方來相聚快樂無比。' },
      { text: '人不知而不慍不亦君子乎', bopomofo: ['ㄖㄣˊ', 'ㄅㄨˋ', 'ㄓ', 'ㄦˊ', 'ㄅㄨˋ', 'ㄩㄣˋ', 'ㄅㄨˋ', 'ㄧˋ', 'ㄐㄩㄣ', 'ㄗˇ', 'ㄏㄨ'], meaning: '即使不被人了解也不動怒是君子。' },
      { text: '溫故而知新可以為師矣', bopomofo: ['ㄨㄣ', 'ㄍㄨˋ', 'ㄦˊ', 'ㄓ', 'ㄒㄧㄣ', 'ㄎㄜˇ', 'ㄧˇ', 'ㄨㄟˊ', 'ㄕ', 'ㄧˇ'], meaning: '複習舊知識悟出新體會。' },
      { text: '學而不思則罔', bopomofo: ['ㄒㄩㄝˊ', 'ㄦˊ', 'ㄅㄨˋ', 'ㄙ', 'ㄗㄜˊ', 'ㄨㄤˇ'], meaning: '只讀書不思考容易迷失。' },
      { text: '思而不學則殆', bopomofo: ['ㄙ', 'ㄦˊ', 'ㄅㄨˋ', 'ㄒㄩㄝˊ', 'ㄗㄜˊ', 'ㄉㄞˋ'], meaning: '只空想不求證容易困惑。' },
      { text: '知之為知之不知為不知', bopomofo: ['ㄓ', 'ㄓ', 'ㄨㄟˊ', 'ㄓ', 'ㄓ', 'ㄅㄨˋ', 'ㄓ', 'ㄨㄟˊ', 'ㄅㄨˋ', 'ㄓ'], meaning: '知道就是知道，誠實面對所知。' },
      { text: '三人行必有我師焉', bopomofo: ['ㄙㄢ', 'ㄖㄣˊ', 'ㄒㄧㄥˊ', 'ㄅㄧˋ', 'ㄧㄡˇ', 'ㄨㄛˇ', 'ㄕ', 'ㄧㄢ'], meaning: '每個人都有值得學習的長處。' },
      { text: '擇其善者而從之', bopomofo: ['ㄗㄜˊ', 'ㄑㄧˊ', 'ㄕㄢˋ', 'ㄓㄜˇ', 'ㄦˊ', 'ㄘㄨㄥˊ', 'ㄓ'], meaning: '挑選好的一面認真學習。' },
      { text: '其不善者而改之', bopomofo: ['ㄑㄧˊ', 'ㄅㄨˋ', 'ㄕㄢˋ', 'ㄓㄜˇ', 'ㄦˊ', 'ㄍㄞˇ', 'ㄓ'], meaning: '反省對方的缺點引以為戒。' }
    ],
    stage_2: [ // 千機百鍊木人
      { text: '己所不欲勿施於人', bopomofo: ['ㄐㄧˇ', 'ㄙㄨㄛˇ', 'ㄅㄨˋ', 'ㄩˋ', 'ㄨˋ', 'ㄕ', 'ㄩˊ', 'ㄖㄣˊ'], meaning: '自己不想要的不要加給別人。' },
      { text: '滿招損謙受益', bopomofo: ['ㄇㄢˇ', 'ㄓㄠ', 'ㄙㄨㄣˇ', 'ㄑㄧㄢ', 'ㄕㄡˋ', 'ㄧˋ'], meaning: '自滿招致損失，謙遜帶來益處。' },
      { text: '業精於勤荒於嬉', bopomofo: ['ㄧㄝˋ', 'ㄐㄧㄥ', 'ㄩˊ', 'ㄑㄧㄣˊ', 'ㄏㄨㄤ', 'ㄩˊ', 'ㄒㄧ'], meaning: '學業技藝因勤奮而精湛。' },
      { text: '行成於思毀於隨', bopomofo: ['ㄒㄧㄥˊ', 'ㄔㄥˊ', 'ㄩˊ', 'ㄙ', 'ㄏㄨㄟˇ', 'ㄩˊ', 'ㄙㄨㄟˊ'], meaning: '品行立足於深思熟慮。' },
      { text: '近朱者赤近墨者黑', bopomofo: ['ㄐㄧㄣˋ', 'ㄓㄨ', 'ㄓㄜˇ', 'ㄔˋ', 'ㄐㄧㄣˋ', 'ㄇㄛˋ', 'ㄓㄜˇ', 'ㄏㄟ'], meaning: '環境對人有潛移默化之影響。' },
      { text: '良藥苦口利於病', bopomofo: ['ㄌㄧㄤˊ', 'ㄧㄠˋ', 'ㄎㄨˇ', 'ㄎㄡˇ', 'ㄌㄧˋ', 'ㄩˊ', 'ㄅㄧㄥˋ'], meaning: '誠懇的良言雖不中聽卻有益處。' },
      { text: '忠言逆耳利於行', bopomofo: ['ㄓㄨㄥ', 'ㄧㄢˊ', 'ㄋㄧˋ', 'ㄦˇ', 'ㄌㄧˋ', 'ㄩˊ', 'ㄒㄧㄥˊ'], meaning: '逆耳之直言有助於修正行為。' },
      { text: '水能載舟亦能覆舟', bopomofo: ['ㄕㄨㄟˇ', 'ㄋㄥˊ', 'ㄗㄞˋ', 'ㄓㄡ', 'ㄧˋ', 'ㄋㄥˊ', 'ㄈㄨˋ', 'ㄓㄡ'], meaning: '事物兼具成就與顛覆之力量。' },
      { text: '居安思危防患未然', bopomofo: ['ㄐㄩ', 'ㄢ', 'ㄙ', 'ㄨㄟˊ', 'ㄈㄤˊ', 'ㄏㄨㄢˋ', 'ㄨㄟˋ', 'ㄖㄢˊ'], meaning: '處於平順之時預先防備危難。' },
      { text: '苟日新日日新又日新', bopomofo: ['ㄍㄡˇ', 'ㄖˋ', 'ㄒㄧㄣ', 'ㄖˋ', 'ㄖˋ', 'ㄒㄧㄣ', 'ㄧㄡˋ', 'ㄖˋ', 'ㄒㄧㄣ'], meaning: '不斷力求進步、自我超越。' }
    ],
    stage_3: [ // 影流蒙面刺客
      { text: '十年磨一劍霜刃未曾試', bopomofo: ['ㄕˊ', 'ㄋㄧㄢˊ', 'ㄇㄛˊ', 'ㄧ', 'ㄐㄧㄢˋ', 'ㄕㄨㄤ', 'ㄖㄣˋ', 'ㄨㄟˋ', 'ㄘㄥˊ', 'ㄕˋ'], meaning: '多年刻苦修煉，今天正要一試身手。' },
      { text: '今日把示君誰有不平事', bopomofo: ['ㄐㄧㄣ', 'ㄖˋ', 'ㄅㄚˇ', 'ㄕˋ', 'ㄐㄩㄣ', 'ㄕㄟˊ', 'ㄧㄡˇ', 'ㄅㄨˋ', 'ㄆㄧㄥˊ', 'ㄕˋ'], meaning: '俠客持劍請託，世間何處有不平。' },
      { text: '醉裡挑燈看劍', bopomofo: ['ㄗㄨㄟˋ', 'ㄌㄧˇ', 'ㄊㄧㄠˇ', 'ㄉㄥ', 'ㄎㄢˋ', 'ㄐㄧㄢˋ'], meaning: '辛棄疾名篇：夜裡持燈細看寶劍。' },
      { text: '夢回吹角連營', bopomofo: ['ㄇㄥˋ', 'ㄏㄨㄟˊ', 'ㄔㄨㄟ', 'ㄐㄧㄠˇ', 'ㄌㄧㄢˊ', 'ㄧㄥˊ'], meaning: '夢裡回想軍營連綿的戰號聲。' },
      { text: '八百里分麾下炙', bopomofo: ['ㄅㄚ', 'ㄅㄞˇ', 'ㄌㄧˇ', 'ㄈㄣ', 'ㄏㄨㄟ', 'ㄒㄧㄚˋ', 'ㄓˋ'], meaning: '將烤肉分給麾下的將士。' },
      { text: '五十弦翻塞外聲', bopomofo: ['ㄨˇ', 'ㄕˊ', 'ㄒㄧㄢˊ', 'ㄈㄢ', 'ㄙㄞˋ', 'ㄨㄞˋ', 'ㄕㄥ'], meaning: '樂器奏響塞外雄壯的軍歌。' },
      { text: '沙場秋點兵', bopomofo: ['ㄕㄚ', 'ㄔㄤˇ', 'ㄑㄧㄡ', 'ㄉㄧㄢˇ', 'ㄅㄧㄥ'], meaning: '秋高氣爽之時沙場閱兵。' },
      { text: '馬作的盧飛快', bopomofo: ['ㄇㄚˇ', 'ㄗㄨㄛˋ', 'ㄉㄧˊ', 'ㄌㄨˊ', 'ㄈㄟ', 'ㄎㄨㄞˋ'], meaning: '戰馬奔馳飛快無比。' },
      { text: '弓如霹靂弦驚', bopomofo: ['ㄍㄨㄥ', 'ㄖㄨˊ', 'ㄆㄧ', 'ㄌㄧˋ', 'ㄒㄧㄢˊ', 'ㄐㄧㄥ'], meaning: '拉開硬弓射箭如雷霆萬鈞。' },
      { text: '了卻君王天下事', bopomofo: ['ㄌㄧㄠˇ', 'ㄑㄩㄝˋ', 'ㄐㄩㄣ', 'ㄨㄤˊ', 'ㄊㄧㄢ', 'ㄒㄧㄚˋ', 'ㄕˋ'], meaning: '完成報效國家的雄心壯志。' }
    ],
    stage_4: [ // 斷魂槍客
      { text: '莫等閒白了少年頭', bopomofo: ['ㄇㄛˋ', 'ㄉㄥˇ', 'ㄒㄧㄢˊ', 'ㄅㄞˊ', 'ㄌㄜ˙', 'ㄕㄠˋ', 'ㄋㄧㄢˊ', 'ㄊㄡˊ'], meaning: '岳飛名句：不要虛度年華荒廢青春。' },
      { text: '空悲切', bopomofo: ['ㄎㄨㄥ', 'ㄅㄟ', 'ㄑㄧㄝˋ'], meaning: '徒然悔恨悲傷。' },
      { text: '三十功名塵與土', bopomofo: ['ㄙㄢ', 'ㄕˊ', 'ㄍㄨㄥ', 'ㄇㄧㄥˊ', 'ㄔㄣˊ', 'ㄩˇ', 'ㄊㄨˇ'], meaning: '視功名如過眼雲煙。' },
      { text: '八千里路雲和月', bopomofo: ['ㄅㄚ', 'ㄑㄧㄢ', 'ㄌㄧˇ', 'ㄌㄨˋ', 'ㄩㄣˊ', 'ㄏㄜˊ', 'ㄩㄝˋ'], meaning: '征戰跋涉長路萬里。' },
      { text: '壯志飢餐胡虜肉', bopomofo: ['ㄓㄨㄤˋ', 'ㄓˋ', 'ㄐㄧ', 'ㄘㄢ', 'ㄏㄨˊ', 'ㄌㄨˇ', 'ㄖㄡˋ'], meaning: '豪情壯志英勇抗敵。' },
      { text: '笑談渴飲匈奴血', bopomofo: ['ㄒㄧㄠˋ', 'ㄊㄢˊ', 'ㄎㄜˇ', 'ㄧㄣˇ', 'ㄒㄩㄥ', 'ㄋㄨˊ', 'ㄒㄧㄝˇ'], meaning: '談笑風生揮軍破敵。' },
      { text: '待從頭收拾舊山河', bopomofo: ['ㄉㄞˋ', 'ㄘㄨㄥˊ', 'ㄊㄡˊ', 'ㄕㄡ', 'ㄕˊ', 'ㄐㄧㄡˋ', 'ㄕㄢ', 'ㄏㄜˊ'], meaning: '重整旗鼓收復河山。' },
      { text: '朝天闕', bopomofo: ['ㄓㄠ', 'ㄊㄧㄢ', 'ㄑㄩㄝˋ'], meaning: '凱旋歸來朝見天子。' },
      { text: '生當作人傑', bopomofo: ['ㄕㄥ', 'ㄉㄤ', 'ㄗㄨㄛˋ', 'ㄖㄣˊ', 'ㄐㄧㄝˊ'], meaning: '活著當為頂天立地之豪傑。' },
      { text: '死亦為鬼雄', bopomofo: ['ㄙˇ', 'ㄧˋ', 'ㄨㄟˊ', 'ㄍㄨㄟˇ', 'ㄒㄩㄥˊ'], meaning: '英雄氣概永垂不朽。' }
    ],
    stage_5: [ // 撼山金剛
      { text: '千磨萬擊還堅勁', bopomofo: ['ㄑㄧㄢ', 'ㄇㄛˊ', 'ㄨㄢˋ', 'ㄐㄧˊ', 'ㄏㄞˊ', 'ㄐㄧㄢ', 'ㄐㄧㄥˋ'], meaning: '鄭燮《竹石》：歷盡磨難依舊堅定挺拔。' },
      { text: '任爾東西南北風', bopomofo: ['ㄖㄣˋ', 'ㄦˇ', 'ㄉㄨㄥ', 'ㄒㄧ', 'ㄋㄢˊ', 'ㄅㄟˇ', 'ㄈㄥ'], meaning: '任憑四面八方狂風肆虐。' },
      { text: '咬定青山不放鬆', bopomofo: ['ㄧㄠˇ', 'ㄉㄧㄥˋ', 'ㄑㄧㄥ', 'ㄕㄢ', 'ㄅㄨˋ', 'ㄈㄤˋ', 'ㄙㄨㄥ'], meaning: '深深紮根在岩石之中。' },
      { text: '立根原在破巖中', bopomofo: ['ㄌㄧˋ', 'ㄍㄣ', 'ㄩㄢˊ', 'ㄗㄞˋ', 'ㄆㄛˋ', 'ㄧㄢˊ', 'ㄓㄨㄥ'], meaning: '堅定意志不為環境所動。' },
      { text: '不要人誇好顏色', bopomofo: ['ㄅㄨˋ', 'ㄧㄠˋ', 'ㄖㄣˊ', 'ㄎㄨㄚ', 'ㄏㄠˇ', 'ㄧㄢˊ', 'ㄙㄜˋ'], meaning: '王冕《墨梅》：不追求外表華麗讚譽。' },
      { text: '只留清氣滿乾坤', bopomofo: ['ㄓˇ', 'ㄌㄧㄡˊ', 'ㄑㄧㄥ', 'ㄑㄧˋ', 'ㄇㄢˇ', 'ㄑㄧㄢˊ', 'ㄎㄨㄣ'], meaning: '只願浩然清香充塞天地。' },
      { text: '粉骨碎身渾不怕', bopomofo: ['ㄈㄣˇ', 'ㄍㄨˇ', 'ㄙㄨㄟˋ', 'ㄕㄣ', 'ㄏㄨㄣˊ', 'ㄅㄨˋ', 'ㄆㄚˋ'], meaning: '于謙《石灰吟》：哪怕粉身碎骨也不畏懼。' },
      { text: '要留清白在人間', bopomofo: ['ㄧㄠˋ', 'ㄌㄧㄡˊ', 'ㄑㄧㄥ', 'ㄅㄞˊ', 'ㄗㄞˋ', 'ㄖㄣˊ', 'ㄐㄧㄢ'], meaning: '堅持光明磊落清白傳世。' },
      { text: '天地有正氣', bopomofo: ['ㄊㄧㄢ', 'ㄉㄧˋ', 'ㄧㄡˇ', 'ㄓㄥˋ', 'ㄑㄧˋ'], meaning: '文天祥《正氣歌》：天地之間充滿浩然之氣。' },
      { text: '雜然賦流形', bopomofo: ['ㄗㄚˊ', 'ㄖㄢˊ', 'ㄈㄨˋ', 'ㄌㄧㄡˊ', 'ㄒㄧㄥˊ'], meaning: '賦予萬物不屈之風骨。' }
    ],
    stage_6: [ // 武當長老
      { text: '天下莫柔弱於水', bopomofo: ['ㄊㄧㄢ', 'ㄒㄧㄚˋ', 'ㄇㄛˋ', 'ㄖㄡˊ', 'ㄖㄨㄛˋ', 'ㄩˊ', 'ㄕㄨㄟˇ'], meaning: '老子名句：天下沒有比水更柔順的。' },
      { text: '而攻堅強者莫之能勝', bopomofo: ['ㄦˊ', 'ㄍㄨㄥ', 'ㄐㄧㄢ', 'ㄑㄧㄤˊ', 'ㄓㄜˇ', 'ㄇㄛˋ', 'ㄓ', 'ㄋㄥˊ', 'ㄕㄥˋ'], meaning: '然而攻克堅硬之物卻無人能勝水。' },
      { text: '以其無以易之', bopomofo: ['ㄧˇ', 'ㄑㄧˊ', 'ㄨˊ', 'ㄧˇ', 'ㄧˋ', 'ㄓ'], meaning: '因為沒有任何事物能取代它。' },
      { text: '弱之勝強柔之勝剛', bopomofo: ['ㄖㄨㄛˋ', 'ㄓ', 'ㄕㄥˋ', 'ㄑㄧㄤˊ', 'ㄖㄡˊ', 'ㄓ', 'ㄕㄥˋ', 'ㄍㄤ'], meaning: '柔韌勝過剛強之大道。' },
      { text: '天下莫不知莫能行', bopomofo: ['ㄊㄧㄢ', 'ㄒㄧㄚˋ', 'ㄇㄛˋ', 'ㄅㄨˋ', 'ㄓ', 'ㄇㄛˋ', 'ㄋㄥˊ', 'ㄒㄧㄥˊ'], meaning: '天下皆知其理卻少有人能做到。' },
      { text: '上善若水水善利萬物而不爭', bopomofo: ['ㄕㄤˋ', 'ㄕㄢˋ', 'ㄖㄨㄛˋ', 'ㄕㄨㄟˇ', 'ㄕㄨㄟˇ', 'ㄕㄢˋ', 'ㄌㄧˋ', 'ㄨㄢˋ', 'ㄨˋ', 'ㄦˊ', 'ㄅㄨˋ', 'ㄓㄥ'], meaning: '最高境界如水滋潤萬物而不相爭。' },
      { text: '處眾人之所惡故幾於道', bopomofo: ['ㄔㄨˇ', 'ㄓㄨㄥˋ', 'ㄖㄣˊ', 'ㄓ', 'ㄙㄨㄛˇ', 'ㄨˋ', 'ㄍㄨˋ', 'ㄐㄧ', 'ㄩˊ', 'ㄉㄠˋ'], meaning: '安居低處最接近道之本源。' },
      { text: '海闊憑魚躍', bopomofo: ['ㄏㄞˇ', 'ㄎㄨㄛˋ', 'ㄆㄧㄥˊ', 'ㄩˊ', 'ㄩㄝˋ'], meaning: '海闊天空任憑展現才華。' },
      { text: '天高任鳥飛', bopomofo: ['ㄊㄧㄢ', 'ㄍㄠ', 'ㄖㄣˋ', 'ㄋㄧㄠˇ', 'ㄈㄟ'], meaning: '蒼穹廣闊自由翱翔。' },
      { text: '萬物並育而不相害', bopomofo: ['ㄨㄢˋ', 'ㄨˋ', 'ㄅㄧㄥˋ', 'ㄩˋ', 'ㄦˊ', 'ㄅㄨˋ', 'ㄒㄧㄤ', 'ㄏㄞˋ'], meaning: '包羅萬象和諧共生。' }
    ],
    stage_7: [ // 陰陽雙煞
      { text: '沉舟側畔千帆過', bopomofo: ['ㄔㄣˊ', 'ㄓㄡ', 'ㄘㄜˋ', 'ㄆㄢˋ', 'ㄑㄧㄢ', 'ㄈㄢˊ', 'ㄍㄨㄛˋ'], meaning: '劉禹錫名句：沉舟身旁千艘帆船飛馳而過。' },
      { text: '病樹前頭萬木春', bopomofo: ['ㄅㄧㄥˋ', 'ㄕㄨˋ', 'ㄑㄧㄢˊ', 'ㄊㄡˊ', 'ㄨㄢˋ', 'ㄇㄨˋ', 'ㄔㄨㄣ'], meaning: '枯木前端萬樹生機勃勃迎春。' },
      { text: '今日聽君歌一曲', bopomofo: ['ㄐㄧㄣ', 'ㄖˋ', 'ㄊㄧㄥ', 'ㄐㄩㄣ', 'ㄍㄜ', 'ㄧ', 'ㄑㄩˇ'], meaning: '今日聽君一席歡暢之歌。' },
      { text: '暫憑杯酒長精神', bopomofo: ['ㄓㄢˋ', 'ㄆㄧㄥˊ', 'ㄅㄟ', 'ㄐㄧㄡˇ', 'ㄓㄤˇ', 'ㄐㄧㄥ', 'ㄕㄣˊ'], meaning: '暫借酒興振奮開闊心胸。' },
      { text: '不畏浮雲遮望眼', bopomofo: ['ㄅㄨˋ', 'ㄨㄟˋ', 'ㄈㄨˊ', 'ㄩㄣˊ', 'ㄓㄜ', 'ㄨㄤˋ', 'ㄧㄢˇ'], meaning: '王安石名句：不害怕浮雲遮蔽目光。' },
      { text: '自緣身在最高層', bopomofo: ['ㄗˋ', 'ㄩㄢˊ', 'ㄕㄣ', 'ㄗㄞˋ', 'ㄗㄨㄟˋ', 'ㄍㄠ', 'ㄘㄥˊ'], meaning: '因為自身早已立足最高境界。' },
      { text: '山重水複疑無路', bopomofo: ['ㄕㄢ', 'ㄔㄨㄥˊ', 'ㄕㄨㄟˇ', 'ㄈㄨˋ', 'ㄧˊ', 'ㄨˊ', 'ㄌㄨˋ'], meaning: '陸游名句：群山萬水看似沒有去路。' },
      { text: '柳暗花明又一村', bopomofo: ['ㄌㄧㄡˇ', 'ㄢˋ', 'ㄏㄨㄚ', 'ㄇㄧㄥˊ', 'ㄧㄡˋ', 'ㄧ', 'ㄘㄨㄣ'], meaning: '穿過柳林忽見嶄新村落！' },
      { text: '問渠那得清如許', bopomofo: ['ㄨㄣˋ', 'ㄑㄩˊ', 'ㄋㄚˇ', 'ㄉㄜˊ', 'ㄑㄧㄥ', 'ㄖㄨˊ', 'ㄒㄩˇ'], meaning: '朱熹名句：池塘怎會如此清澈見底。' },
      { text: '為有源頭活水來', bopomofo: ['ㄨㄟˋ', 'ㄧㄡˇ', 'ㄩㄢˊ', 'ㄊㄡˊ', 'ㄏㄨㄛˊ', 'ㄕㄨㄟˇ', 'ㄌㄞˊ'], meaning: '因為源頭源源不絕湧入活水！' }
    ],
    stage_8: [ // 劍雨神行客
      { text: 'practice makes perfect', meaning: '熟能生巧：勤練武功必成宗師', mode: 'english' },
      { text: 'actions speak louder than words', meaning: '行勝於言：坐而言不如起而行', mode: 'english' },
      { text: 'knowledge is the ultimate power', meaning: '學識乃無上之力量', mode: 'english' },
      { text: 'courage is grace under pressure', meaning: '勇氣乃臨危不亂之優雅', mode: 'english' },
      { text: 'fortune favors the bold warrior', meaning: '命運永遠眷顧勇毅者', mode: 'english' },
      { text: 'every journey begins with a single step', meaning: '千里之行始於足下', mode: 'english' },
      { text: 'the sword reveals the true heart', meaning: '心正則劍正，劍影照真心', mode: 'english' },
      { text: 'mastery takes patience and time', meaning: '大器晚成，唯專注耐力可達頂峰', mode: 'english' },
      { text: 'honor and justice guide our way', meaning: '榮譽與正道指引江湖征途', mode: 'english' },
      { text: 'victory belongs to the determined', meaning: '勝利必屬於堅定不移之人', mode: 'english' }
    ],
    stage_9: [ // 天罡滅魂傀儡
      { text: '君不見黃河之水天上來', bopomofo: ['ㄐㄩㄣ', 'ㄅㄨˋ', 'ㄐㄧㄢˋ', 'ㄏㄨㄤˊ', 'ㄏㄜˊ', 'ㄓ', 'ㄕㄨㄟˇ', 'ㄊㄧㄢ', 'ㄕㄤˋ', 'ㄌㄞˊ'], meaning: '李白《將進酒》：奔騰大河從天而降。' },
      { text: '奔流到海不復回', bopomofo: ['ㄅㄣ', 'ㄌㄧㄡˊ', 'ㄉㄠˋ', 'ㄏㄞˇ', 'ㄅㄨˋ', 'ㄈㄨˋ', 'ㄏㄨㄟˊ'], meaning: '奔騰奔向大海永不復返。' },
      { text: '君不見高堂明鏡悲白髮', bopomofo: ['ㄐㄩㄣ', 'ㄅㄨˋ', 'ㄐㄧㄢˋ', 'ㄍㄠ', 'ㄊㄤˊ', 'ㄇㄧㄥˊ', 'ㄐㄧㄥˋ', 'ㄅㄟ', 'ㄅㄞˊ', 'ㄈㄚˇ'], meaning: '對鏡感嘆韶華易逝。' },
      { text: '朝如青絲暮成雪', bopomofo: ['ㄓㄠ', 'ㄖㄨˊ', 'ㄑㄧㄥ', 'ㄙ', 'ㄇㄨˋ', 'ㄔㄥˊ', 'ㄒㄩㄝˇ'], meaning: '早晨如墨黑髮傍晚白髮如雪。' },
      { text: '人生得意須盡歡', bopomofo: ['ㄖㄣˊ', 'ㄕㄥ', 'ㄉㄜˊ', 'ㄧˋ', 'ㄒㄩ', 'ㄐㄧㄣˋ', 'ㄏㄨㄢ'], meaning: '得志之時當痛快暢快。' },
      { text: '莫使金樽空對月', bopomofo: ['ㄇㄛˋ', 'ㄕˇ', 'ㄐㄧㄣ', 'ㄗㄨㄣ', 'ㄎㄨㄥ', 'ㄉㄨㄟˋ', 'ㄩㄝˋ'], meaning: '不要讓酒杯空對一輪明月。' },
      { text: '天生我材必有用', bopomofo: ['ㄊㄧㄢ', 'ㄕㄥ', 'ㄨㄛˇ', 'ㄘㄞˊ', 'ㄅㄧˋ', 'ㄧㄡˇ', 'ㄩㄥˋ'], meaning: '天生我才定有大用之處！' },
      { text: '千金散盡還復來', bopomofo: ['ㄑㄧㄢ', 'ㄐㄧㄣ', 'ㄙㄢˋ', 'ㄐㄧㄣˋ', 'ㄏㄨㄢˊ', 'ㄈㄨˋ', 'ㄌㄞˊ'], meaning: '千金散盡自然還能再次匯聚！' },
      { text: '烹羊宰牛且為樂', bopomofo: ['ㄆㄥ', 'ㄧㄤˊ', 'ㄗㄞˇ', 'ㄋㄧㄡˊ', 'ㄑㄧㄝˇ', 'ㄨㄟˊ', 'ㄌㄜˋ'], meaning: '豪邁設宴同樂。' },
      { text: '會須一飲三百杯', bopomofo: ['ㄏㄨㄟˋ', 'ㄒㄩ', 'ㄧ', 'ㄧㄣˇ', 'ㄙㄢ', 'ㄅㄞˇ', 'ㄅㄟ'], meaning: '痛快暢飲展現英雄豪氣！' }
    ],
    stage_10: [ // 極・黑風魔皇：終極宗師對決
      { text: '十年磨一劍', bopomofo: ['ㄕˊ', 'ㄋㄧㄢˊ', 'ㄇㄛˊ', 'ㄧ', 'ㄐㄧㄢˋ'], meaning: '刻苦磨礪之劍意。' },
      { text: '霜刃未曾試', bopomofo: ['ㄕㄨㄤ', 'ㄖㄣˋ', 'ㄨㄟˋ', 'ㄘㄥˊ', 'ㄕˋ'], meaning: '今日將斬破黑暗！' },
      { text: '行俠仗義自強不息', bopomofo: ['ㄒㄧㄥˊ', 'ㄒㄧㄚˊ', 'ㄓㄤˋ', 'ㄧˋ', 'ㄗˋ', 'ㄑㄧㄤˊ', 'ㄅㄨˋ', 'ㄒㄧˊ'], meaning: '心存仁義，奮勇爭先！' },
      { text: '長風破浪會有時', bopomofo: ['ㄔㄤˊ', 'ㄈㄥ', 'ㄆㄛˋ', 'ㄌㄤˋ', 'ㄏㄨㄟˋ', 'ㄧㄡˇ', 'ㄕˊ'], meaning: '終能乘風破浪越過千重山！' },
      { text: '直掛雲帆濟滄海', bopomofo: ['ㄓˊ', 'ㄍㄨㄚˋ', 'ㄩㄣˊ', 'ㄈㄢˊ', 'ㄐㄧˋ', 'ㄘㄤ', 'ㄏㄞˇ'], meaning: '揚起雲帆直達彼岸！' },
      { text: '大鵬一日同風起', bopomofo: ['ㄉㄚˋ', 'ㄆㄥˊ', 'ㄧ', 'ㄖˋ', 'ㄊㄨㄥˊ', 'ㄈㄥ', 'ㄑㄧˇ'], meaning: '大鵬展翅乘風騰空而上。' },
      { text: '扶搖直上九萬里', bopomofo: ['ㄈㄨˊ', 'ㄧㄠˊ', 'ㄓˊ', 'ㄕㄤˋ', 'ㄐㄧㄡˇ', 'ㄨㄢˋ', 'ㄌㄧˇ'], meaning: '翱翔九萬里高空之上！' },
      { text: '假令風歇時下來', bopomofo: ['ㄐㄧㄚˇ', 'ㄌㄧㄥˋ', 'ㄈㄥ', 'ㄒㄧㄝ', 'ㄕˊ', 'ㄒㄧㄚˋ', 'ㄌㄞˊ'], meaning: '即使狂風停歇之時。' },
      { text: '猶能簸卻滄溟水', bopomofo: ['ㄧㄡˊ', 'ㄋㄥˊ', 'ㄅㄛˇ', 'ㄑㄩㄝˋ', 'ㄘㄤ', 'ㄇㄧㄥˊ', 'ㄕㄨㄟˇ'], meaning: '依舊能激起驚濤駭浪！' },
      { text: '指尖起字劍意行雲打字亦是修行', bopomofo: ['ㄓˇ', 'ㄐㄧㄢ', 'ㄑㄧˇ', 'ㄗˋ', 'ㄐㄧㄢˋ', 'ㄧˋ', 'ㄒㄧㄥˊ', 'ㄩㄣˊ', 'ㄉㄚˇ', 'ㄗˋ', 'ㄧˋ', 'ㄕˋ', 'ㄒㄧㄡ', 'ㄒㄧㄥˊ'], meaning: '恭賀少俠登峰造極，武林至尊！' }
    ]
  }
};

/**
 * 家長自訂祕笈字串解析工具
 */
export function parseCustomVocabularyInput(rawString) {
  if (!rawString || !rawString.trim()) return [];
  const tokens = rawString
    .split(/[,，、\n\r;；]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];

  for (const token of tokens) {
    if (/^[a-zA-Z\s]+$/.test(token)) {
      results.push({
        text: token.toLowerCase(),
        meaning: '家長自訂英文祕笈',
        mode: 'english'
      });
      continue;
    }

    const match = token.match(/^(.+?)[\(（](.+?)[\)）]$/);
    if (match) {
      const text = match[1].trim();
      const zyParts = match[2].trim().split(/\s+/);
      results.push({
        text,
        bopomofo: zyParts,
        meaning: '家長自訂祕笈詞彙',
        mode: 'bopomofo'
      });
      continue;
    }

    const chars = Array.from(token).filter((c) => /[\u4e00-\u9fa5]/.test(c));
    if (chars.length > 0) {
      const authored = Object.values(DIFFICULTY_BANKS).flatMap((bank) => Object.values(bank).flat())
        .find((item) => item.text === chars.join('') && item.bopomofo)?.bopomofo;
      const bopomofo = resolveDictionaryReading(chars.join(''), authored);
      results.push({
        text: chars.join(''),
        bopomofo,
        meaning: '家長自訂聯絡簿生字／圈詞',
        mode: 'bopomofo'
      });
    }
  }

  // 不讓未知國字或不完整注音進入打字引擎，避免產生無法輸入的題目。
  const errors = [];
  for (const item of results) {
    if (item.mode === 'english') continue;
    const chars = Array.from(item.text);
    if (chars.length !== item.bopomofo.length) {
      errors.push(`「${item.text}」須為每個字提供一組注音，組與組之間以空白分隔。`);
      continue;
    }
    const exampleReading = getDictionaryExampleReading(item.text);
    chars.forEach((ch, i) => {
      const zy = item.bopomofo[i];
      const candidates = getCharacterReadings(ch);
      // 官方完整例詞可能標示「一、不」變調；不可用單字本音否定例詞原文。
      const matchesExample = exampleReading && normalizeReadingForComparison(exampleReading[i]) === normalizeReadingForComparison(zy);
      if (candidates.length && !isDictionaryReading(ch, zy) && !matchesExample) {
        errors.push(`「${ch}」的注音不符合國語小字典，收錄讀音：${candidates.join('／')}。`);
      }
      if (!/^(?:˙)?[ㄅ-ㄩ]+[ˊˇˋ˙]?$/.test(zy) || /(ㄧㄨ|ㄧㄩ|ㄨㄧ|ㄩㄧ|ㄩㄨ)/.test(zy)) {
        errors.push(`「${ch}」未收錄或注音格式不正確，請手動補上注音，例如：小橋(ㄒㄧㄠˇ ㄑㄧㄠˊ)。`);
      }
    });
  }
  if (errors.length) throw new Error([...new Set(errors)].join('\n'));
  return results;
}
