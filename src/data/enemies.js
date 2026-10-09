/**
 * 《武俠打字傳》暗黑式三大難度 $\times$ 10 關首領資料表 (enemies.js)
 * 境界設定：
 * - easy: 【初出茅廬（易）】適合低年級 1~2 年級，敵人攻擊間隔長或不反擊，重在熟悉鍵位。
 * - medium: 【名震江湖（中）】適合中年級 3~4 年級，敵人出招條 8~10 秒，出現紅光破招。
 * - hard: 【一代宗師（難）】適合高年級 5~6 年級，敵人出招條 5~6 秒，考驗盲打與長句。
 */

export const HEROES = {
  yun: {
    id: 'yun',
    name: '雲清川',
    title: '少年劍客',
    school: 'weapon',
    avatar: './assets/icons/yun_avatar_v3.png',
    primaryColor: 0x48cae4,
    secondaryColor: 0x90e0ef,
    robeColor: 0x1d3557
  },
  su: {
    id: 'su',
    name: '蘇映雪',
    title: '靈動女劍士',
    school: 'weapon',
    avatar: './assets/icons/su_avatar_v3.png',
    primaryColor: 0x72efdd,
    secondaryColor: 0xcaf0f8,
    robeColor: 0x2d6a4f
  },
  mu: {
    id: 'mu',
    name: '林牧風',
    title: '萬獸山莊馴獸師',
    school: 'beast',
    avatar: './assets/icons/mu_avatar_v5.png',
    primaryColor: 0x52b788,
    secondaryColor: 0x95d5b2,
    robeColor: 0x2d6a4f
  }
};

export const WEAPONS = [
  {
    id: 'wood_sword',
    tier: 1,
    name: '初階・桃木短劍',
    atk: 25,
    critRate: 0.05,
    price: 0,
    slashColor: 0xe9ecef,
    icon: './assets/icons/wood_sword_v3.png',
    outfitIcon: './assets/icons/linen_outfit_v3.png',
    OutfitName: '初期：布衣短打＋桃木短劍',
    desc: '輕巧趁手，適合打磨基礎指法。'
  },
  {
    id: 'qingfeng_sword',
    tier: 2,
    name: '中階・三尺青鋒劍',
    atk: 50,
    critRate: 0.18,
    price: 150,
    slashColor: 0x48cae4,
    icon: './assets/icons/qingfeng_sword_v3.png',
    outfitIcon: './assets/icons/wanderer_outfit_v3.png',
    OutfitName: '中期：青藍俠客服＋金屬護腕',
    desc: '雙道青色劍痕、半月劍氣與三重突進殘影，爆發演出機率 18%。'
  },
  {
    id: 'xuantie_sword',
    tier: 3,
    name: '高階・流雲玄鐵神劍',
    atk: 85,
    critRate: 0.32,
    price: 360,
    slashColor: 0xf59f00,
    icon: './assets/icons/xuantie_sword_v3.png',
    outfitIcon: './assets/icons/grandmaster_outfit_v3.png',
    OutfitName: '後期：流雲宗師袍＋玄鐵神劍',
    desc: '三道金色劍痕、雙重流雲劍罡與五重殘影，命中回饋更鮮明。'
  }
];

export const SHOP_ITEMS = [
  {
    id: 'potion_small',
    name: '金創藥',
    price: 35,
    type: 'heal',
    value: 45,
    icon: './assets/icons/healing_powder_v3.png',
    desc: '立即恢復 45 點氣血（HP）。'
  },
  {
    id: 'potion_large',
    name: '九轉大還丹',
    price: 90,
    type: 'full_heal_boost',
    value: 100,
    maxHpBonus: 25,
    icon: './assets/icons/restoration_elixir_v3.png',
    desc: '立即回滿氣血，並永久提升氣血上限 +25。'
  },
  {
    id: 'amulet_calm',
    name: '靜心護身符',
    price: 55,
    type: 'shield_miss',
    value: 2,
    icon: './assets/icons/serenity_amulet_v3.png',
    desc: '戰鬥中可抵消 2 次按錯鍵（不中斷 Combo）。'
  }
];

export const DIFFICULTY_CONFIG = {
  easy: {
    id: 'easy',
    name: '初出茅廬（易）',
    badgeIcon: './assets/icons/realm_beginner_v4.png',
    gradeDesc: '適合國小 1~2 年級・鍵位摸索與單字生詞',
    unlockReq: null,
    totalStages: 10
  },
  medium: {
    id: 'medium',
    name: '名震江湖（中）',
    badgeIcon: './assets/icons/realm_renowned_v4.png',
    gradeDesc: '適合國小 3~4 年級・課本生詞與實用成語',
    unlockReq: 'easy_cleared',
    totalStages: 10
  },
  hard: {
    id: 'hard',
    name: '一代宗師（難）',
    badgeIcon: './assets/icons/realm_grandmaster_v4.png',
    gradeDesc: '適合國小 5~6 年級・進階成語、唐詩與名篇長句',
    unlockReq: 'medium_cleared',
    totalStages: 10
  }
};

