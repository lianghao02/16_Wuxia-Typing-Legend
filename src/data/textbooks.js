/**
 * 國語生字詞練習範例，以康軒、翰林、南一名稱分類 (textbooks.js)
 * 學年度、冊次與正式課名尚未附來源核對，不代表出版社正式同步題庫。
 */

import { COMMON_CHAR_BOPOMOFO_MAP, MOE_MINI_METADATA } from './moeDictionary.js?v=20261007_beta2_final';
import { getOriginalProseWords } from './originalProse.js?v=20261007_beta2_final';
import { getGradeVocabulary } from './gradeVocabulary.js?v=20261007_beta2_final';

export const PUBLISHER_RESOURCE_LINKS = [
  { name: '康軒官方資源', url: 'https://digitalmaster.knsh.com.tw/v3/' },
  { name: '翰林官方資源', url: 'https://www.hle.com.tw/user-teacher.html' },
  { name: '南一官方資源', url: 'https://nanidigi.nani.com.tw/' }
];

const dictionaryGroups = [
  ['生活與家人', '家爸媽朋友手足心口人兄弟姐妹祖孫親兒女老幼我你他她們名字姓身頭臉眼耳鼻牙舌肩背肚腿指皮毛衣帽鞋襪裙褲袋床枕被桌椅門窗牆房屋廚浴飯菜米粥茶湯杯碗盤筷匙鍋洗吃喝睡坐站跑走跳玩笑哭唱聽看說讀寫畫學校班師生書筆紙課包早晚午安禮謝愛幫忙陪抱問答'],
  ['自然與四季', '天山水火木日月雲春秋夏冬風雨雪霜露雷電冰氣光晴陰冷熱暖涼晨夜星空海河湖溪泉池浪沙石土地岩峰谷坡林森竹葉花草根枝芽果種苗瓜豆稻米鳥魚蟲蝶蜂蟻貓狗牛羊馬兔鼠虎龍蛇雞鴨鵝熊鹿蝦蟹貝龜紫紅黃綠藍白黑亮暗乾濕'],
  ['數量與方向', '二三四五六七八九十百千萬億零數量個位元次件本張杯碗盒袋串雙群隊排列層套頁年季月週日秒時刻點歲斤尺寸度圓方角邊線長短寬窄高低大細厚薄輕重多滿半全少空左右上下前後內外東西南北中遠近旁間頂底首尾先末來去進退出入直斜平正反順逆快慢增減倍總均等']
];

// 尚無學年度及出版社原始來源，僅可作為待核對練習範例。
export const TEXTBOOK_SOURCE_STATUS = {
  verified: false,
  schoolYear: null,
  sourceUrl: null,
  label: '練習範例・學年度與正式課次尚待核對'
};

