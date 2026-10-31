'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Tag, CheckCircle2, FolderOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryApi } from '@/services/categoryApi';
import { taskApi } from '@/services/taskApi';
import DeleteModal from '@/components/DeleteModal';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';

const PRESET_COLORS = [
  '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

const CATEGORY_ICONS = ['📚', '💼', '🏥', '💪', '🏠', '⭐', '🛒', '💰', '👨‍👩‍👧', '📝', '🎯', '🔔', '🌱', '✈️', '🎨'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [completedCounts, setCompletedCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
    icon: '',
    description: ''
  });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await categoryApi.getCategories();
      const cats = data?.data || [];
      setCategories(cats);
      
      // Fetch task counts
      const counts = {};
      const completedCountsMap = {};
      await Promise.all(
        cats.map(async (cat) => {
          try {
            const [totalRes, completedRes] = await Promise.all([
              taskApi.getTasks({ category: cat.name, limit: 1 }),
              taskApi.getTasks({ category: cat.name, status: 'completed', limit: 1 }),
            ]);
            counts[cat.name] = totalRes.data?.meta?.total || 0;
            completedCountsMap[cat.name] = completedRes.data?.meta?.total || 0;
          } catch (e) {
            counts[cat.name] = 0;
            completedCountsMap[cat.name] = 0;
          }
        })
      );
      setTaskCounts(counts);
      setCompletedCounts(completedCountsMap);
    } catch (err) {
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({ name: '', color: PRESET_COLORS[0], icon: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditMode(true);
    setEditId(cat._id);
    setFormData({
      name: cat.name || '',
      color: cat.color || PRESET_COLORS[0],
      icon: cat.icon || '',
      description: cat.description || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      if (editMode && editId) {
        await categoryApi.updateCategory(editId, formData);
        toast.success('Category updated successfully!');
      } else {
        await categoryApi.createCategory(formData);
        toast.success('Category created successfully!');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await categoryApi.deleteCategory(deleteId);
      toast.success('Category deleted');
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // Stats
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);
  const catsWithTasks = Object.values(taskCounts).filter(c => c > 0).length;

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <LoadingSkeleton key={i} type="stats" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <LoadingSkeleton key={i} type="table" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={fetchCategories} />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-7 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Categories</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-3">Organize your tasks into categories for better clarity.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-200 transition-all hover:shadow-lg self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Categories</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{categories.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">With Tasks</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{catsWithTasks}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Tasks</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{totalTasks}</p>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create categories to organize your tasks better."
          actionLabel="Add Category"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {categories.map((cat, idx) => {
              const count = taskCounts[cat.name] || 0;
              const completed = completedCounts[cat.name] || 0;
              const pending = count - completed;
              const progress = count > 0 ? Math.round((completed / count) * 100) : 0;
              const catColor = cat.color || PRESET_COLORS[idx % PRESET_COLORS.length];
              
              return (
                <motion.div
                  key={cat._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group transition-all"
                >
                  {/* Color top bar */}
                  <div className="h-1.5 w-full" style={{ background: catColor }} />
                  
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: catColor + '20', border: `1.5px solid ${catColor}30` }}
                        >
                          {cat.icon || '📁'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">{cat.name}</h3>
                          {cat.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(cat._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Task Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-gray-50 rounded-xl py-2 border border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">Total</p>
                        <p className="text-lg font-extrabold text-gray-800">{count}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl py-2 border border-emerald-100">
                        <p className="text-xs text-emerald-500 font-medium">Done</p>
                        <p className="text-lg font-extrabold text-emerald-700">{completed}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl py-2 border border-amber-100">
                        <p className="text-xs text-amber-500 font-medium">Left</p>
                        <p className="text-lg font-extrabold text-amber-700">{pending}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {count > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-semibold text-gray-500">Progress</span>
                          <span className="text-xs font-bold" style={{ color: catColor }}>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, background: catColor }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: formData.color + '20' }}>
                    <Tag className="w-5 h-5" style={{ color: formData.color }} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{editMode ? 'Edit Category' : 'Add Category'}</h2>
                    <p className="text-xs text-gray-500">{editMode ? 'Update category details' : 'Create a new category'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Work, Health, Study..."
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 bg-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of this category..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 bg-white resize-none"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Icon <span className="text-gray-400 font-normal normal-case">(optional emoji)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CATEGORY_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, icon }))}
                        className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl border-2 transition-all ${
                          formData.icon === icon 
                            ? 'border-purple-500 bg-purple-50 scale-110' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                    placeholder="Or type custom emoji/text..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 bg-white"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, color }))}
                        className={`w-8 h-8 rounded-xl border-2 transition-all ${
                          formData.color === color ? 'scale-110 border-gray-800 shadow-md' : 'border-transparent hover:scale-105 border-gray-100'
                        }`}
                        style={{ background: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom, 0px))' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="hidden sm:flex flex-1 items-center justify-center py-2.5 px-4 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 sm:flex-[2] flex items-center justify-center gap-2 py-2.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editMode ? 'Update Category' : 'Create Category'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Category"
        message="Are you sure you want to delete this category? Tasks using this category will not be deleted."
        onConfirm={handleDelete}
        onClose={() => { setShowDeleteModal(false); setDeleteId(null); }}
      />
    </div>
  );
}
