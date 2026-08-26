'use client';

import { Eye, Edit2, Trash2, Calendar, CheckSquare, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';
import { getTodayString, isToday, isFutureDate } from '@/utils/dateUtils';

export default function TaskTable({ tasks, onView, onEdit, onDelete, onComplete, selectedIds = [], onSelectAll, onSelectOne, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm h-64 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return null; // Parent will show EmptyState
  }

  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < tasks.length;

  return (
    <>
      {/* Mobile view */}
      <div className="lg:hidden space-y-4">
        {tasks.map((task) => (
          <TaskCard 
            key={task._id} 
            task={task} 
            onView={onView} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onComplete={onComplete}
          />
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={input => { if (input) input.indeterminate = someSelected; }}
                      onChange={onSelectAll}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                  </div>
                </th>
                <th className="px-6 py-4 font-medium">Task</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Scheduled Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {tasks.map((task) => {
                  const todayStr = getTodayString();
                  const taskDateStr = task.date || (task.dates && task.dates[0]?.date) || '';
                  const isCompleted = task.status === 'completed';
                  const isFuture = taskDateStr ? isFutureDate(taskDateStr) : false;
                  const isCompletionDisabled = isFuture;
                  const isSelected = selectedIds.includes(task._id);

                  let dueText = '-';
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
                    <motion.tr
                      key={task._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-purple-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectOne(task._id, e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3 max-w-md">
                          <button 
                            onClick={() => !isCompletionDisabled && onComplete(task._id, !isCompleted)}
                            disabled={isCompletionDisabled}
                            title={isCompletionDisabled ? "Future tasks cannot be completed before their date" : isCompleted ? "Mark as Non Completed" : "Mark as Completed"}
                            className={`mt-0.5 flex-shrink-0 rounded-md border ${
                              isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-purple-500'
                            } ${isCompletionDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'} w-5 h-5 flex items-center justify-center transition-colors`}
                          >
                            <CheckSquare className={`w-3.5 h-3.5 ${isCompletionDisabled && !isCompleted ? 'text-gray-300' : ''}`} />
                          </button>
                          <div>
                            <div className={`font-medium text-gray-900 ${isCompleted ? 'line-through text-gray-400' : ''} truncate`}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div className={`text-xs text-gray-500 mt-1 line-clamp-1 ${isCompleted ? 'text-gray-400' : ''}`}>
                                {task.description}
                              </div>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {task.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700">
                                    {tag}
                                  </span>
                                ))}
                                {task.tags.length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                    +{task.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {occurrenceTime ? (
                          <div className="flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md max-w-fit">
                            <Clock className="w-3.5 h-3.5 mr-1 text-purple-500" />
                            {occurrenceTime}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {taskDateStr ? (
                          <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            {dueText}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isCompleted ? 'Completed' : 'Non Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onView(task)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit task">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(task._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete task">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

