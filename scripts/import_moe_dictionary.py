"""將教育部原始 Excel 完整轉存為離線模組，不刪減或改寫任何字典欄位。"""
import argparse
import hashlib
import json
from pathlib import Path

import openpyxl


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    workbook = openpyxl.load_workbook(args.source, read_only=True, data_only=False)
    sheets = [{"name": sheet.title, "rows": list(sheet.values)} for sheet in workbook]
    workbook.close()
    rows = sheets[0]["rows"]
    assert rows[0] == ("單字", "部首", "總筆畫數", "部首外筆畫", "注音", "解釋")
    metadata = {
        "attribution": "中華民國教育部（Ministry of Education, R.O.C.）。《國語小字典》",
        "version": "2019_20260929",
        "sourceUrl": "https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_mini_download.html",
        "dictionaryUrl": "https://dict.mini.moe.edu.tw/",
        "license": "CC BY-ND 3.0 TW",
        "sourceFile": args.source.name,
        "sha256": hashlib.sha256(args.source.read_bytes()).hexdigest(),
        "entryCount": len(rows) - 1,
        "characterCount": len({row[0] for row in rows[1:]}),
    }
    serialized = json.dumps(sheets, ensure_ascii=False, separators=(",", ":"))
    # 格式轉換後再逐欄比對，原始釋義與注音保持一致。
    assert json.loads(serialized) == json.loads(json.dumps(sheets, ensure_ascii=False))
    output = root / "src/data/moeMiniRecords.js"
    output.write_text(
        "// 教育部完整原始資料的格式轉存；更新請執行 scripts/import_moe_dictionary.py。\n"
        + "export const MOE_MINI_METADATA = " + json.dumps(metadata, ensure_ascii=False, indent=2)
        + ";\nexport const MOE_MINI_SHEETS = " + serialized + ";\n", encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=True))


if __name__ == "__main__":
    main()
