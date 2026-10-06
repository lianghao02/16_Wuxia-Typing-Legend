/**
 * 臺灣國小三大出版社（康軒、翰林、南一）公開課綱生字與生詞題庫 (textbooks.js)
 * 供小朋友依照學校國語課本進度直接選擇對應版本與課次進行修煉
 */

export const TEXTBOOK_CATALOG = {
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
