# GongZu Geometry Quiz Authoring

GongZu renders geometry diagrams with `src/components/questions/GeometryFigure.tsx`.
For generated geometry questions, do **not** hand-write point coordinates unless necessary.
Author the figure as construction constraints in `content.geometry_input`, then run the postprocessor to create the final `content.geometry` JSON used by the app.

## Why this exists

Geometry questions need two things to be reliable:

1. **A readable construction** — e.g. “isosceles triangle ABC, AD is angle bisector”.
2. **A verified diagram** — points, segments, angle marks, equal marks, and labels that render cleanly on mobile.

`geometry-engine.py` turns construction constraints into JSXGraph coordinates and validates important facts before the quiz is published.

## Authoring flow

```bash
# Build one engine input and inspect the resulting geometry spec
python3 scripts/geometry-engine.py scripts/geometry-examples/angle-bisector.input.json

# Convert a quiz payload containing content.geometry_input into final API-ready JSON
python3 scripts/geometry-postprocess.py scripts/geometry-examples/geometry-quiz.input.json > /tmp/geometry-quiz.ready.json

# Run regression checks for the geometry authoring tools
python3 scripts/geometry-engine.test.py
```

The postprocessor removes `content.geometry_input` and writes `content.geometry`.
Only the processed output should be sent to `/api/quiz`.

## Question shape

```json
{
  "type": "choice",
  "content": {
    "stem": "如图，在等腰三角形 ABC 中，AB = AC，∠A = 40°，求 ∠B。",
    "geometry_input": {
      "constructions": [
        {
          "type": "triangle",
          "vertices": ["A", "B", "C"],
          "spec": { "kind": "isosceles", "vertex": "A", "base": ["B", "C"], "angle": 40 }
        }
      ],
      "segments": [
        { "from": "A", "to": "B" },
        { "from": "A", "to": "C" },
        { "from": "B", "to": "C" }
      ],
      "angleLabels": [
        { "vertex": "A", "from": "B", "to": "C", "text": "40°" }
      ],
      "equalMarks": [["A", "B"], ["A", "C"]],
      "checks": [
        { "check": "angle_equals", "vertex": "A", "ray1": "B", "ray2": "C", "degrees": 40 },
        { "check": "lengths_equal", "pairs": [["A", "B"], ["A", "C"]] }
      ]
    }
  },
  "answer": { "correctIndex": 1 }
}
```

After postprocessing, the app sees:

```json
{
  "content": {
    "stem": "...",
    "geometry": {
      "points": { "A": [4, 7], "B": [2, 1], "C": [6, 1] },
      "segments": [ ... ],
      "angleLabels": [ ... ],
      "equalMarks": [ ... ],
      "labels": { ... }
    }
  }
}
```

## Construction types

Current supported constructions:

- `triangle`
  - `spec.kind = "isosceles"`
  - `spec.kind = "equilateral"`
  - `spec.kind = "right_angle"`
  - `spec.kind = "general"`
- `midpoint`
- `foot`
- `angle_bisector`
- `on_segment`
- `parallel`
- `perpendicular`
- `intersection`
- `reflection`
- `rotation`

See `geometry-engine.py` docstring and `scripts/geometry-examples/` for exact fields.

## Validation checks

Use checks aggressively. If a generated question states a geometric fact, encode it as a check:

- `angle_equals`
- `length_equals`
- `lengths_equal`
- `perpendicular`
- `collinear`
- `on_segment`

This prevents publishing diagrams that visually contradict the stem or explanation.

## Design rules for good student questions

- Prefer one clear target per question: angle chasing, midpoint, perpendicular, symmetry, or area relation.
- Keep the figure uncluttered on mobile: 3–6 named points is usually enough.
- Mark only the facts needed for solving, not every possible fact.
- Use `angleLabels`, `equalMarks`, `angles`, and `sideLabels` to make conditions visible.
- Use `proof` type for handwritten reasoning questions; use `choice` / `blank` for fast practice.
- For proof questions, include `content.hint` with one strategic hint, not the full proof.

## Safety

Do not keep production API keys or student-specific generated payloads in this directory.
Use `tmp/` for local scratch data; it is ignored by git.
