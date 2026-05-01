#!/usr/bin/env python3
"""
Geometry coordinate engine for GongZu.
Takes construction constraints (JSON) → computes exact coordinates → outputs geometry spec for JSXGraph.

Usage:
  echo '{"constructions": [...]}' | python3 geometry-engine.py
  python3 geometry-engine.py input.json

Construction types:
  - triangle: {type, vertices, spec} where spec is one of:
      - {kind: "isosceles", vertex, base, angle, sideLength?}
      - {kind: "equilateral", sideLength?}
      - {kind: "right_angle", rightAt, legs: [a, b]}
      - {kind: "general", angles: [A, B], sideBC?}
  - midpoint: {type: "midpoint", point, of: [P1, P2]}
  - foot_of_perpendicular: {type: "foot", point, from, to_line: [P1, P2]}
  - angle_bisector_point: {type: "angle_bisector", point, vertex, ray1, ray2, on_segment: [P1, P2]}
  - point_on_segment: {type: "on_segment", point, segment: [P1, P2], ratio}
  - parallel_point: {type: "parallel", point, through, parallel_to: [P1, P2], distance}
  - perpendicular_point: {type: "perpendicular", point, through, to_line: [P1, P2]}
  - intersection: {type: "intersection", point, line1: [P1, P2], line2: [P3, P4]}
  - reflection: {type: "reflection", point, of, over_line: [P1, P2]}
  - rotation: {type: "rotation", point, of, center, angle_deg}

Output: geometry JSON with points, segments, angles, angleLabels, equalMarks, labels
"""

import json
import math
import sys


def vec_sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def vec_add(a, b):
    return (a[0] + b[0], a[1] + b[1])

def vec_scale(v, s):
    return (v[0] * s, v[1] * s)

def vec_len(v):
    return math.sqrt(v[0]**2 + v[1]**2)

def vec_normalize(v):
    l = vec_len(v)
    if l < 1e-10:
        return (0, 0)
    return (v[0]/l, v[1]/l)

def vec_dot(a, b):
    return a[0]*b[0] + a[1]*b[1]

def vec_cross(a, b):
    return a[0]*b[1] - a[1]*b[0]

def vec_rotate(v, angle_rad):
    c, s = math.cos(angle_rad), math.sin(angle_rad)
    return (v[0]*c - v[1]*s, v[0]*s + v[1]*c)

def angle_between(v1, v2):
    """Angle between two vectors in radians [0, pi]."""
    d = vec_dot(v1, v2) / (vec_len(v1) * vec_len(v2))
    d = max(-1, min(1, d))
    return math.acos(d)

def line_intersection(p1, p2, p3, p4):
    """Intersection of line(p1,p2) and line(p3,p4)."""
    d1 = vec_sub(p2, p1)
    d2 = vec_sub(p4, p3)
    cross = vec_cross(d1, d2)
    if abs(cross) < 1e-10:
        return None  # parallel
    t = vec_cross(vec_sub(p3, p1), d2) / cross
    return vec_add(p1, vec_scale(d1, t))

def foot_of_perp(point, line_p1, line_p2):
    """Foot of perpendicular from point to line(p1, p2)."""
    d = vec_sub(line_p2, line_p1)
    t = vec_dot(vec_sub(point, line_p1), d) / vec_dot(d, d)
    return vec_add(line_p1, vec_scale(d, t))

def reflect_over_line(point, line_p1, line_p2):
    """Reflect point over line(p1, p2)."""
    foot = foot_of_perp(point, line_p1, line_p2)
    return vec_add(foot, vec_sub(foot, point))

def point_on_segment(p1, p2, ratio):
    """Point that divides segment p1-p2 in ratio t:(1-t) from p1."""
    return vec_add(p1, vec_scale(vec_sub(p2, p1), ratio))


