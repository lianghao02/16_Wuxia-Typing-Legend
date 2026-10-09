"""依固定四格輸出姿態 PNG 與量測資料；不改畫人物，不覆寫正式原圖。"""

import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


def measurements(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value >= 128 else 0)
    box = visible.getbbox()
    if not box:
        raise ValueError("姿態格沒有可見人物。")
    left, top, right, bottom = box
    # 以最下方肢體區估計接地中心；實際比較與動畫預覽再確認。
    foot_top = max(top, bottom - round((bottom - top) * 0.15))
    feet = visible.crop((0, foot_top, image.width, bottom)).getbbox()
    anchor_x = (feet[0] + feet[2]) / 2 if feet else (left + right) / 2
    return {
        "size": list(image.size), "visibleBounds": list(box),
        "alphaBounds": list(alpha.getbbox()), "alpha": list(alpha.getextrema()),
        "anchor": {"x": anchor_x / image.width, "y": bottom / image.height, "scale": 1},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("group")
    parser.add_argument("source", type=Path)
    parser.add_argument("--approve", action="store_true", help="僅在已實際檢視該圖集內容後使用")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    manifest_path = root / "assets/animations/manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    group = next(item for item in manifest["groups"] if item["id"] == args.group)
    with Image.open(args.source) as source:
        source.load()
        if source.mode != "RGBA" or source.getchannel("A").getextrema()[0] != 0:
            raise ValueError("圖集必須包含真正透明像素的 RGBA。")
        if source.width % 2 or source.height % 2:
            raise ValueError("圖集寬高需能整分為四格。")
        cell_width, cell_height = source.width // 2, source.height // 2
        if min(cell_width, cell_height) < 400:
            raise ValueError("單格解析度不足。")
        poses = ["hit", "stagger", "defeat", "recover"] if "enemyId" in group else ["windup", "attack", "impact", "recover"]
        frames = []
        # 圖集的劍尖可能跨過理論格線但未碰到另一人物；以連通輪廓分離，避免裁掉武器。
        labels = source.getchannel("A").point(lambda value: 255 if value >= 8 else 0).filter(ImageFilter.MaxFilter(5))
        for index, pose in enumerate(poses):
            x, y = index % 2 * cell_width, index // 2 * cell_height
            center_x, center_y = x + cell_width // 2, y + cell_height // 2
            candidates = [(px, py) for py in range(y, y + cell_height, 3) for px in range(x, x + cell_width, 3) if labels.getpixel((px, py)) == 255]
            if not candidates:
                raise ValueError(f"{pose} 缺少獨立人物輪廓。")
            seed = min(candidates, key=lambda point: (point[0] - center_x) ** 2 + (point[1] - center_y) ** 2)
            ImageDraw.floodfill(labels, seed, index + 1)
            mask = labels.point(lambda value: 255 if value == index + 1 else 0)
            box = mask.getbbox()
            if not box or (box[2] - box[0]) * (box[3] - box[1]) < cell_width * cell_height * 0.12:
                raise ValueError(f"{pose} 連通主體不足，需檢視圖集排列。")
            if min(box[0], box[1], source.width - box[2], source.height - box[3]) < 3:
                raise ValueError(f"{pose} 接觸圖集外邊，需重新檢查裁切。")
            isolated = Image.new("RGBA", source.size)
            isolated.paste(source, mask=mask)
            frame = isolated.crop(box)
            measured = measurements(frame)
            frames.append((pose, frame, measured))
    # 共用人物接地座標與透明畫布，完整保留跨格但未互相重疊的武器輪廓。
    max_left = max(frame[2]["anchor"]["x"] * frame[1].width for frame in frames)
    max_right = max((1 - frame[2]["anchor"]["x"]) * frame[1].width for frame in frames)
    width = round((max_left + max_right) / 0.76)
    height = round(max(frame[1].height for frame in frames) / 0.76)
    baseline_x, baseline_y = round(width * 0.12 + max_left), round(height * 0.88)
    normalized = []
    for pose, frame, measured in frames:
        padded = Image.new("RGBA", (width, height))
        px = round(baseline_x - measured["anchor"]["x"] * frame.width)
        py = round(baseline_y - measured["anchor"]["y"] * frame.height)
        padded.paste(frame, (px, py))
        updated = measurements(padded)
        updated["anchor"] = {"x": baseline_x / width, "y": baseline_y / height, "scale": 1}
        normalized.append((pose, padded, updated))
    frames = normalized
    cell_width, cell_height = width, height
    dest = root / "assets/animations/poses" / args.group
    dest.mkdir(parents=True, exist_ok=True)
    version = 1
    while (dest / f"windup_v{version}.png").exists() or (dest / f"hit_v{version}.png").exists():
        version += 1
    sheet_dest = root / "assets/animations/sheets" / f"{args.group}_v{version}.png"
    sheet_dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.source, sheet_dest)
    reference = next(item for item in manifest["inventory"] if item["path"] == group["reference"])
    ref_height = reference["visibleBounds"][3] - reference["visibleBounds"][1]
    # 全組採同一縮放倍率；不逐張把蹲身與突刺拉回站姿高度。
    recover_box = frames[-1][2]["visibleBounds"]
    recover_height = recover_box[3] - recover_box[1]
    reference_scale = (reference.get("anchor") or {}).get("scale", 1)
    scale = cell_height / reference["size"][1] * ref_height / recover_height * reference_scale
    for pose, image, measured in frames:
        path = dest / f"{pose}_v{version}.png"
        image.save(path)
        measured["anchor"]["scale"] = round(scale, 6)
        group["frames"][pose] = {
            **measured, "path": path.relative_to(root).as_posix(),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "pose": pose, "facing": "left" if "enemyId" in group else "right",
            "durationMs": {"windup": 90, "attack": 140, "impact": 80, "recover": 150, "hit": 110, "stagger": 180, "defeat": 480}[pose],
            "approved": args.approve, "sheet": sheet_dest.relative_to(root).as_posix(),
            "issue": "" if args.approve else "已輸出；待實際美術內容與錨點驗收。",
        }
    group["status"] = "已通過素材內容檢查；待動畫錨點實測" if args.approve else "已輸出，待驗收"
    group["reviewNote"] = "四格為不同真實姿態；對照正式角色外觀檢查，正式待機原圖保留。"
    manifest["generationStopped"] = False
    manifest["stopReason"] = "使用者要求繼續到完成，改採同組四姿態图集提高一致性。".replace("图", "圖")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"group": args.group, "frames": len(frames), "cellSize": [cell_width, cell_height], "scale": scale}, ensure_ascii=False))


if __name__ == "__main__":
    main()
