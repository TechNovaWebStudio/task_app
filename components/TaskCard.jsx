'use client';

import { motion } from 'framer-motion';
import { Eye, Edit2, Trash2, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';
import { getTodayString, isToday, isFutureDate } from '@/utils/dateUtils';

export default function TaskCard({ task, onView, onEdit, onDelete, onComplete }) {
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      className={`bg-white rounded-2xl p-4 border transition-all ${
        isCompleted ? 'border-gray-100 opacity-75 bg-gray-50/50' : 'border-gray-200'
      }`}
    >
      <div className="flex gap-3">
        <button 
          onClick={() => !isCompletionDisabled && onComplete(task._id, !isCompleted)}
          disabled={isCompletionDisabled}
          className={`mt-0.5 flex-shrink-0 focus:outline-none ${isCompletionDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isCompletionDisabled ? "Future tasks cannot be completed before their date" : isCompleted ? "Mark as Non Completed" : "Mark as Completed"}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          ) : (
            <Circle className={`w-6 h-6 transition-colors ${isCompletionDisabled ? 'text-gray-300' : 'text-gray-300 hover:text-purple-600'}`} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-base font-semibold truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.title}
          </h4>
          
          {task.description && (
            <p className={`text-sm mt-1 line-clamp-2 ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
              {task.description}
            </p>
          )}

          {/* Tags */}
          {(task.tags && task.tags.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs sm:text-sm">
            {occurrenceTime && (
              <div className="flex items-center font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                {occurrenceTime}
              </div>
            )}
            
            <div className={`font-semibold px-2 py-1 rounded-md text-xs ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
              {isCompleted ? 'Completed' : 'Non Completed'}
            </div>

            {taskDateStr && (
              <div className={`flex items-center ml-auto font-medium ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                {dueText}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-gray-100">
        <button onClick={() => onView(task)} className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors" title="View details">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Edit task">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(task._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Delete task">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

