'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Tile from './Tile';
import { isTileBlocked } from '../lib/gameLogic';
import styles from './GameBoard.module.css';

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2;
const DRAG_THRESHOLD = 5; // px moved before treating as drag

export default function GameBoard({ tiles, onTileClick }) {
  const wrapperRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Refs for gesture tracking
  const gestureRef = useRef({
    isPanning: false,
    didDrag: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    totalMoved: 0,
    // Pinch
    lastPinchDist: 0,
    lastPinchCenterX: 0,
    lastPinchCenterY: 0,
  });

  // Center board initially based on wrapper size
  useEffect(() => {
    if (!wrapperRef.current) return;
    const wrapper = wrapperRef.current;
    const boardW = 616;
    const boardH = 380;
    const wW = wrapper.clientWidth;
    const wH = wrapper.clientHeight;
    const fitScale = Math.min(wW / boardW, wH / boardH, 1);
    setZoom(fitScale);
    setPan({
      x: (wW - boardW * fitScale) / 2,
      y: (wH - boardH * fitScale) / 2,
    });
  }, []);

  // --- Mouse handlers ---
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const g = gestureRef.current;
    g.isPanning = true;
    g.didDrag = false;
    g.totalMoved = 0;
    g.startX = e.clientX;
    g.startY = e.clientY;
    g.startPanX = pan.x;
    g.startPanY = pan.y;
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    const g = gestureRef.current;
    if (!g.isPanning) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    g.totalMoved = Math.abs(dx) + Math.abs(dy);
    if (g.totalMoved > DRAG_THRESHOLD) {
      g.didDrag = true;
    }
    setPan({ x: g.startPanX + dx, y: g.startPanY + dy });
  }, []);

  const onMouseUp = useCallback(() => {
    gestureRef.current.isPanning = false;
  }, []);

  // Mouse wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prevZoom) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * delta));
      const ratio = newZoom / prevZoom;
      setPan((prevPan) => ({
        x: mx - ratio * (mx - prevPan.x),
        y: my - ratio * (my - prevPan.y),
      }));
      return newZoom;
    });
  }, []);

  // --- Touch handlers ---
  const onTouchStart = useCallback((e) => {
    const g = gestureRef.current;
    if (e.touches.length === 1) {
      g.isPanning = true;
      g.didDrag = false;
      g.totalMoved = 0;
      g.startX = e.touches[0].clientX;
      g.startY = e.touches[0].clientY;
      g.startPanX = pan.x;
      g.startPanY = pan.y;
    } else if (e.touches.length === 2) {
      g.isPanning = false;
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      g.lastPinchDist = Math.hypot(dx, dy);
      g.lastPinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      g.lastPinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  }, [pan]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const g = gestureRef.current;

    if (e.touches.length === 1 && g.isPanning) {
      const dx = e.touches[0].clientX - g.startX;
      const dy = e.touches[0].clientY - g.startY;
      g.totalMoved = Math.abs(dx) + Math.abs(dy);
      if (g.totalMoved > DRAG_THRESHOLD) {
        g.didDrag = true;
      }
      setPan({ x: g.startPanX + dx, y: g.startPanY + dy });
    } else if (e.touches.length === 2) {
      g.didDrag = true;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();

      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.hypot(dx, dy);
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const mx = cx - rect.left;
      const my = cy - rect.top;

      if (g.lastPinchDist > 0) {
        const ratio = dist / g.lastPinchDist;
        setZoom((prevZoom) => {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * ratio));
          const actualRatio = newZoom / prevZoom;
          setPan((prevPan) => ({
            x: mx - actualRatio * (mx - prevPan.x) + (cx - g.lastPinchCenterX),
            y: my - actualRatio * (my - prevPan.y) + (cy - g.lastPinchCenterY),
          }));
          return newZoom;
        });
      }

      g.lastPinchDist = dist;
      g.lastPinchCenterX = cx;
      g.lastPinchCenterY = cy;
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      gestureRef.current.lastPinchDist = 0;
    }
    if (e.touches.length === 0) {
      gestureRef.current.isPanning = false;
    }
  }, []);

  // Attach wheel with passive:false
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Block tile clicks if user was dragging
  const handleTileClick = useCallback((tile) => {
    if (gestureRef.current.didDrag) return;
    onTileClick(tile);
  }, [onTileClick]);

  return (
    <div
      className={styles.boardWrapper}
      ref={wrapperRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={styles.boardTransform}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <div className={styles.board}>
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              blocked={isTileBlocked(tile, tiles)}
              onClick={handleTileClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
