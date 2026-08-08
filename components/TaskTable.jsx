'use client';

import { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Eye, Edit2, Trash2, Calendar, CheckSquare, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';

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
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {tasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const isSelected = selectedIds.includes(task._id);
                  let dueText = '-';
                  let isOverdue = false;
                  
                  if (task.dueDate) {
                    const dDate = new Date(task.dueDate);
                    dueText = isToday(dDate) ? 'Today' : format(dDate, 'MMM d, yyyy');
                    if (!isCompleted && isPast(dDate) && !isToday(dDate)) {
                      isOverdue = true;
                    }
                  }

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
                            onClick={() => onComplete(task._id, !isCompleted)}
                            className={`mt-0.5 flex-shrink-0 rounded-md border ${
                              isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-purple-500'
                            } w-5 h-5 flex items-center justify-center transition-colors`}
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {task.category || 'Personal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-50 text-red-700' :
                          task.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {task.priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.dueDate && (
                          <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            {dueText}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          isOverdue ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {isOverdue && !isCompleted ? 'overdue' : (task.status || 'pending')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onView(task)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(task._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
