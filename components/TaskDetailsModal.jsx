'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Tag, AlertCircle, CheckCircle2, Edit3, Flag } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-2xl z-10 shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-gray-100">
            <div className="pr-8">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{task.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {isCompleted ? 'Completed' : 'Non Completed'}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {task.category || 'Personal'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {task.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {taskDateStr && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3 text-blue-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Scheduled Date</p>
                      <p className="font-semibold text-gray-900">{displayDate}</p>
                    </div>
                  </div>
                )}
                {occurrenceTime && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-3 text-purple-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Time</p>
                      <p className="font-semibold text-gray-900">{occurrenceTime}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    task.priority === 'high' ? 'bg-red-50 text-red-600' :
                    task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Priority</p>
                    <p className="font-semibold text-gray-900 capitalize">{task.priority || 'medium'}</p>
                  </div>
                </div>
                {task.createdAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3 text-gray-600">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Created</p>
                      <p className="font-semibold text-gray-900">{new Date(task.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-gray-400" /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => {
                if (!isCompletionDisabled) {
                  onComplete(task._id, !isCompleted);
                  onClose();
                }
              }}
              disabled={isCompletionDisabled}
              className={`px-4 py-2 rounded-xl font-medium text-white flex items-center gap-2 shadow-sm ${
                isCompletionDisabled 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : isCompleted 
                    ? 'bg-gray-800 hover:bg-gray-900' 
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
              title={isCompletionDisabled ? "Future tasks cannot be completed before their date" : ""}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'Mark Non Completed' : 'Mark Completed'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

