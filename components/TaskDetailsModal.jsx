'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Tag, CheckCircle2, Edit3, FileText } from 'lucide-react';
import { getTodayString, isToday, isFutureDate } from '@/utils/dateUtils';

export default function TaskDetailsModal({ isOpen, onClose, task, onEdit, onComplete }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const todayStr = getTodayString();
  const taskDateStr = task.date || (task.dates && task.dates[0]?.date) || '';
  const isCompleted = task.status === 'completed';
  const isFuture = taskDateStr ? isFutureDate(taskDateStr) : false;
  const isCompletionDisabled = isFuture;

  let displayDate = 'No date';
  if (taskDateStr) {
    const [y, m, d] = taskDateStr.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    displayDate = isToday(taskDateStr) ? 'Today' : dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  const occurrenceTime = task.time || task.dueTime || '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-white w-full sm:max-w-2xl z-10 shadow-xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="pr-8 flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{task.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {isCompleted ? '✓ Completed' : 'Pending'}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  {task.category || 'Personal'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/80 hover:bg-white rounded-xl text-gray-500 hover:text-gray-700 transition-colors border border-gray-100 shadow-sm flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {task.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-500" />
                  Description
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {taskDateStr && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Scheduled Date</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">{displayDate}</p>
                  </div>
                </div>
              )}

              {occurrenceTime && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-500 font-semibold uppercase tracking-wide">Scheduled Time</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">{occurrenceTime}</p>
                  </div>
                </div>
              )}

              {task.createdAt && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Created</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">{new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            {task.tags && task.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-purple-500" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              onClick={() => { onClose(); onEdit(task); }}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit Task
            </button>
            <button
              onClick={() => { if (!isCompletionDisabled) { onComplete(task._id, !isCompleted); onClose(); } }}
              disabled={isCompletionDisabled}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-sm ${
                isCompletionDisabled
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isCompleted
                    ? 'bg-gray-700 hover:bg-gray-800'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200'
              }`}
              title={isCompletionDisabled ? 'Future tasks cannot be completed before their date' : ''}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'Mark Pending' : 'Mark Complete'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
