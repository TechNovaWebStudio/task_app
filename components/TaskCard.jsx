'use client';

import { motion } from 'framer-motion';
import { Eye, Edit2, Trash2, Calendar, Clock, CheckCircle2, Circle, Tag, GripVertical } from 'lucide-react';
import { getTodayString, isToday, isFutureDate } from '@/utils/dateUtils';

export default function TaskCard({ task, onView, onEdit, onDelete, onComplete, showDragHandle = false, dragHandleProps = {} }) {
  if (!task) return null;

  const todayStr = getTodayString();
  const taskDateStr = task.date || (task.dates && task.dates[0]?.date) || '';
  const isCompleted = task.status === 'completed';
  const isFuture = taskDateStr ? isFutureDate(taskDateStr) : false;
  const isCompletionDisabled = isFuture;

  let dueText = 'No date';
  let isOverdue = false;

  if (taskDateStr) {
    const [y, m, d] = taskDateStr.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    if (isToday(taskDateStr)) {
      dueText = 'Today';
    } else {
      dueText = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (!isCompleted && taskDateStr < todayStr) {
      isOverdue = true;
    }
  }

  const occurrenceTime = task.time || task.dueTime || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
        isCompleted
          ? 'border-gray-100 bg-gray-50/50 opacity-80'
          : isOverdue
          ? 'border-red-200'
          : 'border-gray-200 hover:border-purple-200'
      }`}
    >
      {/* Status accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
        isCompleted ? 'bg-emerald-400' : isOverdue ? 'bg-red-400' : 'bg-purple-400'
      }`} />

      <div className="pl-4 pr-4 pt-4 pb-3">
        {/* Top Row: Checkbox + Title */}
        <div className="flex items-start gap-3">
          {/* Drag handle (when in reorder mode) */}
          {showDragHandle && (
            <div
              {...dragHandleProps}
              className="flex-shrink-0 mt-0.5 p-1 rounded-lg text-gray-300 hover:text-purple-500 hover:bg-purple-50 cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to reorder"
              style={{ touchAction: 'none' }}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          {/* Completion Checkbox */}
          <button
            onClick={() => !isCompletionDisabled && onComplete(task._id, !isCompleted)}
            disabled={isCompletionDisabled}
            className={`flex-shrink-0 mt-0.5 focus:outline-none transition-all ${isCompletionDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isCompletionDisabled ? 'Future tasks cannot be completed before their date' : isCompleted ? 'Mark as pending' : 'Mark as completed'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className={`w-5 h-5 transition-colors ${isCompletionDisabled ? 'text-gray-300' : 'text-gray-300 hover:text-purple-500'}`} />
            )}
          </button>

          {/* Title + Description */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold leading-snug ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h4>

            {task.description && (
              <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                {task.description}
              </p>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    <Tag className="w-2 h-2" />
                    {tag}
                  </span>
                ))}
                {task.tags.length > 4 && (
                  <span className="text-[10px] text-gray-400 font-semibold">+{task.tags.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Meta info + Status + Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 flex-wrap gap-2">
          {/* Left: meta badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category */}
            {task.category && (
              <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-semibold text-[10px]">
                {task.category}
              </span>
            )}

            {/* Time */}
            {occurrenceTime && (
              <span className="flex items-center gap-1 text-gray-500 font-medium text-[10px] bg-gray-100 px-2 py-0.5 rounded-lg">
                <Clock className="w-3 h-3 text-purple-400" />
                {occurrenceTime}
              </span>
            )}

            {/* Date */}
            {taskDateStr && (
              <span className={`flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-lg ${
                isOverdue ? 'text-red-600 bg-red-50' :
                dueText === 'Today' ? 'text-purple-600 bg-purple-50' :
                'text-gray-500 bg-gray-100'
              }`}>
                <Calendar className="w-3 h-3" />
                {dueText}
              </span>
            )}

            {/* Status */}
            <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
              isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isCompleted ? '✓ Completed' : 'Pending'}
            </span>
          </div>

          {/* Right: action icons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onView(task)}
              className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              title="View details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              title="Edit task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
