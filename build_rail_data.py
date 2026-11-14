#!/usr/bin/env python3
"""Regenerate ForgeSail rail data files from one curated source of truth."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# id -> (base_mm, head_mm, height_mm, mass_kg_m)
DIMENSIONS = {
    # Chinese crane rails and light/heavy rails
    "qu70": (120.0, 70.0, 120.0, 52.8),
    "qu80": (130.0, 80.0, 130.0, 63.69),
    "qu100": (150.0, 100.0, 150.0, 89.0),
    "qu120": (170.0, 120.0, 170.0, 118.2),
    "gb-t-11264-6kg": (50.8, 25.4, 50.8, 5.98),
    "gb-t-11264-8kg": (54.0, 25.0, 65.0, 8.42),
    "gb-t-11264-9kg": (63.5, 32.1, 63.5, 8.94),
    "gb-t-11264-12kg": (69.85, 38.1, 69.85, 12.2),
    "gb-t-11264-15kg": (79.37, 42.86, 79.37, 15.2),
    "gb-t-11264-22kg": (93.66, 50.8, 93.66, 22.3),
    "gb-t-11264-24kg": (92.0, 51.0, 107.0, 24.53),
    "gb-t-11264-30kg": (107.95, 60.33, 107.95, 30.1),
    "gb-t-2585-38kg": (114.0, 68.0, 134.0, 38.73),
    "gb-t-2585-43kg": (114.0, 70.0, 140.0, 44.65),
    "gb-t-2585-75kg": (150.0, 75.0, 192.0, 74.6),
    "p50": (132.0, 70.0, 152.0, 51.51),
    "p60": (150.0, 73.0, 176.0, 60.6),
    # DIN
    "a45": (125.0, 45.0, 55.0, 22.1),
    "a55": (150.0, 55.0, 65.0, 31.8),
    "a65": (175.0, 65.0, 75.0, 43.1),
    "a75": (200.0, 75.0, 85.0, 56.2),
    "a100": (200.0, 100.0, 95.0, 74.3),
    "a120": (220.0, 120.0, 105.0, 100.0),
    "a150": (220.0, 150.0, 150.0, 150.3),
    "din-s10": (58.0, 32.0, 70.0, 10.0),
    "din-s14": (70.0, 38.0, 80.0, 14.0),
    "din-s18": (82.0, 43.0, 93.0, 18.3),
    "din-s20": (82.0, 44.0, 100.0, 19.8),
    "din-s30": (108.0, 60.3, 108.0, 30.03),
    "din-s33": (105.0, 58.0, 134.0, 33.47),
    "din-s41-r10": (125.0, 67.0, 138.0, 41.4),
    "din-s41-r14": (125.0, 67.0, 138.0, 40.95),
    "din-s49": (125.0, 67.0, 149.0, 49.43),
    "din-s49t-49e2": (125.0, 67.0, 149.0, 49.43),
    "din-549b-49e3": (125.0, 67.0, 146.0, 47.86),
    "din-s54": (125.0, 67.0, 154.0, 54.5),
    "din-s64": (150.0, 73.9, 172.0, 64.9),
    # GOST
    "gost-kp70": (120.0, 70.0, 120.0, 46.1),
    "gost-kp80": (130.0, 80.0, 130.0, 59.81),
    "gost-kp100": (150.0, 100.0, 150.0, 83.09),
    "gost-kp120": (170.0, 120.0, 170.0, 113.47),
    "gost-kp140": (170.0, 140.0, 170.0, 141.7),
    "gost-p50": (132.0, 72.0, 152.0, 51.8),
    "gost-p65": (150.0, 75.0, 180.0, 64.88),
    # JIS and British crane rails
    "cr-73-kg": (140.0, 100.0, 135.0, 73.3),
    "cr-100-kg": (155.0, 120.0, 150.0, 100.2),
    "jis-12kg": (69.85, 38.1, 69.85, 12.2),
    "jis-15kg": (79.37, 42.86, 79.37, 15.2),
    "jis-22kg": (93.66, 50.8, 93.66, 22.3),
    "jis-30a": (107.95, 60.33, 107.95, 30.1),
    "jis-37a": (122.24, 62.71, 122.24, 37.2),
    "jis-40n": (122.0, 64.0, 140.0, 40.9),
    "jis-50kg": (127.0, 67.87, 144.46, 50.4),
    "jis-50n": (127.0, 65.0, 153.0, 50.4),
    "jis-60kg": (145.0, 65.0, 174.0, 60.8),
    # British
    "bs11-13br": (92.0, 37.7, 48.0, 13.3),
    "bs11-16br": (108.0, 44.9, 54.0, 16.0),
    "bs11-20br": (127.0, 50.8, 55.5, 19.9),
    "bs11-28br": (152.0, 50.75, 67.0, 28.6),
    "bs11-35br": (160.0, 58.8, 76.0, 35.4),
    "bs11-39e1-bs80a": (117.5, 63.5, 133.3, 39.8),
    "bs11-50br": (165.0, 59.27, 76.0, 50.2),
    "bs11-55g1-35gp": (141.5, 111.82, 152.5, 54.77),
    "bs11-75r": (122.2, 61.88, 128.6, 37.04),
    # UIC / EN
    "uic-50": (125.0, 70.0, 152.0, 50.46),
    "uic-54": (140.0, 70.0, 159.0, 54.77),
    "uic-54e": (125.0, 67.0, 161.0, 53.82),
    "uic-60": (150.0, 72.0, 172.0, 60.21),
    "uic-60e2": (150.0, 72.0, 172.0, 60.03),
    # AREMA / ASTM / ASCE
    "arema-90-araa": (130.2, 65.1, 142.9, 44.65),
    "arema-100-araa": (139.7, 69.85, 152.4, 49.9),
    "arema-100-arab": (130.57, 67.47, 143.27, 49.87),
    "arema-100-area": (136.53, 68.26, 152.4, 50.35),
    "arema-115-area": (139.7, 69.1, 168.3, 56.73),
    "arema-119-area": (139.7, 69.4, 173.0, 59.41),
    "arema-131-area": (152.4, 74.5, 180.0, 64.3),
    "arema-132-area-aus-66kg": (152.4, 75.3, 181.0, 66.0),
    "arema-133-area": (152.4, 76.2, 179.39, 66.29),
    "arema-136-area": (152.4, 74.6, 185.7, 67.4),
    "arema-140-area": (152.4, 76.2, 185.74, 69.2),
    "asce-12": (50.8, 25.4, 50.8, 5.95),
    "asce-20": (66.7, 34.1, 66.7, 9.92),
    "asce-25": (69.8, 38.1, 69.8, 12.4),
    "asce-30": (79.4, 42.9, 79.4, 15.2),
    "asce-40": (88.9, 47.6, 88.9, 19.9),
    "asce-50": (98.0, 54.0, 98.0, 25.0),
    "asce-60": (108.0, 60.0, 108.0, 29.8),
    "asce-70": (117.5, 62.0, 117.5, 34.5),
    "asce-75": (122.2, 62.7, 122.2, 37.2),
    "asce-80": (127.0, 64.0, 127.0, 39.8),
    "asce-85": (132.0, 65.0, 132.0, 42.3),
    "104-crmrs-51": (127.0, 63.5, 127.0, 51.7),
    "105-crmrs-52": (131.8, 65.1, 131.8, 52.2),
    "mrs67usa135cr": (132.0, 79.0, 146.0, 67.0),
    "mrs85usa171-cr": (152.4, 109.1, 152.4, 84.8),
    "175-crmrs87b": (152.0, 102.0, 152.0, 86.8),
    "mrs87apr85r": (152.0, 102.0, 152.0, 86.8),
    # Indian / IRS
    "iscr-50": (90.0, 51.2, 90.0, 29.8),
    "iscr-60": (105.0, 60.0, 105.0, 40.0),
    "iscr-80": (130.0, 82.0, 130.0, 64.4),
    "iscr-100": (150.0, 102.0, 150.0, 89.0),
    "iscr-120": (170.0, 120.0, 170.0, 118.5),
    "iscr-140": (170.0, 140.0, 170.0, 146.0),
    "irs-45kg": (136.5, 66.7, 142.9, 48.28),
    "irs-52-1kg": (122.2, 73.0, 125.4, 51.43),
    "irs-52-2kg": (122.2, 73.0, 125.4, 51.72),
    "irs-52kg-r52": (136.0, 67.0, 156.0, 51.68),
    # ISCOR
    "iscor-15": (76.2, 41.28, 76.2, 14.9),
    "iscor-22": (95.0, 50.0, 95.0, 22.37),
    "iscor-30": (110.0, 57.0, 110.0, 30.15),
    "iscor-40": (127.0, 63.5, 127.0, 40.31),
    "iscor-48": (127.0, 68.0, 150.0, 47.6),
    "iscor-57": (140.0, 70.0, 165.0, 57.4),
    "iscor-64": (190.0, 75.67, 85.0, 64.2),
    "iscor-88": (200.0, 100.86, 95.0, 88.1),
    "iscor-186": (225.0, 140.0, 150.0, 186.0),
    # Australia / BHP / Poland
    "as-15kg": (79.37, 42.86, 79.37, 15.2),
    "as-41kg": (127.0, 63.5, 136.5, 40.8),
    "bhp-22kg": (93.66, 50.8, 93.66, 22.3),
    "pn-sp120": (170.0, 129.0, 170.0, 113.0),
    # ARBED / MRS
    "as-86": (150.0, 101.6, 152.5, 85.86),
    "rg-29": (150.0, 49.0, 65.0, 28.97),
    "mrs-51": (127.0, 63.5, 127.0, 51.6),
    "mrs-52": (131.8, 65.1, 131.8, 52.1),
    "mrs-67": (132.0, 79.0, 146.0, 67.0),
    "mrs-73": (146.0, 69.9, 157.0, 73.6),
    "mrs-85": (152.4, 102.9, 152.4, 84.8),
    "mrs-86": (165.0, 102.0, 102.0, 85.5),
    "mrs-87a": (152.0, 102.0, 152.0, 86.8),
    "mrs-87b": (152.0, 102.0, 152.0, 86.8),
    "mr-77-no-5a": (200.0, 100.0, 100.0, 77.0),
    "mrs-125": (180.0, 120.0, 180.0, 125.0),
    "mrs-140": (220.0, 120.0, 150.0, 140.0),
    "mr-151": (220.0, 150.0, 150.0, 150.3),
    "mrs-221": (220.0, 220.0, 160.0, 221.4),
}

# Grade reference data. Values are typical published ranges, not mill
# certificates. Keep them conservative and clearly marked as reference.
GRADES = {
    "u71mn": {
        "label": "U71Mn (China)",
        "standard": "GB/T 2585",
        "kind": "Heavy rail, hot-rolled",
        "tensile_mpa": 880,
        "hardness_hb": "260-300",
        "elongation_pct": 10,
        "composition": {"C": "0.60-0.80", "Si": "0.15-0.58", "Mn": "0.70-1.20", "P": "≤0.025", "S": "≤0.025", "Cr": "≤0.15"},
        "equivalent": {"CN": "U71Mn", "EU": "R260 (EN 13674-1)", "US": "AREMA intermediate, non-heat-treated"},
    },
    "u75v": {
        "label": "U75V (China)",
        "standard": "GB/T 2585",
        "kind": "Heavy rail, hot-rolled",
        "tensile_mpa": 980,
        "hardness_hb": "280-320",
        "elongation_pct": 10,
        "composition": {"C": "0.71-0.80", "Si": "0.50-0.80", "Mn": "0.75-1.05", "P": "≤0.025", "S": "≤0.025", "V": "0.04-0.12"},
        "equivalent": {"CN": "U75V", "EU": "R320Cr (EN 13674-1)", "US": "AREMA intermediate / Cr-alloy"},
    },
    "u76crre": {
        "label": "U76CrRE (China)",
        "standard": "GB/T 2585",
        "kind": "Heavy rail, Cr-RE alloyed",
        "tensile_mpa": 1080,
        "hardness_hb": "300-350",
        "elongation_pct": 9,
        "composition": {"C": "0.71-0.81", "Si": "0.50-0.80", "Mn": "0.80-1.10", "P": "≤0.025", "S": "≤0.025", "Cr": "0.25-0.40"},
        "equivalent": {"CN": "U76CrRE", "EU": "R320Cr (EN 13674-1)", "US": "AREMA premium / Cr-alloy"},
    },
    "u78crv": {
        "label": "U78CrV (China)",
        "standard": "GB/T 2585",
        "kind": "Heavy rail, hot-rolled",
        "tensile_mpa": 1180,
        "hardness_hb": "330-380",
        "elongation_pct": 8,
        "composition": {"C": "0.72-0.82", "Si": "0.50-0.80", "Mn": "0.80-1.10", "P": "≤0.025", "S": "≤0.025", "Cr": "0.30-0.50", "V": "0.04-0.12"},
        "equivalent": {"CN": "U78CrV", "EU": "R400HT (EN 13674-1)", "US": "AREMA premium / head-hardened"},
    },
    "55q": {
        "label": "55Q (China light rail)",
        "standard": "GB/T 11264",
        "kind": "Light rail, hot-rolled",
        "tensile_mpa": 685,
        "hardness_hb": "197-255",
        "elongation_pct": 10,
        "composition": {"C": "0.50-0.60", "Si": "0.15-0.35", "Mn": "0.60-0.90", "P": "≤0.040", "S": "≤0.040"},
        "equivalent": {"CN": "55Q", "EU": "700/900A (mining rail grades)", "US": "AREMA 700 (mining light rail)"},
    },
    "900a": {
        "label": "900A",
        "standard": "EN 13674 / UIC 860",
        "kind": "Heavy rail, hot-rolled",
        "tensile_mpa": 880,
        "hardness_hb": "260-300",
        "elongation_pct": 10,
        "composition": {"C": "0.60-0.80", "Si": "0.10-0.50", "Mn": "0.80-1.30", "P": "≤0.040", "S": "≤0.040"},
        "equivalent": {"CN": "U71Mn", "EU": "900A / R260", "US": "AREMA intermediate"},
    },
    "r260": {
        "label": "R260 (EN)",
        "standard": "EN 13674-1",
        "kind": "Heavy rail, hot-rolled",
        "tensile_mpa": 880,
        "hardness_hb": "260-300",
        "elongation_pct": 10,
        "composition": {"C": "0.60-0.80", "Si": "0.15-0.58", "Mn": "0.70-1.25", "P": "≤0.025", "S": "≤0.025"},
        "equivalent": {"CN": "U71Mn", "EU": "R260", "US": "AREMA intermediate"},
    },
    "r320cr": {
        "label": "R320Cr (EN Cr-alloy)",
        "standard": "EN 13674-1",
        "kind": "Heavy rail, Cr-alloyed",
        "tensile_mpa": 1080,
        "hardness_hb": "320-360",
        "elongation_pct": 9,
        "composition": {"C": "0.60-0.80", "Si": "0.50-1.10", "Mn": "0.80-1.20", "P": "≤0.020", "S": "≤0.025", "Cr": "0.80-1.20"},
        "equivalent": {"CN": "U75V / U76CrRE", "EU": "R320Cr", "US": "AREMA premium / Cr-alloy"},
    },
    "r350ht": {
        "label": "R350HT (EN head-hardened)",
        "standard": "EN 13674-1",
        "kind": "Heavy rail, head-hardened",
        "tensile_mpa": 1175,
        "hardness_hb": "350-390",
        "elongation_pct": 9,
        "composition": {"C": "0.72-0.80", "Si": "0.15-0.58", "Mn": "0.70-1.25", "P": "≤0.020", "S": "≤0.025"},
        "equivalent": {"CN": "U75V", "EU": "R350HT", "US": "AREMA premium / head-hardened"},
    },
    "r400ht": {
        "label": "R400HT (EN head-hardened)",
        "standard": "EN 13674-1",
        "kind": "Heavy rail, ultra-high strength",
        "tensile_mpa": 1280,
        "hardness_hb": "400-440",
        "elongation_pct": 9,
        "composition": {"C": "0.90-1.05", "Si": "0.20-0.60", "Mn": "0.80-1.30", "P": "≤0.020", "S": "≤0.025", "Cr": "≤0.30"},
        "equivalent": {"CN": "U78CrV", "EU": "R400HT", "US": "AREMA premium / head-hardened"},
    },
}

# id -> material keys available for that profile family.
RAIL_GRADES = {
    "gb-t-11264-6kg": ["55q", "900a"],
    "gb-t-11264-8kg": ["55q", "900a"],
    "gb-t-11264-9kg": ["55q", "900a"],
    "gb-t-11264-12kg": ["55q", "900a"],
    "gb-t-11264-15kg": ["55q", "900a"],
    "gb-t-11264-22kg": ["55q", "900a"],
    "gb-t-11264-24kg": ["55q", "900a"],
    "gb-t-11264-30kg": ["55q", "900a"],
    "gb-t-2585-38kg": ["u71mn", "u75v"],
    "gb-t-2585-43kg": ["u71mn", "u75v"],
    "gb-t-2585-75kg": ["u71mn", "u75v", "u76crre", "u78crv"],
    "p50": ["u71mn", "u75v"],
    "p60": ["u71mn", "u75v", "u76crre", "u78crv"],
    "qu70": ["u71mn", "900a"],
    "qu80": ["u71mn", "900a"],
    "qu100": ["u71mn", "u75v", "u76crre"],
    "qu120": ["u71mn", "u75v", "u76crre"],
}

GRADE_FALLBACK = {
    "AREMA / ASTM / ASCE": ["900a", "r260", "r320cr", "r350ht"],
    "UIC / EN": ["900a", "r260", "r320cr", "r350ht"],
    "DIN": ["900a", "r260", "r320cr", "r350ht"],
    "GOST": ["u71mn", "u75v", "u76crre"],
    "JIS": ["900a", "r260", "r320cr", "r350ht"],
    "BS": ["900a", "r260"],
    "IRS / IS 3443": ["u71mn", "u75v", "u76crre"],
    "ISCOR": ["900a", "r260"],
    "ARBED / MRS": ["900a", "r260", "r320cr", "r350ht"],
    "AS / BHP": ["900a", "r260"],
    "PN": ["900a", "r260"],
    "GB / YB": ["u71mn", "u75v", "u76crre"],
}

# Approximate Chinese domestic replacement, where a direct profile match is
# commonly accepted. This is a starting point for quotation, not a design.
REPLACEMENTS = {
    "gost-kp70": "QU70 (YB/T 5055)",
    "gost-kp80": "QU80 (YB/T 5055)",
    "gost-kp100": "QU100 (YB/T 5055)",
    "gost-kp120": "QU120 (YB/T 5055)",
    "iscr-80": "QU70 (YB/T 5055)",
    "iscr-100": "QU100 (YB/T 5055)",
    "iscr-120": "QU120 (YB/T 5055)",
    "uic-60": "P60 (GB/T 2585)",
    "uic-60e2": "P60 (GB/T 2585)",
    "uic-54": "P50 (GB/T 2585), verify head width",
    "gost-p65": "P60 (GB/T 2585), verify profile",
    "jis-50n": "P50 (GB/T 2585), verify profile",
    "jis-60kg": "P60 (GB/T 2585), verify profile",
    "a65": "QU70 (YB/T 5055), verify profile",
    "a100": "QU100 (YB/T 5055), verify profile",
    "a120": "QU120 (YB/T 5055), verify profile",
}

QUALITY_NOTES = {
    "iscor-186": "Mass is the nominal kg/m implied by the 186 designation; confirm with ForgeSail before order.",
}


def load_records():
    with (ROOT / "data" / "rails.json").open(encoding="utf-8") as fh:
        return json.load(fh)["records"]


def build():
    records = load_records()
    missing = [r["id"] for r in records if r["id"] not in DIMENSIONS]
    if missing:
        raise SystemExit(f"Missing dimensions for: {missing}")

    for record in records:
        base, head, height, mass = DIMENSIONS[record["id"]]
        record["base_mm"] = base
        record["head_mm"] = head
        record["height_mm"] = height
        record["mass_kg_m"] = mass
        record["has_dimensions"] = True
        grades = RAIL_GRADES.get(record["id"]) or GRADE_FALLBACK.get(record["category"], [])
        record["materials"] = grades
        replacement = REPLACEMENTS.get(record["id"])
        record["cn_replacement"] = replacement
        record["cn_replacement_note"] = (
            "Approximate domestic substitute. Confirm profile and fastening before order."
            if replacement else None
        )
        record["data_quality"] = "drawing_nominal" if record["id"] in QUALITY_NOTES else "curated"
        record["data_note"] = QUALITY_NOTES.get(record["id"])

    meta = {
        "name": "ForgeSail Rail Selector",
        "description": (
            "Curated dimensional, material and drawing reference for industrial "
            "crane and specialty rail profiles supplied by ForgeSail."
        ),
        "source_page": "https://forgesail.com/products/rails/",
        "updated": "2026-11-14",
        "unit_system": "metric_mm_kg_m",
        "record_count": len(records),
        "dimensioned_count": len(records),
        "disclaimer": (
            "Dimensions and material data are reference values compiled from the "
            "ForgeSail product page and public standards. Always verify against the "
            "governing standard and the manufacturer drawing before engineering use."
        ),
    }

    payload = {**meta, "records": records}
    (ROOT / "data" / "rails.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (ROOT / "data" / "rails.js").write_text(
        "window.RAIL_DATA = " + json.dumps(payload, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    (ROOT / "data" / "materials.js").write_text(
        "window.RAIL_MATERIALS = " + json.dumps({"grades": GRADES}, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )

    fields = [
        "id", "model", "standard", "category", "region", "base_mm", "head_mm",
        "height_mm", "mass_kg_m", "materials", "cn_replacement", "drawing_url",
        "product_url",
    ]
    with (ROOT / "data" / "rails.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for record in records:
            row = dict(record)
            row["materials"] = "|".join(record["materials"])
            writer.writerow(row)

    print(f"Wrote {len(records)} records; all {len(records)} have dimensions.")


if __name__ == "__main__":
    build()
