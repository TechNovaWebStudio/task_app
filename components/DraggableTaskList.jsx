'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import TaskCard from './TaskCard';

/* ─────────────────────────────────────────────────────
   SortableTaskItem — single draggable row
───────────────────────────────────────────────────── */
function SortableTaskItem({ task, reorderMode, onView, onEdit, onDelete, onComplete, isDragOverlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    disabled: !reorderMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0 : 1, // hide original; overlay shows the ghost
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch rounded-2xl overflow-hidden transition-shadow duration-200 ${
        isDragging ? 'shadow-xl ring-2 ring-purple-300' : ''
      }`}
    >
      {/* ── Grip handle ── */}
      {reorderMode && (
        <div
          {...attributes}
          {...listeners}
          className={`
            group/grip flex items-center justify-center
            w-10 flex-shrink-0 rounded-l-2xl
            cursor-grab active:cursor-grabbing
            transition-all duration-200
            touch-none select-none
            bg-gradient-to-b from-purple-50 to-purple-100/60 hover:from-purple-100 hover:to-purple-100
          `}
          title="Drag to reorder"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-4 h-4 text-purple-300 group-hover/grip:text-purple-500 transition-colors" />
        </div>
      )}

      {/* ── Task card ── */}
      <div
        className={`flex-1 min-w-0 ${reorderMode ? 'rounded-r-2xl overflow-hidden' : ''}`}
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
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
  );
}

/* ─────────────────────────────────────────────────────
   DragOverlay ghost card — elevated while dragging
───────────────────────────────────────────────────── */
function DragGhostCard({ task, reorderMode }) {
  return (
    <div
      className="flex items-stretch rounded-2xl overflow-hidden"
      style={{
        boxShadow: '0 20px 60px rgba(139, 22, 249, 0.22), 0 8px 20px rgba(0,0,0,0.12)',
        opacity: 0.95,
        transform: 'scale(1.02)',
      }}
    >
      {reorderMode && (
        <div className="flex items-center justify-center w-10 flex-shrink-0 rounded-l-2xl bg-purple-100 cursor-grabbing">
          <GripVertical className="w-4 h-4 text-purple-500" />
        </div>
      )}
      <div className="flex-1 min-w-0 rounded-r-2xl overflow-hidden">
        <TaskCard
          task={task}
          onView={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          onComplete={() => {}}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main DraggableTaskList export
───────────────────────────────────────────────────── */
export default function DraggableTaskList({
  tasks,
  onView,
  onEdit,
  onDelete,
  onComplete,
  onReorder,
  reorderMode = false,
}) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [activeTask, setActiveTask] = useState(null);
  const isActiveRef = useRef(false);

  // ✅ Sync localTasks when the tasks prop changes, but NOT during an active drag
  useEffect(() => {
    if (!isActiveRef.current) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  /* Sensors — PointerSensor with 8px activation distance for
     intentional drag (not accidental tap), plus Touch + Keyboard */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // px — prevents accidental drag on tap
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,  // ms long-press to start drag on touch
        tolerance: 8, // px movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(({ active }) => {
    isActiveRef.current = true;
    const task = localTasks.find(t => t._id === active.id);
    setActiveTask(task || null);
    document.body.classList.add('is-dragging');
  }, [localTasks]);

  const handleDragEnd = useCallback(({ active, over }) => {
    isActiveRef.current = false;
    setActiveTask(null);
    document.body.classList.remove('is-dragging');

    if (over && active.id !== over.id) {
      setLocalTasks((prev) => {
        const oldIndex = prev.findIndex(t => t._id === active.id);
        const newIndex = prev.findIndex(t => t._id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);
        // Notify parent of new order (parent decides whether to save)
        onReorder(reordered);
        return reordered;
      });
    }
  }, [onReorder]);

  const handleDragCancel = useCallback(() => {
    isActiveRef.current = false;
    setActiveTask(null);
    document.body.classList.remove('is-dragging');
  }, []);

  if (!localTasks || localTasks.length === 0) return null;

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0' },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      autoScroll={{
        threshold: { x: 0.2, y: 0.2 },
        acceleration: 10,
        interval: 5,
      }}
    >
      <SortableContext
        items={localTasks.map(t => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2.5">
          {localTasks.map((task) => (
            <SortableTaskItem
              key={task._id}
              task={task}
              reorderMode={reorderMode}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
            />
          ))}
        </div>
      </SortableContext>

      {/* Elevated ghost card shown while dragging */}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <DragGhostCard task={activeTask} reorderMode={reorderMode} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
