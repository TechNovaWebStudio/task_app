'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, AlignLeft, Tag, FileText, FolderKanban, Loader2, CheckCircle2 } from 'lucide-react';
import { taskApi } from '@/services/taskApi';
import toast from 'react-hot-toast';
import TagInput from './TagInput';
import MultiDatePicker from './MultiDatePicker';

const DEFAULT_CATEGORIES = ['Study', 'Work', 'Health', 'Fitness', 'Personal', 'Habits', 'Shopping', 'Finance', 'Family', 'Other'];

export default function TaskModal({ isOpen, onClose, onSuccess, categories = [], editTask = null }) {
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'Personal',
      dates: [],
      tags: []
    }
  });

  const categoriesList = categories && categories.length > 0
    ? categories.map(c => typeof c === 'string' ? c : c.name)
    : DEFAULT_CATEGORIES;

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      if (editTask) {
        if (editTask.seriesId) {
          setIsLoadingSeries(true);
          taskApi.getSeries(editTask.seriesId).then(res => {
            if (isMounted && res.data && res.data.data) {
              const seriesTasks = res.data.data;
              const mappedDates = seriesTasks.map(t => ({ date: t.date, time: t.time || '' }));
              reset({
                title: editTask.title || '',
                description: editTask.description || '',
                category: editTask.category || 'Personal',
                dates: mappedDates,
                tags: editTask.tags || [],
              });
            }
          }).catch(() => {
            if (isMounted) {
              reset({
                title: editTask.title || '',
                description: editTask.description || '',
                category: editTask.category || 'Personal',
                dates: [{ date: editTask.date, time: editTask.time || '' }],
                tags: editTask.tags || [],
              });
            }
          }).finally(() => {
            if (isMounted) setIsLoadingSeries(false);
          });
        } else {
          reset({
            title: editTask.title || '',
            description: editTask.description || '',
            category: editTask.category || 'Personal',
            dates: [{ date: editTask.date || editTask.dueDate?.split('T')[0], time: editTask.time || editTask.dueTime || '' }],
            tags: editTask.tags || [],
          });
        }
      } else {
        reset({ title: '', description: '', category: 'Personal', tags: [], dates: [] });
      }
    }
    return () => { isMounted = false; };
  }, [editTask, isOpen, reset]);

  const onSubmit = async (formData) => {
    try {
      const payload = { ...formData };

      if (!payload.dates || payload.dates.length === 0) {
        toast.error('Please select at least one date.');
        return;
      }

      if (editTask) {
        await taskApi.updateTask(editTask._id, payload);
        toast.success('Task series updated successfully!');
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full h-[95vh] sm:h-auto sm:max-h-[90vh] max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden rounded-t-3xl"
          >
            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-purple-200">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {editTask ? 'Edit Task' : 'Add New Task'}
                  </h2>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {editTask ? 'Update task series details' : 'Fill in the details to create a new task'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden relative">
              {/* Loading overlay for series fetch */}
              {isLoadingSeries && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  <p className="text-sm text-gray-600 font-medium">Loading task series...</p>
                </div>
              )}

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                {/* ── Task Title ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      {...register('title', { required: 'Task title is required', maxLength: { value: 200, message: 'Title too long' } })}
                      placeholder="Enter task title..."
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all bg-white ${
                        errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.title && <p className="text-xs text-red-500 mt-1 font-medium">{errors.title.message}</p>}
                </div>

                {/* ── Description ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    <textarea
                      {...register('description')}
                      placeholder="Describe the task in detail..."
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all resize-none bg-white"
                    />
                  </div>
                </div>

                {/* ── Category ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-purple-600" />
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 bg-white transition-all cursor-pointer"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* ── Tags ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    Tags <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                      <TagInput value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>

                {/* ── Scheduled Dates ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Scheduled Dates <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="dates"
                    control={control}
                    render={({ field }) => (
                      <MultiDatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>

              </div>

              {/* ── Footer ── */}
              <div className="flex-shrink-0 flex gap-3 px-5 py-4 border-t border-gray-100 bg-white"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:flex flex-1 items-center justify-center py-2.5 px-4 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingSeries}
                  className="flex-1 sm:flex-none sm:flex-[2] flex items-center justify-center gap-2 py-2.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editTask ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {editTask ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
