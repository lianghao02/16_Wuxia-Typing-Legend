// 六章三十關，一條完整主線；境界改變挑戰程度，不重複鎖住故事。
export const REALMS = { easy: '初出茅廬', medium: '名震江湖', hard: '一代宗師' };
export const CHAPTERS = [
  { name: '山門初行', theme: 'mountain_gate', seal: '勇氣', intro: '青嵐書院以字為劍，守護記錄各地記憶的六枚文印。黑風寨取走文印，沿途書信逐漸失去文字。你與同伴踏上尋回記憶的旅程。', end: '師父交出勇氣文印的線索：竹林深處，有人仍守著一封完整的信。', quests: [
    ['第一道劍光','training','straw','師父：先讓指尖找到位置。完成十次練功，桃木劍也能發出劍氣。','十個練功靶應聲亮起。師父點頭，准許你下山。'],
    ['木人傳信','training','wood','木人機關藏著下山口令。把十道口令打完整，山門就會開啟。','機關打開，一封送往竹林的信落在你手中。'],
    ['山路護送','journey','bandit_scout','送信少年不敢獨自下山。陪他走過十段山路。','少年平安抵達路口，告訴你黑風寨正在尋找文印。'],
    ['路口攔截','duel','bandit_saber','巡山刀客擋住去路。打破他的防禦，把信送出去。','刀客放下武器：寨主命令他收走所有寫著文印的信。'],
    ['守門者的試煉','boss','wudang','守門道童想確認你的決心。以十招切磋，取得前往竹海的資格。','你通過試煉，得到第一枚勇氣文印。'] ] },
  { name: '竹海尋信', theme: 'bamboo_forest', seal: '信任', intro: '竹海的信使記不得收信人的名字。你決定循著風鈴聲找回散落的信件。', end: '信件指出：古驛客棧的掌櫃，曾替黑風寨保存一本名冊。', quests: [
    ['風鈴小徑','journey','straw','每串風鈴是一個路標。完成十段路，找出信使的位置。','竹葉分開，信使就在前方。'],
    ['遺失的名字','event','wudang','替信使補全信封上的名字，讓信件重新找到主人。','信使想起自己的朋友，願意帶你進入竹海。'],
    ['竹影追逐','journey','bandit_scout','小賊抱著信袋逃走了。完成十段追逐，追回信件。','你追回信袋，也發現小賊只是想找回家人的信。'],
    ['破開竹陣','duel','wood','黑風寨留下木人竹陣。逐步擊破十道機關。','竹陣停下，藏在裡面的文印露出微光。'],
    ['雙斧守信人','boss','bandit_axes','守信人不相信外來者。用穩定的十招證明你願意守護信件。','守信人交出信任文印，請你替他送一封家書。'] ] },
  { name: '古驛燈火', theme: 'ancient_inn', seal: '互助', intro: '客棧仍亮著燈，掌櫃卻忘了旅客的故事。一本空白名冊，等著大家一起補回。', end: '名冊記著襄陽城的比武大會：勝者能查閱失落文印的下落。', quests: [
    ['掌櫃的委託','event','wudang','幫掌櫃補回十筆旅客紀錄，讓客棧重新迎接朋友。','旅客認回自己的行李，客棧恢復熱鬧。'],
    ['燈下送暖','journey','straw','沿著驛道送出十份熱茶與書信。','旅人告訴你，寨主曾在襄陽擂台現身。'],
    ['藏書木箱','training','wood','修復十道木箱機關，取回掌櫃保存的名冊。','名冊裡不只有姓名，還有一段關於寨主的往事。'],
    ['夜訪刀客','duel','bandit_saber','刀客前來取走名冊。保護書頁，直到旅客撤離。','刀客認出名冊中自己的名字，停止交手。'],
    ['護法問心','boss','protector','左護法試圖封住客棧。守住十次交手，保護大家的故事。','旅客合力點亮互助文印，左護法退往襄陽。'] ] },
  { name: '襄陽會武', theme: 'arena', seal: '堅毅', intro: '襄陽城聚集各路好手。你參加公平切磋，尋找黑風寨主失去的記憶。', end: '城中長者指出月下書院：那裡保存著寨主年少時寫下的第一篇文章。', quests: [
    ['城門通行','event','wudang','協助守城道童整理十封通行書信。','城門開啟，你取得會武資格。'],
    ['擂台暖身','training','wood','調整步伐與指尖，完成十組暖身。','你找到自己的節奏，準備正式上台。'],
    ['刀客切磋','duel','bandit_saber','刀客已成為同伴。以十招互相磨練。','刀客教你看清對手出招前的動作。'],
    ['雙斧猛將','duel','bandit_axes','猛將招式沉重，耐心完成每一次反擊。','猛將佩服你的穩定，交出文印藏處的線索。'],
    ['擂台決勝','boss','arena','決勝切磋分為試探、破防、決勝。完成十招，取得堅毅文印。','你贏得會武，向眾人說明尋回記憶的目的。'] ] },
  { name: '月下墨閣', theme: 'moon_dojo', seal: '明辨', intro: '墨閣中的文章被機關分成碎片。寨主以為抹去文字就能忘記失敗，卻也讓所有人忘記了珍貴的回憶。', end: '文章最後寫著：雲海山巔，是六枚文印最初相聚的地方。', quests: [
    ['月光尋頁','journey','straw','沿著月光找回十片散落書頁。','書頁提到寨主曾想成為守護江湖的俠客。'],
    ['墨閣解鎖','training','wood','以十道文字口令解開墨閣。','封住文章的機關逐一解開。'],
    ['真假書信','event','wudang','道童已核對真實書信，請你補全十處缺漏。','原來寨主並未被朋友拋棄，是誤解讓他封閉了自己。'],
    ['機關守衛','duel','puppet','傀儡守住最後一頁。完成十次交手，關閉機關。','最後一頁仍留著寨主的願望：願大家記得彼此。'],
    ['護法的選擇','boss','protector','左護法再次現身。守住書頁，讓他看見完整的文章。','護法放下鉤刃，交出明辨文印，願意帶你上山。'] ] },
  { name: '雲海歸字', theme: 'cloud_peak', seal: '傳承', intro: '五枚文印照亮通往山巔的路。你帶著沿途朋友的書信，準備讓寨主重新讀懂自己的故事。', end: '六枚文印重聚，文字回到每一封信與每一本書。寨主重新打開書院，與你一起守護江湖。旅程完結，而你的劍與故事仍能繼續成長。', quests: [
    ['踏雲登山','journey','bandit_saber','刀客同伴守住山路。完成十段攀登，抵達最後的山門。','你看見山巔，也看見沿途朋友帶來的燈火。'],
    ['最後的機關','training','puppet','解開十道封山機關，讓朋友們能一起上山。','山門打開，大家一同走入雲海。'],
    ['朋友的回信','event','wudang','整理十封回信，告訴寨主大家仍記得他。','寨主聽見熟悉的名字，卻仍不敢面對自己的過去。'],
    ['黑風劍陣','duel','protector','護法協助你破解寨主的劍陣。完成十次交手，走向山巔。','劍陣消散，你將完整文章交到寨主手中。'],
    ['以字為劍','boss','boss','最後十招，不為擊倒一個人，而為打破封住記憶的黑風。','最後一道劍光照亮文章，寨主想起自己的初心。傳承文印重新亮起。'] ] }
];
const CHAPTER_HP_TABLE = [
  { duel: 120, elite: 150, boss: 220, def: 0.00 }, // 第一章：山門初行
  { duel: 165, elite: 210, boss: 310, def: 0.05 }, // 第二章：竹海尋信
  { duel: 220, elite: 280, boss: 420, def: 0.08 }, // 第三章：古驛燈火
  { duel: 270, elite: 350, boss: 550, def: 0.12 }, // 第四章：襄陽會武
  { duel: 350, elite: 440, boss: 700, def: 0.15 }, // 第五章：月下墨閣
  { duel: 440, elite: 540, boss: 880, def: 0.18 }  // 第六章：雲海歸字
];