/**
 * 三大境界各 10 關首領配置（共 30 關）
 */
export const DIABLO_STAGES = {
  easy: [
    {
      stageIndex: 1,
      title: '第一關：稻草人',
      chapterName: '山門・演武場',
      sceneTheme: 'mountain_gate',
      rewardCoins: 30,
      enemy: { name: '稻草人', title: '新手練功靶', visualType: 'straw', primaryColor: 0xd4a373, attackIntervalMs: 0, atk: 0, quote: '（在山風中靜靜佇立，供少俠初試劍芒）' }
    },
    {
      stageIndex: 2,
      title: '第二關：少林木人樁',
      chapterName: '山門・機關道',
      sceneTheme: 'mountain_gate',
      rewardCoins: 40,
      enemy: { name: '少林木人樁', title: '機關木樁', visualType: 'wood', primaryColor: 0xa98467, attackIntervalMs: 0, atk: 0, quote: '（木臂規律轉動，測試拼音指法連貫度）' }
    },
    {
      stageIndex: 3,
      title: '第三關：巡山小賊',
      chapterName: '翠竹林・外圍',
      sceneTheme: 'bamboo_forest',
      rewardCoins: 50,
      enemy: { name: '巡山小賊', title: '草莽流寇', visualType: 'bandit_scout', primaryColor: 0x6c757d, attackIntervalMs: 16000, atk: 10, quote: '「把錢袋交出來，饒你一條小命！」' }
    },
    {
      stageIndex: 4,
      title: '第四關：斗笠山賊',
      chapterName: '翠竹林・竹海深處',
      sceneTheme: 'bamboo_forest',
      rewardCoins: 60,
      enemy: { name: '斗笠山賊', title: '黑風寨刀客', visualType: 'bandit_saber', primaryColor: 0x495057, attackIntervalMs: 14000, atk: 12, quote: '「看俺手裡的朴刀厲不厲害！」' }
    },
    {
      stageIndex: 5,
      title: '第五關：雙斧悍匪',
      chapterName: '古驛客棧・門前隘口',
      sceneTheme: 'ancient_inn',
      rewardCoins: 75,
      enemy: { name: '雙斧悍匪', title: '山寨刀斧手', visualType: 'bandit_axes', primaryColor: 0x9d4edd, attackIntervalMs: 12000, atk: 15, quote: '「敢在客棧壞我們好事？吃我一斧！」' }
    },
    {
      stageIndex: 6,
      title: '第六關：武當小道童',
      chapterName: '襄陽古城・門派切磋',
      sceneTheme: 'arena',
      rewardCoins: 90,
      enemy: { name: '武當小道童', title: '武當入門弟子', visualType: 'wudang', primaryColor: 0x3a86ff, attackIntervalMs: 11000, atk: 14, quote: '「少俠請出招，武當太極切磋一下！」' }
    },
    {
      stageIndex: 7,
      title: '第七關：黑風左護法',
      chapterName: '黑風要塞・前哨',
      sceneTheme: 'ancient_inn',
      rewardCoins: 110,
      enemy: { name: '黑風左護法', title: '山寨大護法', visualType: 'protector', primaryColor: 0xc9184a, attackIntervalMs: 10000, atk: 18, quote: '「有點本事，但想進山寨沒那麼容易！」' }
    },
    {
      stageIndex: 8,
      title: '第八關：擂台力士',
      chapterName: '襄陽古城・大擂台',
      sceneTheme: 'arena',
      rewardCoins: 130,
      enemy: { name: '擂台力士', title: '塞外大力神', visualType: 'arena', primaryColor: 0xd90429, attackIntervalMs: 9500, atk: 20, quote: '「這身銅筋鐵骨，看你能不能打得穿！」' }
    },
    {
      stageIndex: 9,
      title: '第九關：機關傀儡',
      chapterName: '月下練武場・機關陣',
      sceneTheme: 'moon_dojo',
      rewardCoins: 150,
      enemy: { name: '機關傀儡', title: '墨家玄鐵衛', visualType: 'puppet', primaryColor: 0x00bbf9, attackIntervalMs: 9000, atk: 22, quote: '「【機關啟動】全面檢驗少俠之連擊內力。」' }
    },
    {
      stageIndex: 10,
      title: '第十關：山大王・黑風盜',
      chapterName: '雲海山巔・初出茅廬決戰',
      sceneTheme: 'cloud_peak',
      rewardCoins: 200,
      enemy: { name: '山大王・黑風盜', title: '初階首領', visualType: 'boss', primaryColor: 0xe63946, attackIntervalMs: 8000, atk: 25, quote: '「打完這十招，才算真正走出山門！」' }
    }
  ],

  medium: [
    {
      stageIndex: 1,
      title: '第一關：鐵甲稻草人',
      chapterName: '山門・名震初試',
      sceneTheme: 'mountain_gate',
      rewardCoins: 60,
      enemy: { name: '鐵甲稻草人', title: '強化試煉靶', visualType: 'straw', primaryColor: 0xadb5bd, attackIntervalMs: 12000, atk: 12, quote: '（披覆鐵甲，需精準打完字詞始可破甲）' }
    },
    {
      stageIndex: 2,
      title: '第二關：銅臂木人樁',
      chapterName: '山門・演武場',
      sceneTheme: 'mountain_gate',
      rewardCoins: 75,
      enemy: { name: '銅臂木人樁', title: '少林銅人機關', visualType: 'wood', primaryColor: 0xd4a373, attackIntervalMs: 11000, atk: 14, quote: '（銅臂呼呼生風，考驗成語熟練度）' }
    },
    {
      stageIndex: 3,
      title: '第三關：黑風寨刀客',
      chapterName: '翠竹林・青竹道',
      sceneTheme: 'bamboo_forest',
      rewardCoins: 90,
      enemy: { name: '黑風寨刀客', title: '精銳刀手', visualType: 'bandit_scout', primaryColor: 0x343a40, attackIntervalMs: 10000, atk: 16, quote: '「讓你見識見識黑風寨的快刀！」' }
    },
    {
      stageIndex: 4,
      title: '第四關：奪命連環刀',
      chapterName: '翠竹林・水簾洞',
      sceneTheme: 'bamboo_forest',
      rewardCoins: 110,
      enemy: { name: '奪命連環刀', title: '連環刀客', visualType: 'bandit_saber', primaryColor: 0x7209b7, attackIntervalMs: 9000, atk: 18, quote: '「刀刀奪命，少俠可要看清楚了！」' }
    },
    {
      stageIndex: 5,
      title: '第五關：開山巨斧手',
      chapterName: '古驛客棧・黑風堂',
      sceneTheme: 'ancient_inn',
      rewardCoins: 130,
      enemy: { name: '開山巨斧手', title: '山寨巨力狂徒', visualType: 'bandit_axes', primaryColor: 0xf72585, attackIntervalMs: 8500, atk: 22, quote: '「斧風過處寸草不生！」' }
    },
    {
      stageIndex: 6,
      title: '第六關：武當劍俠',
      chapterName: '襄陽古城・真武殿',
      sceneTheme: 'arena',
      rewardCoins: 150,
      enemy: { name: '武當劍俠', title: '名門正派精銳', visualType: 'wudang', primaryColor: 0x4cc9f0, attackIntervalMs: 8000, atk: 20, quote: '「劍隨心動，以氣馭劍！」' }
    },
    {
      stageIndex: 7,
      title: '第七關：奪命右護法',
      chapterName: '黑風要塞・天險關',
      sceneTheme: 'ancient_inn',
      rewardCoins: 180,
      enemy: { name: '奪命右護法', title: '黑風雙煞之一', visualType: 'protector', primaryColor: 0xef233c, attackIntervalMs: 7500, atk: 24, quote: '「護法在此，誰敢擅闖！」' }
    },
    {
      stageIndex: 8,
      title: '第八關：塞外刀王',
      chapterName: '襄陽古城・王座擂台',
      sceneTheme: 'arena',
      rewardCoins: 210,
      enemy: { name: '塞外刀王', title: '狂沙霸主', visualType: 'arena', primaryColor: 0xffb703, attackIntervalMs: 7000, atk: 26, quote: '「塞外風沙磨礪之身，試你的中原文思！」' }
    },
    {
      stageIndex: 9,
      title: '第九關：地煞重裝傀儡',
      chapterName: '月下練武場・深層地牢',
      sceneTheme: 'moon_dojo',
      rewardCoins: 250,
      enemy: { name: '地煞重裝傀儡', title: '墨家重裝機關', visualType: 'puppet', primaryColor: 0x4361ee, attackIntervalMs: 6500, atk: 28, quote: '「【地煞陣法啟動】破招時機稍縱即逝。」' }
    },
    {
      stageIndex: 10,
      title: '第十關：黑風教教主',
      chapterName: '雲海山巔・名震江湖決戰',
      sceneTheme: 'cloud_peak',
      rewardCoins: 350,
      enemy: { name: '黑風教教主', title: '魔教巨頭', visualType: 'boss', primaryColor: 0x9d0208, attackIntervalMs: 6000, atk: 32, quote: '「名震江湖又如何？終歸要拜伏在本座手下！」' }
    }
  ],

  hard: [
    {
      stageIndex: 1,
      title: '第一關：墨家旋風草人',
      chapterName: '山門・宗師試煉',
      sceneTheme: 'mountain_gate',
      rewardCoins: 100,
      enemy: { name: '墨家旋風草人', title: '神機百變靶', visualType: 'straw', primaryColor: 0xffa200, attackIntervalMs: 7500, atk: 20, quote: '（長句名篇環繞，速度慢則狂風大作）' }
    },
    {
      stageIndex: 2,
      title: '第二關：千機百鍊木人',
      chapterName: '山門・千機洞',
      sceneTheme: 'mountain_gate',
      rewardCoins: 130,
      enemy: { name: '千機百鍊木人', title: '極限機關', visualType: 'wood', primaryColor: 0x936639, attackIntervalMs: 7000, atk: 22, quote: '（毫釐不差方能連續破關）' }
    },
    {
      stageIndex: 3,
      title: '第三關：影流蒙面刺客',
      chapterName: '翠竹林・暗夜修羅',
      sceneTheme: 'bamboo_forest',
      rewardCoins: 160,
      enemy: { name: '影流蒙面刺客', title: '暗影殺手', visualType: 'bandit_scout', primaryColor: 0x212529, attackIntervalMs: 6500, atk: 25, quote: '「影起無形，劍落無痕！」' }
    },
    {
      stageIndex: 4,
      title: '第四關：斷魂槍客',
      chapterName: '翠竹林・斷魂坡',
      sceneTheme: 'bamboo_forest',
      rewardCoins: 200,
      enemy: { name: '斷魂槍客', title: '槍出如龍', visualType: 'bandit_saber', primaryColor: 0x8338ec, attackIntervalMs: 6000, atk: 28, quote: '「一點寒芒先到，隨後刀槍如龍！」' }
    },
    {
      stageIndex: 5,
      title: '第五關：撼山金剛',
      chapterName: '古驛客棧・廢墟',
      sceneTheme: 'ancient_inn',
      rewardCoins: 240,
      enemy: { name: '撼山金剛', title: '金剛不壞體', visualType: 'bandit_axes', primaryColor: 0xd90429, attackIntervalMs: 5800, atk: 30, quote: '「撼山易，撼金剛難！」' }
    },
    {
      stageIndex: 6,
      title: '第六關：武當長老',
      chapterName: '襄陽古城・紫霄宮',
      sceneTheme: 'arena',
      rewardCoins: 280,
      enemy: { name: '武當長老', title: '一代名宿', visualType: 'wudang', primaryColor: 0x3a86ff, attackIntervalMs: 5500, atk: 30, quote: '「天下莫柔弱於水，至剛反折。」' }
    },
    {
      stageIndex: 7,
      title: '第七關：陰陽雙煞',
      chapterName: '黑風要塞・無間地獄',
      sceneTheme: 'ancient_inn',
      rewardCoins: 330,
      enemy: { name: '陰陽雙煞', title: '煞氣遮天', visualType: 'protector', primaryColor: 0x6a040f, attackIntervalMs: 5200, atk: 34, quote: '「陰陽合璧，天下無雙！」' }
    },
    {
      stageIndex: 8,
      title: '第八關：劍雨神行客',
      chapterName: '襄陽古城・巔峰論劍',
      sceneTheme: 'arena',
      rewardCoins: 380,
      enemy: { name: '劍雨神行客', title: '萬象武尊', visualType: 'arena', primaryColor: 0x00f5d4, attackIntervalMs: 5000, atk: 36, quote: '「洋夷名言亦成劍意，看你雙語可否通達！」' }
    },
    {
      stageIndex: 9,
      title: '第九關：天罡滅魂傀儡',
      chapterName: '月下練武場・天罡星宿陣',
      sceneTheme: 'moon_dojo',
      rewardCoins: 450,
      enemy: { name: '天罡滅魂傀儡', title: '終極墨家禁斷兵裝', visualType: 'puppet', primaryColor: 0x03045e, attackIntervalMs: 4800, atk: 38, quote: '「【天罡滅魂陣】十步一殺，唯快不破。」' }
    },
    {
      stageIndex: 10,
      title: '第十關：極・黑風魔皇',
      chapterName: '雲海山巔・武林至尊終章',
      sceneTheme: 'cloud_peak',
      rewardCoins: 600,
      enemy: { name: '極・黑風魔皇', title: '天下第一大魔頭', visualType: 'boss', primaryColor: 0x370617, attackIntervalMs: 4400, atk: 42, quote: '「今日決戰光明頂，天下誰與爭鋒！」' }
    }
  ]
};
