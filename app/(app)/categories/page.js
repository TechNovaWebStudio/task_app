'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, ShieldAlert, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryApi } from '@/services/categoryApi';
import { taskApi } from '@/services/taskApi';
import DeleteModal from '@/components/DeleteModal';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';

const PRESET_COLORS = [
  '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
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
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await categoryApi.getCategories();
      const cats = data?.data || [];
      setCategories(cats);
      
      // Fetch task counts
      const counts = {};
      await Promise.all(
        cats.map(async (cat) => {
          try {
            const res = await taskApi.getTasks({ category: cat.name, limit: 1 });
            counts[cat.name] = res.data?.meta?.total || 0;
          } catch (e) {
            counts[cat.name] = 0;
          }
        })
      );
      setTaskCounts(counts);
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
    setFormData({
      name: '',
      color: PRESET_COLORS[0],
      icon: '',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditMode(true);
    setEditId(category._id);
    setFormData({
      name: category.name || '',
      color: category.color || PRESET_COLORS[0],
      icon: category.icon || '',
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editMode) {
        await categoryApi.updateCategory(editId, formData);
        toast.success('Category updated successfully');
      } else {
        await categoryApi.createCategory(formData);
        toast.success('Category created successfully');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await categoryApi.deleteCategory(deleteId);
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <LoadingSkeleton type="text" className="w-40 h-8" />
            <LoadingSkeleton type="text" className="w-60 h-4 mt-2" />
          </div>
          <LoadingSkeleton type="button" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <LoadingSkeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchCategories} />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20 lg:pb-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your task categories and tags.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2 font-medium text-sm"
        >
          <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((category) => (
          <motion.div
            key={category._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-3">
              <div 
                className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm flex-shrink-0"
                style={{ backgroundColor: category.color || '#7C3AED' }}
              >
                {category.icon ? (
                  <span className="text-lg sm:text-xl">{category.icon}</span>
                ) : (
                  category.name.charAt(0).toUpperCase()
                )}
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {category.isDefault && (
                  <span className="bg-gray-100 text-gray-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium" title="Default Category">
                    Default
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg line-clamp-1" title={category.name}>
                {category.name}
              </h3>
              {category.description && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                {taskCounts[category.name] !== undefined ? taskCounts[category.name] : '-'} tasks
              </div>
              
              <div className="flex items-center gap-0.5 sm:gap-1">
                <button
                  onClick={() => openEditModal(category)}
                  className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(category._id)}
                  disabled={category.isDefault}
                  className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                    category.isDefault 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={category.isDefault ? "Cannot delete default category" : "Delete category"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editMode ? 'Edit Category' : 'Add Category'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="e.g., Work, Personal, Shopping"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                      >
                        {formData.color === color && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 p-1 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-sm text-gray-500 uppercase">{formData.color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emoji Icon (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-xl"
                    placeholder="💼"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pick a single emoji character</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={100}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                    placeholder="Short description..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                  >
                    {editMode ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          title="Delete Category"
          message="Are you sure you want to delete this category? Tasks associated with it will not be deleted, but will lose this category tag."
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