export const ADVENTURE_STAGES = CHAPTERS.flatMap((chapter, c) => chapter.quests.map((q, i) => {
  const kind = q[1];
  const isCombat = kind === 'duel' || kind === 'boss';
  const isElite = kind === 'duel' && i === 3 && c >= 1;
  const hpCfg = CHAPTER_HP_TABLE[c] || CHAPTER_HP_TABLE[0];
  const maxHp = kind === 'boss' ? hpCfg.boss : isElite ? hpCfg.elite : isCombat ? hpCfg.duel : 100;
  const defense = kind === 'boss' ? hpCfg.def + 0.04 : isElite ? hpCfg.def + 0.02 : isCombat ? hpCfg.def : 0;
  return {
    id: c * 5 + i,
    chapter: c,
    chapterName: chapter.name,
    sceneTheme: chapter.theme,
    name: q[0],
    kind,
    isCombat,
    isElite,
    targetWords: 10,
    enemy: {
      visualType: q[2],
      name: q[0],
      title: kind === 'boss' ? '章節首領' : isElite ? '精銳強敵' : '文印江湖',
      primaryColor: 0xc0a06c,
      maxHp,
      defense: Number(defense.toFixed(2))
    },
    intro: q[3],
    outro: q[4],
    reward: kind === 'boss' ? 60 : isElite ? 40 : 30
  };
}));
