const WEAPON_EFFECTS = {
  1: { name: '木劍單斬', style: 'sword', charCuts: 1, finisherCuts: 1, charWaves: 0, finisherWaves: 0,
    thickness: 4, radius: 65, particles: 7, afterImages: 1, shake: 1.5, lifetime: 220 },
  2: { name: '青鋒雙影', style: 'sword', charCuts: 2, finisherCuts: 2, charWaves: 0, finisherWaves: 1,
    thickness: 5, radius: 85, particles: 16, afterImages: 3, shake: 3, lifetime: 280 },
  3: { name: '玄鐵流雲', style: 'sword', charCuts: 3, finisherCuts: 3, charWaves: 1, finisherWaves: 2,
    thickness: 7, radius: 110, particles: 28, afterImages: 5, shake: 5, lifetime: 340 }
};

export function getWeaponEffectProfile(weapon) {
  const base = WEAPON_EFFECTS[weapon?.tier] || WEAPON_EFFECTS[1];
  const style = weapon?.style || base.style || 'sword';
  return {
    ...base,
    name: weapon?.effectName || base.name,
    style,
    effectName: style === 'saber' ? '刀罡' : style === 'spear' ? '槍芒' : '劍氣',
    color: weapon?.slashColor ?? 0xe9ecef
  };
}

