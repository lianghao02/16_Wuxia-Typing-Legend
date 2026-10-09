"""驗證方案 B 素材的檔案、透明內容與原圖保留；不代替人工美術驗收。"""

import hashlib
import json
from pathlib import Path

from PIL import Image


def inspect(path):
    with Image.open(path) as image:
        image.load()
        if image.mode != "RGBA":
            raise ValueError(f"素材必須為 RGBA：{path.name}")
        alpha = image.getchannel("A")
        visible = alpha.point(lambda value: 255 if value >= 128 else 0).getbbox()
        if not visible or alpha.getextrema()[0] != 0:
            raise ValueError(f"素材缺少可見內容或真正透明像素：{path.name}")
        return {
            "size": list(image.size),
            "mode": image.mode,
            "alpha": list(alpha.getextrema()),
            "alphaBounds": list(alpha.getbbox()),
            "visibleBounds": list(visible),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }


def main():
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / "assets/animations/manifest.json").read_text(encoding="utf-8"))
    errors = []
    checked = 0
    for item in manifest["inventory"]:
        try:
            actual = inspect(root / item["path"])
            if actual["sha256"] != item["sha256"]:
                errors.append(f"既有素材原檔已變更：{item['path']}")
            if actual["size"] != item["size"] or actual["visibleBounds"] != item["visibleBounds"]:
                errors.append(f"既有素材尺寸或可見邊界記錄不符：{item['path']}")
            checked += 1
        except (OSError, ValueError) as error:
            errors.append(str(error))
    for item in manifest.get("archivedCandidates", []):
        try:
            actual = inspect(root / item["path"])
            if actual["sha256"] != item["sha256"]:
                errors.append(f"保留候選圖雜湊不符：{item['path']}")
            checked += 1
        except (OSError, ValueError) as error:
            errors.append(str(error))
    missing = []
    unapproved = []
    for group in manifest["groups"]:
        if not (root / group["reference"]).is_file():
            errors.append(f"缺少正式參考圖：{group['reference']}")
        for pose in group["required"]:
            if pose not in group["frames"]:
                missing.append(f"{group['id']}/{pose}")
        for pose, frame in group["frames"].items():
            try:
                actual = inspect(root / frame["path"])
                if actual["sha256"] != frame["sha256"]:
                    errors.append(f"新姿態雜湊不符：{frame['path']}")
                if actual["visibleBounds"] != frame["visibleBounds"]:
                    errors.append(f"新姿態可見邊界不符：{frame['path']}")
                if not frame.get("approved"):
                    unapproved.append(f"{group['id']}/{pose}")
                else:
                    anchor = frame.get("anchor", {})
                    if not all(0 <= anchor.get(axis, -1) <= 1 for axis in ("x", "y")):
                        errors.append(f"已驗收姿態缺少有效錨點：{frame['path']}")
                checked += 1
            except (OSError, ValueError) as error:
                errors.append(str(error))
    if manifest["phaseAApproved"] and (missing or unapproved):
        errors.append("Phase A 標記通過，但仍有缺少或未驗收的必要姿態。")
    print(json.dumps({
        "checkedFiles": checked,
        "fileValidationPassed": not errors,
        "errors": errors,
        "missingRequiredFrames": missing,
        "unapprovedFrames": unapproved,
        "phaseAApproved": manifest["phaseAApproved"],
        "note": "檔案驗證通過不代表美術、來源授權、錨點或動作連續性已通過。",
    }, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
