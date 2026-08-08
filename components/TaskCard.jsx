'use client';

import { format, isPast, isToday } from 'date-fns';
import { motion } from 'framer-motion';
import { Eye, Edit2, Trash2, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';

export default function TaskCard({ task, onView, onEdit, onDelete, onComplete }) {
  const isCompleted = task.status === 'completed';
  
  // Format due date
  let dueText = 'No date';
  let isOverdue = false;
  
  if (task.dueDate) {
    const dDate = new Date(task.dueDate);
    dueText = isToday(dDate) ? 'Today' : format(dDate, 'MMM d, yyyy');
    if (!isCompleted && isPast(dDate) && !isToday(dDate)) {
      isOverdue = true;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      className={`bg-white rounded-2xl p-3 sm:p-4 border transition-all ${
        isCompleted ? 'border-gray-100 opacity-70' : 'border-gray-200'
      }`}
    >
      <div className="flex gap-2 sm:gap-3">
        <button 
          onClick={() => onComplete(task._id, !isCompleted)}
          className="mt-0.5 flex-shrink-0 focus:outline-none"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-500" />
          ) : (
            <Circle className="w-5 sm:w-6 h-5 sm:h-6 text-gray-300 hover:text-purple-500 transition-colors" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm sm:text-base font-semibold truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.title}
          </h4>
          
          {task.description && (
            <p className={`text-xs sm:text-sm mt-1 line-clamp-2 ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-3">
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-purple-50 text-purple-700">
              {task.category || 'Personal'}
            </span>
            
            {task.priority === 'high' && <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-red-50 text-red-700">High</span>}
            {task.priority === 'medium' && <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-amber-50 text-amber-700">Medium</span>}
            {task.priority === 'low' && <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700">Low</span>}
            
            {task.dueDate && (
              <div className={`flex items-center text-[10px] sm:text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                <Calendar className="w-3 h-3 mr-0.5 sm:mr-1" />
                {dueText}
              </div>
            )}
            
            {task.dueTime && (
              <div className="flex items-center text-[10px] sm:text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-0.5 sm:mr-1" />
                {task.dueTime}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-0.5 sm:gap-1 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-50">
        <button onClick={() => onView(task)} className="p-1 sm:p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(task)} className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(task._id)} className="p-1 sm:p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
