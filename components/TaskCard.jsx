'use client';

import { format, isPast, isToday } from 'date-fns';
import { motion } from 'framer-motion';
import { Eye, Edit2, Trash2, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';

export default function TaskCard({ task, currentDateView, onView, onEdit, onDelete, onComplete }) {
  const isCompleted = task.status === 'completed' || 
    (currentDateView && task.dates?.find(d => (d.date || d) === currentDateView)?.completed);
  
  // Format dates
  let dueText = 'No date';
  let isOverdue = false;
  let occurrenceTime = null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = currentDateView && currentDateView > todayStr;
  const isCompletionDisabled = isFuture;
  
  if (task.dates && task.dates.length > 0) {
    if (currentDateView) {
      const occurrence = task.dates.find(d => (d.date || d) === currentDateView);
      if (occurrence && occurrence.time) occurrenceTime = occurrence.time;
    } else {
      occurrenceTime = task.dates[0].time;
    }
  } else {
    occurrenceTime = task.dueTime;
  }
  
  if (task.dates && task.dates.length > 0) {
    if (task.dates.length === 1) {
      const dDate = new Date(task.dates[0].date || task.dates[0]);
      dueText = isToday(dDate) ? 'Today' : format(dDate, 'MMM d');
      if (!isCompleted && isPast(dDate) && !isToday(dDate)) isOverdue = true;
    } else {
      dueText = `${task.dates.length} scheduled dates`;
    }
  } else if (task.dueDate) {
    const dDate = new Date(task.dueDate);
    dueText = isToday(dDate) ? 'Today' : format(dDate, 'MMM d, yyyy');
    if (!isCompleted && isPast(dDate) && !isToday(dDate)) isOverdue = true;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      className={`bg-white rounded-2xl p-4 border transition-all ${
        isCompleted ? 'border-gray-100 opacity-70' : 'border-gray-200'
      }`}
    >
      <div className="flex gap-3">
        <button 
          onClick={() => !isCompletionDisabled && onComplete(task._id, !isCompleted, currentDateView)}
          disabled={isCompletionDisabled}
          className={`mt-0.5 flex-shrink-0 focus:outline-none ${isCompletionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isCompletionDisabled ? "Cannot complete future tasks" : ""}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          ) : (
            <Circle className={`w-6 h-6 transition-colors ${isCompletionDisabled ? 'text-gray-200' : 'text-gray-300 hover:text-purple-500'}`} />
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
                <span key={tag} className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
            {occurrenceTime && (
              <div className="flex items-center font-medium text-gray-700 bg-gray-100/80 px-2 py-1 rounded-md">
                <Clock className="w-4 h-4 mr-1.5 text-purple-500" />
                {occurrenceTime}
              </div>
            )}
            
            <div className={`font-medium px-2 py-1 rounded-md ${isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              Status: {isCompleted ? 'Completed' : 'Non Completed'}
            </div>

            {(task.dates?.length > 0 || task.dueDate) && (
              <div className={`flex items-center ml-auto ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                {dueText}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-gray-50">
        <button onClick={() => onView(task)} className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(task._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
