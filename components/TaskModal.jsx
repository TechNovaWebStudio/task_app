'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Clock, AlignLeft, Tag, Flag, FileText } from 'lucide-react';
import { taskApi } from '@/services/taskApi';
import toast from 'react-hot-toast';
import TagInput from './TagInput';
import MultiDatePicker from './MultiDatePicker';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];

export default function TaskModal({ isOpen, onClose, onSuccess, categories = [], editTask = null }) {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      dates: [],
      tags: []
    }
  });

  useEffect(() => {
    if (editTask) {
      const initialDates = editTask.dates && editTask.dates.length > 0 
        ? editTask.dates.map(d => typeof d === 'string' ? { date: d, time: '' } : { date: d.date, time: d.time || '' })
        : (editTask.dueDate ? [{ date: new Date(editTask.dueDate).toISOString().split('T')[0], time: editTask.dueTime || '' }] : []);
      
      reset({
        title: editTask.title,
        description: editTask.description,
        dates: initialDates,
        tags: editTask.tags || [],
      });
    } else {
      reset({ tags: [], dates: [] });
    }
  }, [editTask, isOpen, reset]);

  const onSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
      };

      if (payload.dates && payload.dates.length > 0) {
        payload.dueDate = payload.dates[0].date;
        payload.dueTime = payload.dates[0].time;
      }

      if (editTask) {
        await taskApi.updateTask(editTask._id, payload);
        toast.success('Task updated successfully!');
      } else {
        await taskApi.createTask(payload);
        toast.success('Task created successfully!');
      }

      onSuccess?.();
      window.dispatchEvent(new Event('tasks-changed'));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%', scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '100%', scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full h-[90vh] sm:h-auto sm:max-h-[90vh] max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden rounded-t-2xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editTask ? 'Edit Task' : 'Add New Task'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                  {editTask ? 'Update task details' : 'Fill in the details to create a new task'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-8 custom-scrollbar">
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...register('title', { required: 'Task title is required' })}
                      placeholder="Enter task title..."
                      className={`w-full pl-10 pr-4 py-3 sm:py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
                    />
                  </div>
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3.5 sm:top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      {...register('description')}
                      placeholder="Describe the task..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Dates & Tags */}
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/50 space-y-5">
                  {/* Dates */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Scheduled Dates</label>
                    <Controller
                      name="dates"
                      control={control}
                      render={({ field }) => (
                        <MultiDatePicker value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
                    <Controller
                      name="tags"
                      control={control}
                      render={({ field }) => (
                        <TagInput value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </div>
                </div>


                </div>

              {/* Footer */}
              <div className="flex-shrink-0 flex gap-3 px-5 py-4 sm:border-t border-gray-100 bg-white sm:bg-gray-50 pb-safe pb-8 sm:pb-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:block flex-1 py-3 sm:py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] sm:flex-1 py-3 sm:py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-200 disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