class GeometryEngine:
    def __init__(self):
        self.points = {}  # name -> (x, y)
    
    def build(self, constructions):
        """Process a list of constructions in order."""
        for c in constructions:
            ctype = c["type"]
            handler = getattr(self, f"_build_{ctype}", None)
            if handler is None:
                raise ValueError(f"Unknown construction type: {ctype}")
            handler(c)
    
    def _build_triangle(self, c):
        vertices = c["vertices"]  # e.g. ["A", "B", "C"]
        spec = c["spec"]
        kind = spec["kind"]
        
        if kind == "isosceles":
            self._build_isosceles_triangle(vertices, spec)
        elif kind == "equilateral":
            self._build_equilateral_triangle(vertices, spec)
        elif kind == "right_angle":
            self._build_right_triangle(vertices, spec)
        elif kind == "general":
            self._build_general_triangle(vertices, spec)
        else:
            raise ValueError(f"Unknown triangle kind: {kind}")
    
    def _build_isosceles_triangle(self, vertices, spec):
        """Build isosceles triangle. vertex is the apex, base is [B, C]."""
        apex_name = spec["vertex"]  # which vertex has the unique angle
        base = spec.get("base", [v for v in vertices if v != apex_name])
        angle_deg = spec["angle"]  # angle at apex in degrees
        side_len = spec.get("sideLength", 6.0)
        
        # Place apex at top, base horizontal below
        half_angle = math.radians(angle_deg / 2)
        # Base length from side and angle
        base_half = side_len * math.sin(half_angle)
        height = side_len * math.cos(half_angle)
        
        # Center the figure around x=4
        cx = 4.0
        apex = (cx, 1.0 + height)
        b = (cx - base_half, 1.0)
        c = (cx + base_half, 1.0)
        
        self.points[apex_name] = apex
        self.points[base[0]] = b
        self.points[base[1]] = c
    
    def _build_equilateral_triangle(self, vertices, spec):
        side_len = spec.get("sideLength", 5.0)
        cx = spec.get("cx", 4.0)
        by = spec.get("baseY", 1.0)
        
        h = side_len * math.sqrt(3) / 2
        self.points[vertices[0]] = (cx, by + h)
        self.points[vertices[1]] = (cx - side_len/2, by)
        self.points[vertices[2]] = (cx + side_len/2, by)
    
    def _build_right_triangle(self, vertices, spec):
        """Right angle at rightAt, legs a and b."""
        right_at = spec["rightAt"]
        legs = spec["legs"]  # [a, b] lengths
        
        idx = vertices.index(right_at)
        others = [v for v in vertices if v != right_at]
        
        # Place right angle at origin area
        r = (1.5, 1.0)
        p1 = (1.5, 1.0 + legs[0])  # vertical leg
        p2 = (1.5 + legs[1], 1.0)  # horizontal leg
        
        self.points[right_at] = r
        self.points[others[0]] = p1
        self.points[others[1]] = p2
    
    def _build_general_triangle(self, vertices, spec):
        """General triangle with given angles at first two vertices and optional side BC."""
        angles = spec["angles"]  # [angle_A_deg, angle_B_deg]
        angle_A = math.radians(angles[0])
        angle_B = math.radians(angles[1])
        angle_C = math.pi - angle_A - angle_B
        
        side_bc = spec.get("sideBC", 5.0)
        
        # Place B at left, C at right on baseline
        B = (1.5, 1.0)
        C = (1.5 + side_bc, 1.0)
        
        # A is above
        # Using sine rule: AB/sin(C) = BC/sin(A)
        AB = side_bc * math.sin(angle_C) / math.sin(angle_A)
        A = (B[0] + AB * math.cos(angle_B), B[1] + AB * math.sin(angle_B))
        
        self.points[vertices[0]] = A
        self.points[vertices[1]] = B
        self.points[vertices[2]] = C
    
    def _build_midpoint(self, c):
        p1 = self.points[c["of"][0]]
        p2 = self.points[c["of"][1]]
        self.points[c["point"]] = point_on_segment(p1, p2, 0.5)
    
    def _build_foot(self, c):
        """Foot of perpendicular from a point to a line."""
        pt = self.points[c["from"]]
        l1 = self.points[c["to_line"][0]]
        l2 = self.points[c["to_line"][1]]
        self.points[c["point"]] = foot_of_perp(pt, l1, l2)
    
    def _build_angle_bisector(self, c):
        """Point where the angle bisector from vertex meets a segment."""
        vertex = self.points[c["vertex"]]
        ray1_pt = self.points[c["ray1"]]
        ray2_pt = self.points[c["ray2"]]
        seg = c["on_segment"]
        seg_p1 = self.points[seg[0]]
        seg_p2 = self.points[seg[1]]
        
        # Angle bisector theorem: the bisector from vertex of angle(ray1, vertex, ray2)
        # divides the opposite segment in the ratio of adjacent sides
        d1 = vec_len(vec_sub(ray1_pt, vertex))  # distance vertex->ray1 endpoint? No.
        # Actually for angle bisector hitting segment [seg_p1, seg_p2]:
        # If vertex=B, bisector of ∠ABC hits AC at D, then AD/DC = AB/BC
        
        # We need distances from seg endpoints to vertex's adjacent sides
        # Simpler: compute bisector direction, intersect with segment
        dir1 = vec_normalize(vec_sub(ray1_pt, vertex))
        dir2 = vec_normalize(vec_sub(ray2_pt, vertex))
        bisector_dir = vec_normalize(vec_add(dir1, dir2))
        
        # Intersect ray(vertex, bisector_dir) with line(seg_p1, seg_p2)
        bisector_far = vec_add(vertex, vec_scale(bisector_dir, 100))
        pt = line_intersection(vertex, bisector_far, seg_p1, seg_p2)
        
        if pt is None:
            raise ValueError(f"Angle bisector doesn't intersect segment {seg}")
        
        self.points[c["point"]] = pt
    
    def _build_on_segment(self, c):
        """Point on a segment at a given ratio from first endpoint."""
        seg = c["segment"]
        p1 = self.points[seg[0]]
        p2 = self.points[seg[1]]
        ratio = c["ratio"]
        self.points[c["point"]] = point_on_segment(p1, p2, ratio)
    
    def _build_parallel(self, c):
        """Point at distance from 'through' point, parallel to a line."""
        through = self.points[c["through"]]
        l1 = self.points[c["parallel_to"][0]]
        l2 = self.points[c["parallel_to"][1]]
        dist = c["distance"]
        
        # Direction perpendicular to the line
        line_dir = vec_normalize(vec_sub(l2, l1))
        perp = (-line_dir[1], line_dir[0])
        
        self.points[c["point"]] = vec_add(through, vec_scale(perp, dist))
    
    def _build_perpendicular(self, c):
        """Point on perpendicular from 'through' to a line, at intersection."""
        through = self.points[c["through"]]
        l1 = self.points[c["to_line"][0]]
        l2 = self.points[c["to_line"][1]]
        self.points[c["point"]] = foot_of_perp(through, l1, l2)
    
    def _build_intersection(self, c):
        """Intersection of two lines."""
        p1 = self.points[c["line1"][0]]
        p2 = self.points[c["line1"][1]]
        p3 = self.points[c["line2"][0]]
        p4 = self.points[c["line2"][1]]
        pt = line_intersection(p1, p2, p3, p4)
        if pt is None:
            raise ValueError(f"Lines are parallel, no intersection")
        self.points[c["point"]] = pt
    
    def _build_reflection(self, c):
        """Reflect a point over a line."""
        pt = self.points[c["of"]]
        l1 = self.points[c["over_line"][0]]
        l2 = self.points[c["over_line"][1]]
        self.points[c["point"]] = reflect_over_line(pt, l1, l2)
    
    def _build_rotation(self, c):
        """Rotate a point around a center by angle_deg."""
        pt = self.points[c["of"]]
        center = self.points[c["center"]]
        angle = math.radians(c["angle_deg"])
        v = vec_sub(pt, center)
        rotated = vec_rotate(v, angle)
        self.points[c["point"]] = vec_add(center, rotated)
    
    def validate(self, checks):
        """Run validation checks. Returns list of errors (empty = OK)."""
        errors = []
        for chk in checks:
            kind = chk["check"]
            try:
                if kind == "on_segment":
                    self._check_on_segment(chk)
                elif kind == "angle_equals":
                    self._check_angle_equals(chk)
                elif kind == "length_equals":
                    self._check_length_equals(chk)
                elif kind == "perpendicular":
                    self._check_perpendicular(chk)
                elif kind == "lengths_equal":
                    self._check_lengths_equal(chk)
                elif kind == "collinear":
                    self._check_collinear(chk)
            except Exception as e:
                errors.append(f"Check {kind} failed: {e}")
        return errors
    
    def _check_on_segment(self, chk):
        pt = self.points[chk["point"]]
        p1 = self.points[chk["segment"][0]]
        p2 = self.points[chk["segment"][1]]
        # Check collinear and between
        v1 = vec_sub(pt, p1)
        v2 = vec_sub(p2, p1)
        cross = abs(vec_cross(v1, v2))
        t = vec_dot(v1, v2) / vec_dot(v2, v2)
        if cross > 0.01 * vec_len(v2):
            raise ValueError(f"{chk['point']} not collinear with {chk['segment']}, cross={cross:.4f}")
        if t < -0.01 or t > 1.01:
            raise ValueError(f"{chk['point']} outside segment {chk['segment']}, t={t:.4f}")
    
    def _check_angle_equals(self, chk):
        # angle at vertex between ray1 and ray2
        vertex = self.points[chk["vertex"]]
        r1 = self.points[chk["ray1"]]
        r2 = self.points[chk["ray2"]]
        expected = chk["degrees"]
        tolerance = chk.get("tolerance", 0.5)
        
        v1 = vec_sub(r1, vertex)
        v2 = vec_sub(r2, vertex)
        actual = math.degrees(angle_between(v1, v2))
        
        if abs(actual - expected) > tolerance:
            raise ValueError(f"∠{chk['ray1']}{chk['vertex']}{chk['ray2']} = {actual:.1f}° ≠ {expected}° (tolerance={tolerance}°)")
    
    def _check_length_equals(self, chk):
        p1 = self.points[chk["segment"][0]]
        p2 = self.points[chk["segment"][1]]
        expected = chk["length"]
        tolerance = chk.get("tolerance", 0.01)
        actual = vec_len(vec_sub(p2, p1))
        if abs(actual - expected) > tolerance:
            raise ValueError(f"|{chk['segment'][0]}{chk['segment'][1]}| = {actual:.3f} ≠ {expected}")
    
    def _check_lengths_equal(self, chk):
        pairs = chk["pairs"]  # [[P1,P2], [P3,P4]]
        lengths = []
        for pair in pairs:
            p1 = self.points[pair[0]]
            p2 = self.points[pair[1]]
            lengths.append(vec_len(vec_sub(p2, p1)))
        tolerance = chk.get("tolerance", 0.01)
        for i in range(1, len(lengths)):
            if abs(lengths[i] - lengths[0]) > tolerance:
                raise ValueError(f"|{pairs[i][0]}{pairs[i][1]}|={lengths[i]:.3f} ≠ |{pairs[0][0]}{pairs[0][1]}|={lengths[0]:.3f}")
    
    def _check_perpendicular(self, chk):
        line1 = chk["line1"]
        line2 = chk["line2"]
        d1 = vec_sub(self.points[line1[1]], self.points[line1[0]])
        d2 = vec_sub(self.points[line2[1]], self.points[line2[0]])
        dot = abs(vec_dot(d1, d2))
        tolerance = chk.get("tolerance", 0.01)
        if dot > tolerance * vec_len(d1) * vec_len(d2):
            angle = math.degrees(angle_between(d1, d2))
            raise ValueError(f"Lines not perpendicular: angle={angle:.1f}°")
    
    def _check_collinear(self, chk):
        pts = [self.points[p] for p in chk["points"]]
        for i in range(2, len(pts)):
            v1 = vec_sub(pts[1], pts[0])
            v2 = vec_sub(pts[i], pts[0])
            cross = abs(vec_cross(v1, v2))
            if cross > 0.01 * vec_len(v1):
                raise ValueError(f"Points not collinear: cross={cross:.4f}")
    
    def auto_layout(self, padding=1.0, target_range=(0, 8)):
        """Scale and translate points to fit in target range."""
        if not self.points:
            return
        
        xs = [p[0] for p in self.points.values()]
        ys = [p[1] for p in self.points.values()]
        
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        w = max_x - min_x
        h = max_y - min_y
        
        if w < 0.01 and h < 0.01:
            return
        
        target_min = target_range[0] + padding
        target_max = target_range[1] - padding
        target_size = target_max - target_min
        
        scale = min(target_size / max(w, 0.01), target_size / max(h, 0.01))
        
        # Center in target range
        cx = (target_min + target_max) / 2
        cy = (target_min + target_max) / 2
        
        src_cx = (min_x + max_x) / 2
        src_cy = (min_y + max_y) / 2
        
        for name in self.points:
            p = self.points[name]
            self.points[name] = (
                round(cx + (p[0] - src_cx) * scale, 2),
                round(cy + (p[1] - src_cy) * scale, 2)
            )
    
    def auto_labels(self):
        """Generate label offsets that push labels away from centroid."""
        if not self.points:
            return {}
        
        pts = list(self.points.values())
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        
        labels = {}
        for name, p in self.points.items():
            dx = p[0] - cx
            dy = p[1] - cy
            length = math.sqrt(dx**2 + dy**2)
            if length < 0.01:
                labels[name] = [0, 15]
            else:
                nx, ny = dx/length * 15, dy/length * 15
                labels[name] = [round(nx), round(ny)]
        
        return labels
    
    def to_geometry(self, segments=None, angles=None, angle_labels=None, 
                     equal_marks=None, labels=None):
        """Export to GongZu geometry JSON format."""
        result = {
            "points": {name: [round(p[0], 2), round(p[1], 2)] 
                       for name, p in self.points.items()},
            "segments": segments or [],
            "angles": angles or [],
            "angleLabels": angle_labels or [],
            "equalMarks": equal_marks or [],
            "labels": labels or self.auto_labels()
        }
        return result


def process(input_data):
    """Process input JSON and return geometry spec."""
    engine = GeometryEngine()
    
    # Build geometry
    engine.build(input_data["constructions"])
    
    # Auto-layout to fit [0, 8] range
    engine.auto_layout()
    
    # Validate if checks provided
    checks = input_data.get("checks", [])
    if checks:
        errors = engine.validate(checks)
        if errors:
            return {"error": True, "errors": errors}
    
    # Build output
    geometry = engine.to_geometry(
        segments=input_data.get("segments"),
        angles=input_data.get("angles"),
        angle_labels=input_data.get("angleLabels"),
        equal_marks=input_data.get("equalMarks"),
        labels=input_data.get("labels")
    )
    
    return {"error": False, "geometry": geometry}


if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)
    
    result = process(data)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    if result.get("error"):
        sys.exit(1)
