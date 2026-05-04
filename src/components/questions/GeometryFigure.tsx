import { useEffect, useRef, useId } from 'react';
import JXG from 'jsxgraph';
import type { GeometrySpec } from '../../lib/types';

/**
 * GeometryFigure — Renders a geometry diagram from a declarative JSON spec.
 * Colors are allowed and encouraged for visual clarity.
 * Right-angle marks are drawn manually (small square) to avoid JSXGraph rendering bugs.
 */

interface Props {
  geometry: GeometrySpec;
  height?: number;
}

export default function GeometryFigure({ geometry, height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const id = useId().replace(/:/g, '_');

  useEffect(() => {
    if (!containerRef.current) return;

    if (boardRef.current) {
      JXG.JSXGraph.freeBoard(boardRef.current);
    }

    const pts = geometry.points;
    const allX = Object.values(pts).map(p => p[0]);
    const allY = Object.values(pts).map(p => p[1]);
    const pad = 1.2;
    const bbox = geometry.boundingBox || [
      Math.min(...allX) - pad,
      Math.max(...allY) + pad,
      Math.max(...allX) + pad,
      Math.min(...allY) - pad,
    ];

    const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
      boundingbox: bbox,
      axis: false,
      grid: false,
      showNavigation: false,
      showCopyright: false,
      pan: { enabled: false } as any,
      zoom: { enabled: false } as any,
      keepaspectratio: true,
    });
    boardRef.current = board;

    const DEFAULT_COLOR = '#2563eb';
    const LABEL_COLOR = '#1e293b';

    const drawSideLabel = (from: string, to: string, text?: string, offset = 0.35, color = LABEL_COLOR) => {
      if (!text) return;
      const p1Coords = pts[from];
      const p2Coords = pts[to];
      if (!p1Coords || !p2Coords) return;

      const mx = (p1Coords[0] + p2Coords[0]) / 2;
      const my = (p1Coords[1] + p2Coords[1]) / 2;
      const dx = p2Coords[0] - p1Coords[0];
      const dy = p2Coords[1] - p1Coords[1];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const cx = Object.values(pts).reduce((s, p) => s + p[0], 0) / Object.values(pts).length;
      const cy = Object.values(pts).reduce((s, p) => s + p[1], 0) / Object.values(pts).length;

      // Normal vector; pick the side away from the figure centroid so letters don't sit on the line.
      let nx = -dy / len;
      let ny = dx / len;
      const outwardDot = nx * (mx - cx) + ny * (my - cy);
      if (outwardDot < 0) { nx = -nx; ny = -ny; }

      board.create('text', [mx + nx * offset, my + ny * offset, text], {
        fontSize: 13,
        fontWeight: 'bold',
        color,
        anchorX: 'middle',
        anchorY: 'middle',
        fixed: true,
        highlight: false,
      });
    };

    // Collect vertices that have angle labels — their point labels need more offset
    const angleLabelVertices = new Set(
      (geometry.angleLabels || []).map((al: any) => al.vertex)
    );

    // Create points
    const jxgPoints: Record<string, any> = {};
    for (const [name, coords] of Object.entries(pts)) {
      let labelOffset = geometry.labels?.[name] || [0, 15];
      // Push vertex label further away if it has an angle label to avoid overlap
      if (angleLabelVertices.has(name) && !geometry.labels?.[name]) {
        // Compute outward direction from centroid
        const cx = Object.values(pts).reduce((s, p) => s + p[0], 0) / Object.values(pts).length;
        const cy = Object.values(pts).reduce((s, p) => s + p[1], 0) / Object.values(pts).length;
        const dx = coords[0] - cx;
        const dy = coords[1] - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        labelOffset = [Math.round(dx / dist * 20), Math.round(dy / dist * 20)];
      }
      jxgPoints[name] = board.create('point', coords, {
        name,
        size: 2,
        color: LABEL_COLOR,
        label: {
          fontSize: 14,
          fontWeight: 'bold',
          color: LABEL_COLOR,
          offset: labelOffset,
        },
        fixed: true,
      });
    }

    // Draw segments
    for (const seg of geometry.segments || []) {
      const p1 = jxgPoints[seg.from];
      const p2 = jxgPoints[seg.to];
      if (!p1 || !p2) continue;
      board.create('segment', [p1, p2], {
        strokeColor: seg.color || DEFAULT_COLOR,
        strokeWidth: 2,
        dash: seg.style === 'dashed' ? 2 : 0,
      });
      drawSideLabel(seg.from, seg.to, seg.label || seg.text, 0.35, seg.color || LABEL_COLOR);
    }

    // Draw highlights
    for (const hl of geometry.highlights || []) {
      const p1 = jxgPoints[hl.from];
      const p2 = jxgPoints[hl.to];
      if (!p1 || !p2) continue;
      board.create('segment', [p1, p2], {
        strokeColor: hl.color || '#16a34a',
        strokeWidth: 3,
      });
      drawSideLabel(hl.from, hl.to, hl.label || hl.text, 0.45, hl.color || '#16a34a');
    }

    for (const sl of geometry.sideLabels || []) {
      drawSideLabel(sl.from, sl.to, sl.text || sl.label, sl.offset ?? 0.35, sl.color || LABEL_COLOR);
    }

    // Draw right-angle marks manually (small square at vertex)
    for (const ang of geometry.angles || []) {
      const [aName, bName, cName] = ang.points;
      const a = pts[aName];
      const b = pts[bName]; // vertex
      const c = pts[cName];
      if (!a || !b || !c) continue;

      if (ang.type === 'right') {
        const size = 0.3;
        const ba = [a[0] - b[0], a[1] - b[1]];
        const bc = [c[0] - b[0], c[1] - b[1]];
        const baLen = Math.sqrt(ba[0] ** 2 + ba[1] ** 2);
        const bcLen = Math.sqrt(bc[0] ** 2 + bc[1] ** 2);
        if (baLen === 0 || bcLen === 0) continue;
        const uBA = [ba[0] / baLen * size, ba[1] / baLen * size];
        const uBC = [bc[0] / bcLen * size, bc[1] / bcLen * size];

        const p1 = [b[0] + uBA[0], b[1] + uBA[1]];
        const p2 = [b[0] + uBA[0] + uBC[0], b[1] + uBA[1] + uBC[1]];
        const p3 = [b[0] + uBC[0], b[1] + uBC[1]];

        const hp1 = board.create('point', p1, { visible: false, name: '', fixed: true });
        const hp2 = board.create('point', p2, { visible: false, name: '', fixed: true });
        const hp3 = board.create('point', p3, { visible: false, name: '', fixed: true });

        board.create('segment', [hp1, hp2], {
          strokeColor: LABEL_COLOR,
          strokeWidth: 1.5,
          fixed: true,
        });
        board.create('segment', [hp2, hp3], {
          strokeColor: LABEL_COLOR,
          strokeWidth: 1.5,
          fixed: true,
        });
      }
    }

    // Equal marks (tick marks on segment midpoints)
    for (const pair of geometry.equalMarks || []) {
      const p1Coords = pts[pair[0]];
      const p2Coords = pts[pair[1]];
      if (!p1Coords || !p2Coords) continue;

      const mx = (p1Coords[0] + p2Coords[0]) / 2;
      const my = (p1Coords[1] + p2Coords[1]) / 2;
      const dx = p2Coords[0] - p1Coords[0];
      const dy = p2Coords[1] - p1Coords[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const tickSize = 0.18;
      const nx = -dy / len * tickSize;
      const ny = dx / len * tickSize;

      const t1 = board.create('point', [mx + nx, my + ny], { visible: false, name: '', fixed: true });
      const t2 = board.create('point', [mx - nx, my - ny], { visible: false, name: '', fixed: true });
      board.create('segment', [t1, t2], {
        strokeColor: LABEL_COLOR,
        strokeWidth: 2,
        fixed: true,
      });
    }

    // Angle arcs with labels (e.g. "36°") — manual text placement
    const ANGLE_COLOR = '#dc2626';
    for (const al of geometry.angleLabels || []) {
      const v = pts[al.vertex];
      const f = pts[al.from];
      const t = pts[al.to];
      if (!v || !f || !t) continue;

      const pV = jxgPoints[al.vertex];
      const pF = jxgPoints[al.from];
      const pT = jxgPoints[al.to];
      if (!pV || !pF || !pT) continue;

      const vf = [f[0] - v[0], f[1] - v[1]];
      const vt_vec = [t[0] - v[0], t[1] - v[1]];
      const dot = vf[0] * vt_vec[0] + vf[1] * vt_vec[1];
      const m1 = Math.sqrt(vf[0] ** 2 + vf[1] ** 2);
      const m2 = Math.sqrt(vt_vec[0] ** 2 + vt_vec[1] ** 2);
      const angleDeg = m1 > 0 && m2 > 0
        ? Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180 / Math.PI
        : 90;
      const arcRadius = angleDeg < 50 ? 1.2 : angleDeg < 90 ? 0.9 : 0.7;

      // Draw the smaller angle arc manually. JSXGraph's built-in angle can choose
      // the reflex/exterior side when three points are almost collinear on a side,
      // which makes arcs appear outside the intended angle.
      const start = Math.atan2(vf[1], vf[0]);
      const end = Math.atan2(vt_vec[1], vt_vec[0]);
      let delta = end - start;
      while (delta <= -Math.PI) delta += Math.PI * 2;
      while (delta > Math.PI) delta -= Math.PI * 2;

      const steps = 24;
      const arcXs: number[] = [];
      const arcYs: number[] = [];
      for (let i = 0; i <= steps; i += 1) {
        const a = start + (delta * i) / steps;
        arcXs.push(v[0] + Math.cos(a) * arcRadius);
        arcYs.push(v[1] + Math.sin(a) * arcRadius);
      }
      board.create('curve', [arcXs, arcYs], {
        strokeColor: ANGLE_COLOR,
        strokeWidth: 1.5,
        fixed: true,
      });

      // Place text along the smaller-angle bisector, just outside the arc.
      const mid = start + delta / 2;
      const textDist = arcRadius + 0.3;
      const tx = v[0] + Math.cos(mid) * textDist;
      const ty = v[1] + Math.sin(mid) * textDist;

      board.create('text', [tx, ty, al.text || ''], {
        fontSize: 12,
        color: ANGLE_COLOR,
        anchorX: 'middle',
        anchorY: 'middle',
        fixed: true,
      });
    }

    return () => {
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [geometry]);

  return (
    <div
      ref={containerRef}
      id={`geo_${id}`}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
      style={{ width: '100%', height }}
    />
  );
}
