'use client';

import { motion } from 'framer-motion';
import { Eye, Edit2, Trash2, Calendar, Clock, CheckCircle2, Circle, Tag } from 'lucide-react';
import { getTodayString, isToday, isFutureDate } from '@/utils/dateUtils';

export default function TaskGridCard({ task, onView, onEdit, onDelete, onComplete }) {
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
      dueText = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    if (!isCompleted && taskDateStr < todayStr) {
      isOverdue = true;
    }
  }

  const occurrenceTime = task.time || task.dueTime || '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(139, 22, 249, 0.12)' }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border flex flex-col transition-all duration-200 overflow-hidden group relative ${
        isCompleted
          ? 'border-gray-100 opacity-75'
          : isOverdue
          ? 'border-red-200 hover:border-red-300'
          : 'border-gray-200 hover:border-purple-200'
      }`}
      style={{ minHeight: '180px' }}
    >
      {/* Top accent line */}
      <div className={`h-1 w-full flex-shrink-0 ${
        isCompleted ? 'bg-emerald-400' : isOverdue ? 'bg-red-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
      }`} />

      <div className="p-4 flex flex-col flex-1">
        {/* Header: Checkbox + Category */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <button
            onClick={() => !isCompletionDisabled && onComplete(task._id, !isCompleted)}
            disabled={isCompletionDisabled}
            className={`flex-shrink-0 mt-0.5 focus:outline-none transition-all ${isCompletionDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isCompletionDisabled ? 'Future tasks cannot be completed' : isCompleted ? 'Mark as pending' : 'Mark as completed'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className={`w-5 h-5 transition-colors ${isCompletionDisabled ? 'text-gray-200' : 'text-gray-300 hover:text-purple-500'}`} />
            )}
          </button>

          {task.category && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[100px]">
              {task.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className={`text-sm font-bold leading-snug flex-1 mb-2 line-clamp-2 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className={`text-xs line-clamp-2 leading-relaxed mb-3 ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-purple-50 text-purple-600 border border-purple-100">
                <Tag className="w-1.5 h-1.5" />
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[9px] text-gray-400 font-semibold self-center">+{task.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {taskDateStr && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${
                isOverdue ? 'text-red-600 bg-red-50' :
                dueText === 'Today' ? 'text-purple-600 bg-purple-50' :
                'text-gray-500 bg-gray-100'
              }`}>
                <Calendar className="w-2.5 h-2.5" />
                {dueText}
              </span>
            )}
            {occurrenceTime && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-lg">
                <Clock className="w-2.5 h-2.5 text-purple-400" />
                {occurrenceTime}
              </span>
            )}
          </div>

          {/* Status pill */}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
            isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isCompleted ? 'Done' : 'Pending'}
          </span>
        </div>

        {/* Hover Action Icons */}
        <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-0.5 border border-gray-100 shadow-sm">
          <button
            onClick={() => onView(task)}
            className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            title="View details"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
