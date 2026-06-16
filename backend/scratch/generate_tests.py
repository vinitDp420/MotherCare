import json
import uuid

tests_data = [
    ("Complete Blood Count", "CBC", "Hematology", "12.0 - 16.0", "g/dL", 300.00, 12),
    ("Blood Grouping & Rh Typing", "BG_RH", "Hematology", "N/A", "", 150.00, 4),
    ("Oral Glucose Tolerance Test (75g)", "OGTT", "Biochemistry", "< 140", "mg/dL", 450.00, 24),
    ("Glucose Challenge Test (50g)", "GCT", "Biochemistry", "< 140", "mg/dL", 350.00, 12),
    ("Urine Routine & Microscopy", "URINE_RM", "Urinalysis", "Negative", "", 150.00, 8),
    ("Rubella Antibody IgG", "RUBELLA_IGG", "Serology", "> 10 (Immuned)", "IU/mL", 600.00, 24),
    ("HIV I & II Antibodies Screen", "HIV_SCR", "Serology", "Non-Reactive", "", 400.00, 24),
    ("HBsAg Screen (Hep B)", "HBSAG", "Serology", "Non-Reactive", "", 350.00, 24),
    ("VDRL / Syphilis Screen", "VDRL", "Serology", "Non-Reactive", "", 250.00, 24),
    ("Thyroid Stimulating Hormone", "TSH", "Endocrinology", "0.4 - 4.0", "uIU/mL", 500.00, 24),
    ("Glycated Hemoglobin", "HBA1C", "Biochemistry", "4.0 - 5.6", "%", 450.00, 24),
    ("Serum Iron Level", "SERUM_IRON", "Biochemistry", "50 - 170", "ug/dL", 400.00, 24),
    ("Serum Ferritin Level", "FERRITIN", "Biochemistry", "15 - 150", "ng/mL", 600.00, 24),
    ("Serum Calcium Level", "CALCIUM", "Biochemistry", "8.5 - 10.2", "mg/dL", 250.00, 12),
    ("25-Hydroxy Vitamin D", "VIT_D", "Endocrinology", "30 - 100", "ng/mL", 1200.00, 48),
    ("Serum Albumin", "ALBUMIN", "Biochemistry", "3.5 - 5.0", "g/dL", 200.00, 12),
    ("Serum Creatinine", "CREATININE", "Biochemistry", "0.5 - 1.1", "mg/dL", 250.00, 12),
    ("Liver Function Test", "LFT", "Biochemistry", "N/A", "", 650.00, 24),
    ("Renal Function Test", "RFT", "Biochemistry", "N/A", "", 550.00, 24),
    ("Beta hCG Quantitative", "BETA_HCG", "Endocrinology", "N/A", "mIU/mL", 750.00, 12),
    ("Obstetric Ultrasound Scan", "OB_USG", "Radiology", "N/A", "", 1500.00, 4),
    ("Anomaly Ultrasound Scan", "ANOMALY_USG", "Radiology", "N/A", "", 2500.00, 24),
    ("Papanicolaou Test (Pap Smear)", "PAP_SMEAR", "Pathology", "Normal", "", 800.00, 72),
    ("Free Thyroxine (FT4)", "FT4", "Endocrinology", "0.8 - 1.8", "ng/dL", 450.00, 24),
    ("Toxoplasmosis IgG Antibody", "TOXO_IGG", "Serology", "Negative", "", 500.00, 24),
    ("Cytomegalovirus IgG Antibody", "CMV_IGG", "Serology", "Negative", "", 500.00, 24),
    ("G6PD Enzyme Activity", "G6PD", "Biochemistry", "4.6 - 13.5", "U/g Hb", 800.00, 48),
    ("Indirect Coomb's Test", "COOMBS_INDIRECT", "Hematology", "Negative", "", 450.00, 24),
    ("Platelet Count check", "PLATELETS", "Hematology", "150 - 450", "10^3/uL", 200.00, 8),
    ("Prothrombin Time & INR", "PT_INR", "Hematology", "0.8 - 1.2", "INR", 400.00, 12),
    ("Bleeding & Clotting Time", "BT_CT", "Hematology", "BT: 2-7, CT: 5-11", "mins", 200.00, 4)
]

fixture = []

# Fixed UUID namespace to ensure repeatable IDs for tests
namespace_uuid = uuid.UUID("d6a06653-ff5f-4d33-a3d5-1ab2e3a1f94c")

for name, code, category, normal_range, unit, price, turnaround in tests_data:
    # Deterministic UUID based on test code
    pk = str(uuid.uuid5(namespace_uuid, code))
    fixture.append({
        "model": "laboratory.testmaster",
        "pk": pk,
        "fields": {
            "name": name,
            "code": code,
            "category": category,
            "normal_range": normal_range,
            "unit": unit,
            "price": f"{price:.2f}",
            "turnaround_hours": turnaround,
            "is_active": True,
            "created_at": "2026-06-16T00:00:00Z",
            "updated_at": "2026-06-16T00:00:00Z"
        }
    })

import os
os.makedirs("apps/laboratory/fixtures", exist_ok=True)
with open("apps/laboratory/fixtures/test_master.json", "w") as f:
    json.dump(fixture, f, indent=2)

print(f"Generated {len(fixture)} test master records.")