export const TEXTBOOK_CATALOG = {
  moe: {
    publisherId: 'moe',
    publisherName: '教育部國語小字典',
    sourceStatus: {
      verified: true, schoolYear: null, sourceUrl: MOE_MINI_METADATA.sourceUrl,
      label: `官方字音練習・字典版本 ${MOE_MINI_METADATA.version}・非出版社課次`
    },
    grades: [{
      gradeId: 'common', gradeName: '常用字練習（遊戲自編分組）',
      lessons: dictionaryGroups.map(([title, characters], i) => ({
        lessonId: `moe_common_${i + 1}`, title,
        // 自編主題範圍去重；僅納入官方字典中可明確判定單一讀音的字。
        words: [...new Set(Array.from(characters))].filter((character) => COMMON_CHAR_BOPOMOFO_MAP[character])
          .map((character) => ({ text: character, bopomofo: [COMMON_CHAR_BOPOMOFO_MAP[character]],
            meaning: '依教育部國語小字典收錄字音練習。' }))
      }))
    }]
  },
  knsh: {
    publisherId: 'knsh',
    publisherName: '康軒版',
    grades: [
      {
        gradeId: 'g1_up',
        gradeName: '一年級上學期',
        lessons: [
          {
            lessonId: 'knsh_1u_01',
            title: '第一課：拍拍手（首冊注音與單字）',
            words: [
              { text: '手', bopomofo: ['ㄕㄡˇ'], meaning: '人體上肢前端能拿東西的部分。' },
              { text: '水', bopomofo: ['ㄕㄨㄟˇ'], meaning: '自然界清澈流動的液體。' },
              { text: '小', bopomofo: ['ㄒㄧㄠˇ'], meaning: '體積或數量不大的。' },
              { text: '山', bopomofo: ['ㄕㄢ'], meaning: '地面高聳的部分。' },
              { text: '木', bopomofo: ['ㄇㄨˋ'], meaning: '樹木與木材。' }
            ]
          },
          {
            lessonId: 'knsh_1u_02',
            title: '第二課：風和雲（自然現象）',
            words: [
              { text: '風', bopomofo: ['ㄈㄥ'], meaning: '空氣流動的現象。' },
              { text: '雲', bopomofo: ['ㄩㄣˊ'], meaning: '天空中漂浮的水氣。' },
              { text: '雨', bopomofo: ['ㄩˇ'], meaning: '從雲層落下的水滴。' },
              { text: '天', bopomofo: ['ㄊㄧㄢ'], meaning: '頭頂上的蒼穹。' },
              { text: '日', bopomofo: ['ㄖˋ'], meaning: '太陽。' }
            ]
          }
        ]
      },
      {
        gradeId: 'g2_up',
        gradeName: '二年級上學期',
        lessons: [
          {
            lessonId: 'knsh_2u_01',
            title: '第一課：走過小橋（生詞修煉）',
            words: [
              { text: '小橋', bopomofo: ['ㄒㄧㄠˇ', 'ㄑㄧㄠˊ'], meaning: '跨越溪流的小型橋梁。' },
              { text: '流水', bopomofo: ['ㄌㄧㄡˊ', 'ㄕㄨㄟˇ'], meaning: '流動的溪水。' },
              { text: '倒影', bopomofo: ['ㄉㄠˋ', 'ㄧㄥˇ'], meaning: '映在水面上的影像。' },
              { text: '清溪', bopomofo: ['ㄑㄧㄥ', 'ㄒㄧ'], meaning: '清澈見底的山溪。' },
              { text: '森林', bopomofo: ['ㄙㄣ', 'ㄌㄧㄣˊ'], meaning: '樹木茂密的廣大樹林。' }
            ]
          },
          {
            lessonId: 'knsh_2u_02',
            title: '第二課：秋天的信（季節生詞）',
            words: [
              { text: '秋天', bopomofo: ['ㄑㄧㄡ', 'ㄊㄧㄢ'], meaning: '夏冬之間的涼爽季節。' },
              { text: '落葉', bopomofo: ['ㄌㄨㄛˋ', 'ㄧㄝˋ'], meaning: '從樹上飄落的葉子。' },
              { text: '溫暖', bopomofo: ['ㄨㄣ', 'ㄋㄨㄢˇ'], meaning: '暖和舒適。' },
              { text: '朋友', bopomofo: ['ㄆㄥˊ', 'ㄧㄡˇ'], meaning: '彼此友好互助的人。' }
            ]
          }
        ]
      },
      {
        gradeId: 'g3_up',
        gradeName: '三年級上學期',
        lessons: [
          {
            lessonId: 'knsh_3u_01',
            title: '第一課：心的悄悄話（四字詞與成語）',
            words: [
              { text: '全力以赴', bopomofo: ['ㄑㄩㄢˊ', 'ㄌㄧˋ', 'ㄧˇ', 'ㄈㄨˋ'], meaning: '把全部力量都投入進去。' },
              { text: '一氣呵成', bopomofo: ['ㄧ', 'ㄑㄧˋ', 'ㄏㄜ', 'ㄔㄥˊ'], meaning: '連貫流暢地一口氣完成。' },
              { text: '自強不息', bopomofo: ['ㄗˋ', 'ㄑㄧㄤˊ', 'ㄅㄨˋ', 'ㄒㄧˊ'], meaning: '自己努力向上永不懈怠。' },
              { text: '見義勇為', bopomofo: ['ㄐㄧㄢˋ', 'ㄧˋ', 'ㄩㄥˇ', 'ㄨㄟˊ'], meaning: '看到正義的事便勇敢去做。' }
            ]
          }
        ]
      }
    ]
  },

  hanlin: {
    publisherId: 'hanlin',
    publisherName: '翰林版',
    grades: [
      {
        gradeId: 'g1_up',
        gradeName: '一年級上學期',
        lessons: [
          {
            lessonId: 'hl_1u_01',
            title: '第一課：上學去（校園基礎字）',
            words: [
              { text: '人', bopomofo: ['ㄖㄣˊ'], meaning: '能思考與使用語言的高等動物。' },
              { text: '大', bopomofo: ['ㄉㄚˋ'], meaning: '面積、體積或範圍廣闊。' },
              { text: '上', bopomofo: ['ㄕㄤˋ'], meaning: '位置在高處或往前進。' },
              { text: '下', bopomofo: ['ㄒㄧㄚˋ'], meaning: '位置在低處。' },
              { text: '口', bopomofo: ['ㄎㄡˇ'], meaning: '嘴，飲食與發聲的器官。' }
            ]
          }
        ]
      },
      {
        gradeId: 'g2_up',
        gradeName: '二年級上學期',
        lessons: [
          {
            lessonId: 'hl_2u_01',
            title: '第一課：快樂的早晨（雙字生詞）',
            words: [
              { text: '快樂', bopomofo: ['ㄎㄨㄞˋ', 'ㄌㄜˋ'], meaning: '心中感到歡喜愉悅。' },
              { text: '明亮', bopomofo: ['ㄇㄧㄥˊ', 'ㄌㄧㄤˋ'], meaning: '光線充足耀眼。' },
              { text: '花草', bopomofo: ['ㄏㄨㄚ', 'ㄘㄠˇ'], meaning: '花朵與草木。' },
              { text: '讀書', bopomofo: ['ㄉㄨˊ', 'ㄕㄨ'], meaning: '閱讀書籍、學習知識。' },
              { text: '寫字', bopomofo: ['ㄒㄧㄝˇ', 'ㄗˋ'], meaning: '提筆書寫文字。' }
            ]
          }
        ]
      },
      {
        gradeId: 'g3_up',
        gradeName: '三年級上學期',
        lessons: [
          {
            lessonId: 'hl_3u_01',
            title: '第一課：時間的腳步（進階成語）',
            words: [
              { text: '鐵杵磨針', bopomofo: ['ㄊㄧㄝˇ', 'ㄔㄨˇ', 'ㄇㄛˊ', 'ㄓㄣ'], meaning: '比喻有恆心毅力必能成功。' },
              { text: '聞雞起舞', bopomofo: ['ㄨㄣˊ', 'ㄐㄧ', 'ㄑㄧˇ', 'ㄨˇ'], meaning: '及時奮發向上、勤練不輟。' },
              { text: '行雲流水', bopomofo: ['ㄒㄧㄥˊ', 'ㄩㄣˊ', 'ㄌㄧㄡˊ', 'ㄕㄨㄟˇ'], meaning: '自然流暢，毫無阻滯。' }
            ]
          }
        ]
      }
    ]
  },

  nani: {
    publisherId: 'nani',
    publisherName: '南一版',
    grades: [
      {
        gradeId: 'g1_up',
        gradeName: '一年級上學期',
        lessons: [
          {
            lessonId: 'ni_1u_01',
            title: '第一課：天地人（萬物起源）',
            words: [
              { text: '天', bopomofo: ['ㄊㄧㄢ'], meaning: '天空與自然界。' },
              { text: '地', bopomofo: ['ㄉㄧˋ'], meaning: '人類萬物生長的陸地。' },
              { text: '火', bopomofo: ['ㄏㄨㄛˇ'], meaning: '物體燃燒發出的光與熱。' },
              { text: '土', bopomofo: ['ㄊㄨˇ'], meaning: '地面上的泥沙混合物。' },
              { text: '月', bopomofo: ['ㄩㄝˋ'], meaning: '夜空中的月亮。' }
            ]
          }
        ]
      },
      {
        gradeId: 'g2_up',
        gradeName: '二年級上學期',
        lessons: [
          {
            lessonId: 'ni_2u_01',
            title: '第一課：山林裡的歌聲（生活詞彙）',
            words: [
              { text: '春風', bopomofo: ['ㄔㄨㄣ', 'ㄈㄥ'], meaning: '春天溫暖和煦的風。' },
              { text: '竹林', bopomofo: ['ㄓㄨˊ', 'ㄌㄧㄣˊ'], meaning: '翠竹生長的林地。' },
              { text: '平安', bopomofo: ['ㄆㄧㄥˊ', 'ㄢ'], meaning: '平穩安寧，沒有危險。' },
              { text: '誠實', bopomofo: ['ㄔㄥˊ', 'ㄕˊ'], meaning: '言行一致，不說謊話。' },
              { text: '勤勞', bopomofo: ['ㄑㄧㄣˊ', 'ㄌㄠˊ'], meaning: '努力工作不偷懶。' }
            ]
          }
        ]
      },
      {
        gradeId: 'g3_up',
        gradeName: '三年級上學期',
        lessons: [
          {
            lessonId: 'ni_3u_01',
            title: '第一課：智勇雙全（成語挑戰）',
            words: [
              { text: '百步穿楊', bopomofo: ['ㄅㄞˇ', 'ㄅㄨˋ', 'ㄔㄨㄢ', 'ㄧㄤˊ'], meaning: '技藝極為高超精準。' },
              { text: '臥虎藏龍', bopomofo: ['ㄨㄛˋ', 'ㄏㄨˇ', 'ㄘㄤˊ', 'ㄌㄨㄥˊ'], meaning: '潛藏著未被發現的高手。' },
              { text: '行俠仗義', bopomofo: ['ㄒㄧㄥˊ', 'ㄒㄧㄚˊ', 'ㄓㄤˋ', 'ㄧˋ'], meaning: '主持正義，扶助弱小。' }
            ]
          }
        ]
      }
    ]
  }
};

