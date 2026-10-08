// 中央操作區與兩側演出區共用同一組尺寸，包含姿態放大及出招位移餘量。
export function battleLayout(width,height,top=0,bottom=height) {
  const stacked=width<=700;
  const side=width*.27;
  const center=stacked?width-24:Math.min(620,width*.46-24);
  const available=stacked?Math.max(1,bottom-top-48):height*.6;
  const fighterHeight=Math.max(1,Math.min(490,available/1.08,(side-24)/.81));
  return {stacked,side,center,fighterHeight,
    heroX:width*(stacked?.22:.135),enemyX:width*(stacked?.78:.865),
    baseline:stacked?top+fighterHeight*.864:height*.79};
}
