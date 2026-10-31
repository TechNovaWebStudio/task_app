'use client';

import { useState, useRef } from 'react';
import { GripVertical, Move, Check, ArrowUpDown } from 'lucide-react';
import TaskCard from './TaskCard';

/**
 * DraggableTaskList
 * 
 * Reordering is CONTROLLED:
 * - In normal mode: cards behave normally, no dragging
 * - In reorder mode: drag handles appear, user can drag to reorder
 * 
 * reorderMode and onToggleReorderMode are passed from parent.
 * If parent doesn't provide them, an internal toggle button is shown.
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
  const [internalReorderMode, setInternalReorderMode] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  // Use external or internal reorder mode
  const reorderMode = externalReorderMode !== undefined ? externalReorderMode : internalReorderMode;
  const toggleReorderMode = externalToggle || (() => setInternalReorderMode(v => !v));

  const dragState = useRef({ active: false, startIndex: null, longPressTimer: null, startY: 0, activated: false });
  const listRef = useRef(null);
  const overIndexRef = useRef(null);

  const getItemRects = () => {
    if (!listRef.current) return [];
    return Array.from(listRef.current.querySelectorAll('[data-drag-item]')).map(el => el.getBoundingClientRect());
  };

  const getOverIndex = (clientY) => {
    const rects = getItemRects();
    for (let i = 0; i < rects.length; i++) {
      const mid = rects[i].top + rects[i].height / 2;
      if (clientY < mid) return i;
    }
    return rects.length - 1;
  };

  const cancelDrag = () => {
    clearTimeout(dragState.current.longPressTimer);
    dragState.current.active = false;
    dragState.current.activated = false;
    dragState.current.startIndex = null;
    setDraggingIndex(null);
    setOverIndex(null);
    overIndexRef.current = null;
  };

  const handlePointerDown = (e, index) => {
    if (!reorderMode) return; // Only allow dragging in reorder mode
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    dragState.current.startY = e.clientY;
    dragState.current.startIndex = index;
    dragState.current.active = true;
    dragState.current.activated = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current.longPressTimer = setTimeout(() => {
      if (dragState.current.active) {
        dragState.current.activated = true;
        setDraggingIndex(dragState.current.startIndex);
        setOverIndex(dragState.current.startIndex);
        overIndexRef.current = dragState.current.startIndex;
      }
    }, 120);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.active || !reorderMode) return;
    const movedEnough = Math.abs(e.clientY - dragState.current.startY) > 5;
    if (!dragState.current.activated && movedEnough) {
      clearTimeout(dragState.current.longPressTimer);
      dragState.current.active = false;
      return;
    }
    if (dragState.current.activated) {
      const newOver = getOverIndex(e.clientY);
      overIndexRef.current = newOver;
      setOverIndex(newOver);
    }
  };

  const handlePointerUp = () => {
    clearTimeout(dragState.current.longPressTimer);
    if (dragState.current.activated && dragState.current.startIndex !== null && reorderMode) {
      const from = dragState.current.startIndex;
      const to = overIndexRef.current !== null ? overIndexRef.current : from;
      if (from !== to) {
        const newTasks = [...tasks];
        const [moved] = newTasks.splice(from, 1);
        newTasks.splice(to, 0, moved);
        onReorder(newTasks);
      }
    }
    cancelDrag();
  };

  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Reorder mode banner - shown only when using internal toggle */}
      {externalReorderMode === undefined && (
        <div className="flex items-center justify-between">
          {reorderMode ? (
            <div className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-purple-50 border-2 border-dashed border-purple-200 text-purple-700">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4" />
                <span className="text-sm font-semibold">Reorder Mode — drag handles to rearrange</span>
              </div>
              <button
                onClick={() => { toggleReorderMode(); cancelDrag(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={toggleReorderMode}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl border border-gray-200 hover:border-purple-200 transition-all"
              title="Enable reorder mode"
            >
              <ArrowUpDown className="w-4 h-4" />
              Reorder
            </button>
          )}
        </div>
      )}

      <div ref={listRef} className={`space-y-3 select-none ${reorderMode ? 'cursor-default' : ''}`}>
        {tasks.map((task, index) => {
          const isDragging = draggingIndex === index;
          const isOver = overIndex === index && draggingIndex !== null && overIndex !== draggingIndex;
          return (
            <div key={task._id} data-drag-item className="relative">
              {isOver && overIndex < draggingIndex && (
                <div className="h-1 w-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mb-2 opacity-80" />
              )}

              <div
                className={`flex items-stretch gap-0 rounded-2xl transition-all duration-150 ${
                  isDragging ? 'opacity-60 scale-[1.01] shadow-xl shadow-purple-100 z-50 relative ring-2 ring-purple-300' : 'opacity-100'
                }`}
              >
                {/* Drag Handle - only visible in reorder mode */}
                {reorderMode && (
                  <div
                    data-drag-handle
                    onPointerDown={(e) => handlePointerDown(e, index)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={cancelDrag}
                    className={`flex items-center justify-center w-8 flex-shrink-0 rounded-l-2xl cursor-grab active:cursor-grabbing transition-colors ${
                      isDragging ? 'bg-purple-100 text-purple-500' : 'bg-purple-50 text-purple-400 hover:text-purple-600 hover:bg-purple-100'
                    }`}
                    title="Drag to reorder"
                    style={{ touchAction: 'none' }}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                )}

                <div className={`flex-1 min-w-0 ${reorderMode ? 'rounded-r-2xl overflow-hidden' : ''}`}>
                  <TaskCard
                    task={task}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onComplete={onComplete}
                  />
                </div>
              </div>

              {isOver && overIndex > draggingIndex && (
                <div className="h-1 w-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mt-2 opacity-80" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
