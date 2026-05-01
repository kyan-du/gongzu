#!/usr/bin/env python3
"""Regression tests for GongZu geometry authoring tools."""

import json
import os
import subprocess
import sys
from importlib.machinery import SourceFileLoader
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
engine_mod = SourceFileLoader("geometry_engine", str(SCRIPT_DIR / "geometry-engine.py")).load_module()


def load_example(name):
    with open(SCRIPT_DIR / "geometry-examples" / name, encoding="utf-8") as f:
        return json.load(f)


def assert_ok(result, name):
    assert not result.get("error"), f"{name} failed: {result.get('errors')}"
    geometry = result.get("geometry")
    assert geometry, f"{name} did not return geometry"
    assert geometry.get("points"), f"{name} did not return points"
    assert geometry.get("segments"), f"{name} did not return segments"


def test_angle_bisector():
    data = load_example("angle-bisector.input.json")
    result = engine_mod.process(data)
    assert_ok(result, "angle-bisector")
    points = result["geometry"]["points"]
    assert set(["A", "B", "C", "D"]).issubset(points.keys())
    assert len(result["geometry"]["angleLabels"]) == 2
    assert len(result["geometry"]["equalMarks"]) == 2


def test_right_triangle_altitude():
    data = load_example("right-triangle.input.json")
    result = engine_mod.process(data)
    assert_ok(result, "right-triangle")
    points = result["geometry"]["points"]
    assert set(["A", "B", "C", "D"]).issubset(points.keys())
    assert len(result["geometry"]["angles"]) == 2


def test_invalid_check_fails():
    data = load_example("angle-bisector.input.json")
    data["checks"].append({
        "check": "angle_equals",
        "vertex": "A",
        "ray1": "B",
        "ray2": "C",
        "degrees": 120,
    })
    result = engine_mod.process(data)
    assert result.get("error") is True
    assert result.get("errors"), "invalid check should report errors"


def test_postprocess_replaces_geometry_input():
    source = SCRIPT_DIR / "geometry-examples" / "geometry-quiz.input.json"
    proc = subprocess.run(
        [sys.executable, str(SCRIPT_DIR / "geometry-postprocess.py"), str(source)],
        check=True,
        capture_output=True,
        text=True,
    )
    quiz = json.loads(proc.stdout)
    assert len(quiz["questions"]) == 2
    for question in quiz["questions"]:
        content = question["content"]
        assert "geometry" in content
        assert "geometry_input" not in content
        assert content["geometry"].get("points")


def run_all():
    tests = [
        test_angle_bisector,
        test_right_triangle_altitude,
        test_invalid_check_fails,
        test_postprocess_replaces_geometry_input,
    ]
    for test in tests:
        test()
        print(f"✓ {test.__name__}")
    print(f"All {len(tests)} geometry tests passed.")


if __name__ == "__main__":
    run_all()