export function getGradeMixedWords(gradeLevel) {
  const words = new Map();
  for (const publisherId of ['knsh', 'hanlin', 'nani']) {
    const pub = TEXTBOOK_CATALOG[publisherId];
    for (const grade of pub.grades.filter((item) => item.gradeId.startsWith(`g${gradeLevel}_`))) {
      for (const lesson of grade.lessons) {
        for (const word of lesson.words) {
          const key = JSON.stringify([word.text, word.bopomofo]);
          const item = words.get(key) || { ...word, gradeLevel, sourceKind: 'practice-example', sourceRefs: [] };
          item.sourceRefs.push({ publisherId, gradeId: grade.gradeId, lessonId: lesson.lessonId });
          words.set(key, item);
        }
      }
    }
  }
  for (const word of getOriginalProseWords(gradeLevel)) {
    const key = JSON.stringify([word.text, word.bopomofo]);
    if (!words.has(key)) words.set(key, { ...word, sourceRefs: [] });
  }
  for (const word of getGradeCommonWords(gradeLevel)) {
    const key = JSON.stringify([word.text, word.bopomofo]);
    if (!words.has(key)) words.set(key, { ...word, sourceRefs: [] });
  }
  for (const word of getGradeVocabulary(gradeLevel)) {
    const key = JSON.stringify([word.text, word.bopomofo]);
    if (!words.has(key)) words.set(key, { ...word, sourceRefs: [] });
  }
  return [...words.values()];
}

