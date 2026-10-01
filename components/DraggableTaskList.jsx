'use client';

import { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import TaskCard from './TaskCard';

export default function DraggableTaskList({ tasks, onView, onEdit, onDelete, onComplete, onReorder }) {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

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
    }, 150);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.active) return;
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
    if (dragState.current.activated && dragState.current.startIndex !== null) {
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
    <div ref={listRef} className="space-y-3 select-none">
      {tasks.map((task, index) => {
        const isDragging = draggingIndex === index;
        const isOver = overIndex === index && draggingIndex !== null && overIndex !== draggingIndex;
        return (
          <div key={task._id} data-drag-item className="relative">
            {isOver && overIndex < draggingIndex && (
              <div className="h-1 w-full bg-purple-400 rounded-full mb-2 opacity-70" />
            )}
            <div
              className={`flex items-stretch gap-2 rounded-2xl transition-all duration-150 ${
                isDragging
                  ? 'opacity-60 scale-[1.02] shadow-2xl shadow-purple-200/60 z-50 relative ring-2 ring-purple-300'
                  : 'opacity-100'
              }`}
            >
              <div
                data-drag-handle
                onPointerDown={(e) => handlePointerDown(e, index)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={cancelDrag}
                className={`flex items-center justify-center w-8 flex-shrink-0 rounded-xl cursor-grab active:cursor-grabbing transition-colors ${
                  isDragging
                    ? 'bg-purple-100 text-purple-500'
                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                }`}
                title="Hold to drag and reorder"
                style={{ touchAction: 'none' }}
              >
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <TaskCard task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete} />
              </div>
            </div>
            {isOver && overIndex > draggingIndex && (
              <div className="h-1 w-full bg-purple-400 rounded-full mt-2 opacity-70" />
            )}
          </div>
        );
      })}
    </div>
  );
}
