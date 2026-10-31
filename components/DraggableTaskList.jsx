'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import TaskCard from './TaskCard';

/**
 * DraggableTaskList — Smooth Framer Motion drag-to-reorder
 *
 * • Normal mode  : cards behave normally; no dragging possible
 * • Reorder mode : grip handles appear; drag any task to any position
 *                  with live animated insertion indicator & card shuffling
 *
 * Uses Pointer Events (works on touch + mouse) with Framer Motion
 * layout animations for silky-smooth card repositioning.
 */
export default function DraggableTaskList({
  tasks,
  onView,
  onEdit,
  onDelete,
  onComplete,
  onReorder,
  reorderMode: externalReorderMode,
  onToggleReorderMode: externalToggle,
}) {
  /* ─── Reorder mode (internal fallback if no parent control) ─── */
  const [internalReorderMode, setInternalReorderMode] = useState(false);
  const reorderMode =
    externalReorderMode !== undefined ? externalReorderMode : internalReorderMode;
  // toggleReorderMode kept for potential standalone use
  // eslint-disable-next-line no-unused-vars
  const toggleReorderMode =
    externalToggle || (() => setInternalReorderMode((v) => !v));

  /* ─── Drag state ─── */
  const [localTasks, setLocalTasks] = useState(tasks);
  const [draggingId, setDraggingId]     = useState(null); // task._id being dragged
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [overIndex, setOverIndex]       = useState(null);

  // Sync localTasks when external tasks prop changes (e.g. after save/fetch)
  useEffect(() => {
    if (!draggingId) setLocalTasks(tasks);
  }, [tasks, draggingId]);

  /* ─── Refs ─── */
  const listRef      = useRef(null);
  const dragRef      = useRef({
    active: false,
    activated: false,
    startIndex: null,
    startY: 0,
    longPressTimer: null,
    pointerId: null,
  });
  const overIndexRef = useRef(null);

  /* ─────────────────────────────────────────────────────
     Utility: compute which slot the pointer is hovering
  ───────────────────────────────────────────────────── */
  const getOverIndex = useCallback((clientY) => {
    if (!listRef.current) return 0;
    const items = Array.from(listRef.current.querySelectorAll('[data-drag-item]'));
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const mid  = rect.top + rect.height / 2;
      if (clientY < mid) return i;
    }
    return items.length - 1;
  }, []);

  /* ─────────────────────────────────────────────────────
     Cancel / reset drag
  ───────────────────────────────────────────────────── */
  const cancelDrag = useCallback(() => {
    clearTimeout(dragRef.current.longPressTimer);
    dragRef.current.active    = false;
    dragRef.current.activated = false;
    dragRef.current.startIndex = null;
    dragRef.current.pointerId  = null;
    setDraggingId(null);
    setDraggingIndex(null);
    setOverIndex(null);
    overIndexRef.current = null;
  }, []);

  /* ─────────────────────────────────────────────────────
     Pointer handlers (attached to each grip handle)
  ───────────────────────────────────────────────────── */
  const handlePointerDown = useCallback((e, index, taskId) => {
    if (!reorderMode) return;
    if (e.button !== undefined && e.button !== 0) return; // left-click / touch only
    e.preventDefault();
    e.stopPropagation();

    dragRef.current.active     = true;
    dragRef.current.activated  = false;
    dragRef.current.startIndex = index;
    dragRef.current.startY     = e.clientY;
    dragRef.current.pointerId  = e.pointerId;

    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}

    // Short delay prevents accidental drags on tap
    dragRef.current.longPressTimer = setTimeout(() => {
      if (dragRef.current.active) {
        dragRef.current.activated = true;
        setDraggingId(taskId);
        setDraggingIndex(index);
        setOverIndex(index);
        overIndexRef.current = index;
      }
    }, 80);
  }, [reorderMode]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active || !reorderMode) return;

    const moved = Math.abs(e.clientY - dragRef.current.startY);

    if (!dragRef.current.activated) {
      // If user moves too much before long-press fires → cancel (scroll intent)
      if (moved > 8) {
        clearTimeout(dragRef.current.longPressTimer);
        dragRef.current.active = false;
      }
      return;
    }

    const newOver = getOverIndex(e.clientY);
    if (newOver !== overIndexRef.current) {
      overIndexRef.current = newOver;
      setOverIndex(newOver);
    }
  }, [reorderMode, getOverIndex]);

  const handlePointerUp = useCallback(() => {
    clearTimeout(dragRef.current.longPressTimer);

    if (
      dragRef.current.activated &&
      dragRef.current.startIndex !== null &&
      reorderMode
    ) {
      const from = dragRef.current.startIndex;
      const to   = overIndexRef.current !== null ? overIndexRef.current : from;

      if (from !== to) {
        const reordered = [...localTasks];
        const [moved]   = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        setLocalTasks(reordered);   // optimistic local update
        onReorder(reordered);       // propagate to parent
      }
    }

    cancelDrag();
  }, [reorderMode, localTasks, onReorder, cancelDrag]);

  /* ─────────────────────────────────────────────────────
     Compute display order with live "ghost" re-insertion
  ───────────────────────────────────────────────────── */
  const displayTasks = (() => {
    if (draggingIndex === null || overIndex === null || draggingIndex === overIndex) {
      return localTasks;
    }
    const arr     = [...localTasks];
    const [moved] = arr.splice(draggingIndex, 1);
    arr.splice(overIndex, 0, moved);
    return arr;
  })();

  if (!localTasks || localTasks.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* List */}
      <div
        ref={listRef}
        className="space-y-2.5 select-none"
        /* Global pointer-move/up on the container so events don't get lost */
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={cancelDrag}
      >
        <AnimatePresence initial={false}>
          {displayTasks.map((task, index) => {
            const isBeingDragged = task._id === draggingId;
            const isDropTarget   =
              overIndex === index &&
              draggingId !== null &&
              overIndex !== draggingIndex;

            return (
              <motion.div
                key={task._id}
                data-drag-item
                layout
                layoutId={task._id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{
                  opacity: isBeingDragged ? 0.45 : 1,
                  scale:   isBeingDragged ? 1.02  : 1,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  layout:  { type: 'spring', stiffness: 400, damping: 35 },
                  opacity: { duration: 0.15 },
                  scale:   { duration: 0.15 },
                }}
                className="relative"
                style={{ zIndex: isBeingDragged ? 50 : 'auto' }}
              >
                {/* ── Drop-zone indicator (top) ── */}
                <AnimatePresence>
                  {isDropTarget && overIndex < draggingIndex && (
                    <motion.div
                      key="indicator-top"
                      initial={{ opacity: 0, scaleX: 0.5 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0.5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -top-1.5 left-3 right-3 h-0.5 rounded-full z-10"
                      style={{
                        background:
                          'linear-gradient(90deg, #8B16F9, #5635F5)',
                        boxShadow: '0 0 8px rgba(139,22,249,0.5)',
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* ── Card row: grip + TaskCard ── */}
                <div
                  className={`flex items-stretch gap-0 rounded-2xl overflow-hidden transition-shadow duration-200 ${
                    isBeingDragged
                      ? 'shadow-2xl ring-2 ring-purple-400 ring-offset-1'
                      : isDropTarget
                      ? 'shadow-md'
                      : ''
                  }`}
                >
                  {/* Grip handle — only in reorder mode */}
                  {reorderMode && (
                    <div
                      data-drag-handle
                      onPointerDown={(e) => handlePointerDown(e, index, task._id)}
                      className={`
                        group/grip flex items-center justify-center
                        w-10 flex-shrink-0 rounded-l-2xl
                        cursor-grab active:cursor-grabbing
                        transition-all duration-200
                        touch-none select-none
                        ${isBeingDragged
                          ? 'bg-purple-100'
                          : 'bg-gradient-to-b from-purple-50 to-purple-100/60 hover:from-purple-100 hover:to-purple-100'
                        }
                      `}
                      title="Drag to reorder"
                      style={{ touchAction: 'none' }}
                    >
                      <div className={`
                        flex flex-col gap-[3px] items-center justify-center
                        w-6 h-8 rounded-lg transition-all duration-200
                        ${isBeingDragged
                          ? 'scale-110'
                          : 'group-hover/grip:scale-110'
                        }
                      `}>
                        <GripVertical
                          className={`w-4 h-4 transition-colors duration-200 ${
                            isBeingDragged
                              ? 'text-purple-600'
                              : 'text-purple-300 group-hover/grip:text-purple-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* TaskCard — pointer events disabled while dragging this card */}
                  <div
                    className={`flex-1 min-w-0 ${reorderMode ? 'rounded-r-2xl overflow-hidden' : ''}`}
                    style={{ pointerEvents: isBeingDragged ? 'none' : 'auto' }}
                  >
                    <TaskCard
                      task={task}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onComplete={onComplete}
                    />
                  </div>
                </div>

                {/* ── Drop-zone indicator (bottom) ── */}
                <AnimatePresence>
                  {isDropTarget && overIndex > draggingIndex && (
                    <motion.div
                      key="indicator-bottom"
                      initial={{ opacity: 0, scaleX: 0.5 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0.5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -bottom-1.5 left-3 right-3 h-0.5 rounded-full z-10"
                      style={{
                        background:
                          'linear-gradient(90deg, #8B16F9, #5635F5)',
                        boxShadow: '0 0 8px rgba(139,22,249,0.5)',
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