// 遊戲自編的漸進範圍，並非出版社或教育部正式年級字表。
const gradeCommonAdditions = [
  '家爸媽朋友手足心口人我你他她名字頭耳牙衣帽鞋床門飯米茶杯吃喝坐走玩看書筆紙大小上下左右一二三四五六七八九十天山水火木日月鳥魚花草貓狗',
  '兄弟姐妹祖孫親兒女老幼姓身臉眼鼻舌背腿指毛襪裙褲袋枕桌椅窗房屋菜粥湯碗盤筷洗睡站跑跳笑哭唱聽說讀寫畫學校班師生課早晚午安禮謝愛幫忙陪抱問答春夏秋冬風雨雪雲星光紅黃綠藍白黑百千',
  '肩肚皮被牆廚浴匙鍋氣晴陰冷熱暖涼晨夜海河湖溪泉池浪沙石土地林森竹葉根果種苗瓜豆稻雞鴨鵝牛羊馬兔鼠蜂蟻紫亮暗乾濕數量個位元次件本張盒串雙群隊排列年季週秒時刻點歲斤尺寸度',
  '岩峰谷坡根枝芽蟲蝶虎龍蛇熊鹿蝦蟹貝龜萬億零層套頁圓方角邊線長短寬窄高低細厚薄輕重多滿半全少空前後內外東西南北中遠近旁間頂底首尾先末來去進退出入直斜平正反順逆快慢增減倍總均等',
  '責任誠信尊敬勤勞勇敢耐心合作觀察探索思考理解表達規則公平珍惜資源環境保護',
  '溝通協助判斷選擇比較推論證據實驗研究創意規劃目標反省改善文化歷史社會自然科學'
];

export function getGradeCommonWords(gradeLevel) {
  const characters = new Set(Array.from(gradeCommonAdditions.slice(0, gradeLevel).join('')));
  return [...characters].filter(character => COMMON_CHAR_BOPOMOFO_MAP[character]).map(character => ({
    text: character, bopomofo: [COMMON_CHAR_BOPOMOFO_MAP[character]], gradeLevel,
    sourceKind: 'dictionary-practice', meaning: '教育部國語小字典字音・遊戲自編年級練習。'
  }));
}

TEXTBOOK_CATALOG.mixed = {
  publisherId: 'mixed', publisherName: '同年級混合練習',
  sourceStatus: { verified: false, schoolYear: null, sourceUrl: null,
    label: '出版社分類範例尚待核對；散文為本遊戲原創' },
  grades: Array.from({ length: 6 }, (_, i) => {
    const gradeLevel = i + 1;
    const words = getGradeMixedWords(gradeLevel);
    const publishers = new Set(words.flatMap((word) => word.sourceRefs.map((ref) => ref.publisherId)));
    return {
      gradeId: `g${gradeLevel}_mix`, gradeName: `${gradeLevel} 年級`,
      lessons: [{ lessonId: `mixed_grade_${gradeLevel}`, words,
        title: publishers.size ? '同年級常用字、練習範例與原創散文' : '同年級常用字與原創散文' }]
    };
  })
};
