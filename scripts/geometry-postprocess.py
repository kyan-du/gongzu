#!/usr/bin/env python3
"""
Post-process geometry quiz JSON:
  1. Read quiz JSON (with constructions instead of raw geometry)
  2. Run geometry-engine to compute exact coordinates
  3. Validate all constraints
  4. Output final quiz JSON ready for API

Usage:
  python3 geometry-postprocess.py input.json > output.json
  cat input.json | python3 geometry-postprocess.py > output.json
"""

import json
import sys
import os

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib.machinery import SourceFileLoader
engine_mod = SourceFileLoader("geometry_engine", 
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "geometry-engine.py")).load_module()


def process_question(question):
    """Process a single question: compute geometry from constructions."""
    content = question.get("content", {})
    geo_input = content.get("geometry_input")
    
    if not geo_input:
        # No geometry input, skip
        return question, None
    
    # Run engine
    result = engine_mod.process(geo_input)
    
    if result.get("error"):
        return question, result.get("errors", ["Unknown error"])
    
    # Replace geometry_input with computed geometry
    content["geometry"] = result["geometry"]
    del content["geometry_input"]
    question["content"] = content
    
    return question, None


def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)
    
    errors = []
    
    for i, q in enumerate(data.get("questions", [])):
        processed_q, q_errors = process_question(q)
        data["questions"][i] = processed_q
        if q_errors:
            errors.append({"question": i, "errors": q_errors})
    
    if errors:
        print(json.dumps({"error": True, "errors": errors}, ensure_ascii=False, indent=2), file=sys.stderr)
        # Still output the data (partial results may be useful)
        json.dump(data, sys.stdout, ensure_ascii=False)
        sys.exit(1)
    else:
        json.dump(data, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
