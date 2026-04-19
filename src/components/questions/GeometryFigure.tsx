import { useEffect, useRef, useId } from 'react';
import JXG from 'jsxgraph';

/**
 * GeometryFigure — Renders a geometry diagram from a declarative JSON spec.
 * Colors are allowed and encouraged for visual clarity.
 * Right-angle marks are drawn manually (small square) to avoid JSXGraph rendering bugs.
 */

interface GeometrySpec {
  points: Record<string, [number, number]>;
  segments?: { from: string; to: string; style?: string; color?: string }[];
  angles?: { points: [string, string, string]; type?: string }[];
  highlights?: { from: string; to: string; color?: string }[];
  equalMarks?: [string, string][];
  labels?: Record<string, [number, number]>;
  boundingBox?: [number, number, number, number];
}

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

    // Create points
    const jxgPoints: Record<string, any> = {};
    for (const [name, coords] of Object.entries(pts)) {
      const labelOffset = geometry.labels?.[name] || [0, 15];
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
