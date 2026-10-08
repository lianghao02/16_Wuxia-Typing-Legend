// v3/v4 實測可見寬度最多為圖高的 .52；預留首領放大與姿態餘量。
export const FIGHTER_VISIBLE_WIDTH = .57;
export function battleLayout(width,height,top=0,bottom=height,keyboard=true) {
  const stacked=width<=700;
  const side=width*(keyboard?.27:.30);
  const center=stacked?width-24:Math.min(560,width-2*side-24);
  const available=stacked?Math.max(1,bottom-top-48):height*.78;
  const lane=stacked?width*.44:side;
  const fighterHeight=Math.max(1,Math.min(650,available/(stacked?.80:1.08),(lane-24)/FIGHTER_VISIBLE_WIDTH));
  return {stacked,side,center,fighterHeight,
    heroX:stacked?width*.22:side/2,enemyX:stacked?width*.78:width-side/2,
    baseline:stacked?top+fighterHeight*.70:height*.76};
}
