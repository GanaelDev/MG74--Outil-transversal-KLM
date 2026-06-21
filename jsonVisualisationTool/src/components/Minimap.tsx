import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { GraphNode } from '../types';

interface MinimapProps {
  network: Network | null;
  nodes: GraphNode[];
  width?: number;
  height?: number;
}

/**
 * Vue d'ensemble (mini-carte) du graphe : utile pour se repérer sur les grands
 * graphes (santé, plantes…). vis-network n'en fournit pas nativement, on la
 * dessine donc sur un <canvas> à partir des positions exposées par le réseau.
 * Un rectangle matérialise la zone visible ; un clic recentre la vue principale.
 */
export const Minimap: React.FC<MinimapProps> = ({ network, nodes, width = 208, height = 144 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mémorise la dernière transformation (graphe → pixels) pour le clic.
  const transformRef = useRef<{ minX: number; minY: number; s: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!network) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const colorById = new Map<string, string>();
    for (const n of nodes) colorById.set(n.id, n.color?.background ?? '#94a3b8');

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let rafId = 0;
    let pending = false;

    const draw = () => {
      pending = false;
      ctx.clearRect(0, 0, width, height);

      const positions = network.getPositions();
      const ids = Object.keys(positions);
      if (ids.length === 0) {
        transformRef.current = null;
        return;
      }

      // Bornes des nœuds.
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const id of ids) {
        const p = positions[id];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      // Zone visible de la vue principale (en coordonnées du graphe).
      const scale = network.getScale();
      const center = network.getViewPosition();
      const mainCanvas = (network as unknown as { canvas: { frame: { canvas: HTMLCanvasElement } } }).canvas.frame.canvas;
      const viewW = mainCanvas.clientWidth / scale;
      const viewH = mainCanvas.clientHeight / scale;
      const vx0 = center.x - viewW / 2;
      const vy0 = center.y - viewH / 2;
      const vx1 = center.x + viewW / 2;
      const vy1 = center.y + viewH / 2;

      // La mini-carte englobe les nœuds ET la zone visible.
      minX = Math.min(minX, vx0);
      minY = Math.min(minY, vy0);
      maxX = Math.max(maxX, vx1);
      maxY = Math.max(maxY, vy1);

      const margin = 8;
      const bw = Math.max(maxX - minX, 1);
      const bh = Math.max(maxY - minY, 1);
      const s = Math.min((width - 2 * margin) / bw, (height - 2 * margin) / bh);
      const ox = margin + (width - 2 * margin - bw * s) / 2;
      const oy = margin + (height - 2 * margin - bh * s) / 2;
      transformRef.current = { minX, minY, s, ox, oy };

      const toPx = (x: number) => ox + (x - minX) * s;
      const toPy = (y: number) => oy + (y - minY) * s;

      // Nœuds.
      for (const id of ids) {
        const p = positions[id];
        ctx.beginPath();
        ctx.arc(toPx(p.x), toPy(p.y), 2.2, 0, Math.PI * 2);
        ctx.fillStyle = colorById.get(id) ?? '#94a3b8';
        ctx.fill();
      }

      // Rectangle de la zone visible.
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(79, 70, 229, 0.10)';
      const rx = toPx(vx0);
      const ry = toPy(vy0);
      const rw = (vx1 - vx0) * s;
      const rh = (vy1 - vy0) * s;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    };

    const scheduleDraw = () => {
      if (pending) return;
      pending = true;
      rafId = requestAnimationFrame(draw);
    };

    network.on('afterDrawing', scheduleDraw);
    scheduleDraw();

    return () => {
      network.off('afterDrawing', scheduleDraw);
      cancelAnimationFrame(rafId);
    };
  }, [network, nodes, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const t = transformRef.current;
    if (!network || !t) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const x = t.minX + (px - t.ox) / t.s;
    const y = t.minY + (py - t.oy) / t.s;
    network.moveTo({ position: { x, y }, animation: { duration: 400, easingFunction: 'easeInOutCubic' } });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-soft backdrop-blur-sm">
      <div className="border-b border-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Vue d'ensemble
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width, height }}
        className="block cursor-pointer"
      />
    </div>
  );
};
