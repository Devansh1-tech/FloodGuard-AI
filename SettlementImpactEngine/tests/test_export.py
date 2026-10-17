"""
test_export.py — Multi-Format Exporters Unit Tests
==================================================
"""

from pathlib import Path
import json
import pandas as pd
from SettlementImpactEngine.export.vector_exporter import VectorExporter
from SettlementImpactEngine.export.tabular_exporter import TabularExporter
from SettlementImpactEngine.export.report_exporter import ReportExporter


def test_vector_exporter(sample_config, sample_bundle):
    exporter = VectorExporter(sample_config)
    geojson_path = exporter.export_geojson(sample_bundle["admin"], "TestAdmin.geojson")

    assert Path(geojson_path).exists()
    assert Path(geojson_path).stat().st_size > 0


def test_tabular_exporter(sample_config):
    exporter = TabularExporter(sample_config)
    df = pd.DataFrame([{"id": 1, "name": "Facility A", "status": "Flooded"}])
    csv_path = exporter.export_dataframe(df, "TestTable.csv")

    assert Path(csv_path).exists()
    assert Path(csv_path).stat().st_size > 0


def test_report_exporter(sample_config):
    exporter = ReportExporter(sample_config)
    payload = {"status": "success", "affected_count": 42}
    json_path = exporter.export_json(payload, "TestReport.json")

    assert Path(json_path).exists()
    with open(json_path, "r", encoding="utf-8") as f:
        loaded = json.load(f)
    assert loaded["affected_count"] == 42
