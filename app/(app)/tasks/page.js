'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Filter, X, LayoutGrid, List, CheckSquare, Trash2,
  ArrowUpDown, ChevronDown, SlidersHorizontal, Check, GripVertical,
  RotateCcw, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { taskApi } from '@/services/taskApi';
import { categoryApi } from '@/services/categoryApi';
import DraggableTaskList from '@/components/DraggableTaskList';
import TaskCard from '@/components/TaskCard';
import TaskGridCard from '@/components/TaskGridCard';
import TaskModal from '@/components/TaskModal';
import TaskDetailsModal from '@/components/TaskDetailsModal';
import DeleteModal from '@/components/DeleteModal';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import Pagination from '@/components/Pagination';
import { getTodayString, getTomorrowString, getYesterdayString } from '@/utils/dateUtils';

const DATE_TABS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'history', label: 'History' },
  { key: 'all', label: 'All Dates' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'az', label: 'Title A–Z' },
  { value: 'za', label: 'Title Z–A' },
  { value: 'time', label: 'Scheduled Time' },
];

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 100 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', tags: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [dateView, setDateView] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tasks-view') || 'list';
    }
    return 'list';
  });

  // ─── Reorder mode (proper: save only on Done, Cancel restores) ───
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderTasks, setReorderTasks] = useState([]); // working copy in reorder mode
  const originalOrderRef = useRef([]); // snapshot for Cancel
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  const searchTimeoutRef = useRef(null);
  const activeFilterCount = [filters.status, filters.category, filters.tags].filter(Boolean).length;

  const setViewAndSave = (v) => {
    setView(v);
    if (typeof window !== 'undefined') localStorage.setItem('tasks-view', v);
    if (v === 'grid' && reorderMode) cancelReorder();
  };

  // Apply client-side sorting (not when reorder mode is active)
  const applySorting = (taskList) => {
    if (reorderMode) return taskList; // respect manual order in reorder mode
    const arr = [...taskList];
    switch (sortBy) {
      case 'oldest': return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'az': return arr.sort((a, b) => a.title.localeCompare(b.title));
      case 'za': return arr.sort((a, b) => b.title.localeCompare(a.title));
      case 'time': return arr.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      default: return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const fetchTasks = async (currentSearch = search) => {
    try {
      setLoading(true);
      setError(null);

      const todayStr = getTodayString();
      const tomorrowStr = getTomorrowString();
      const yesterdayStr = getYesterdayString();

      const params = { page, limit: 100, ...filters };
      if (currentSearch) params.search = currentSearch;

      if (dateView === 'today') params.date = todayStr;
      else if (dateView === 'tomorrow') params.date = tomorrowStr;
      else if (dateView === 'yesterday') params.date = yesterdayStr;
      else if (dateView === 'history') params.dateTo = yesterdayStr;
      else if (dateView === 'custom' && customDate) params.date = customDate;

      Object.keys(params).forEach(key => { if (params[key] === '') delete params[key]; });

      const { data } = await taskApi.getTasks(params);
      const fetched = data.data || [];
      setTasks(fetched);
      setMeta(data.meta || { total: 0, page: 1, pages: 1, limit: 100 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await categoryApi.getCategories();
      setCategories(data?.data || []);
    } catch {}
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) { setSearch(urlSearch); setPage(1); fetchTasks(urlSearch); }
    else fetchTasks();
  }, [page, filters, dateView, customDate]);

  useEffect(() => {
    const handler = () => fetchTasks();
    window.addEventListener('tasks-changed', handler);
    return () => window.removeEventListener('tasks-changed', handler);
  }, [page, filters, search, dateView, customDate]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { setPage(1); fetchTasks(value); }, 400);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ status: '', category: '', tags: '' });
    setSearch('');
    setPage(1);
  };

  // ─── Reorder mode management ───
  const enterReorder = () => {
    const sorted = applySorting(tasks);
    originalOrderRef.current = sorted;
    setReorderTasks(sorted);
    setReorderMode(true);
  };

  const cancelReorder = () => {
    setReorderMode(false);
    setReorderTasks([]);
  };

  const saveReorder = async () => {
    setIsSavingOrder(true);
    try {
      const payload = reorderTasks.map((task, index) => ({ id: task._id, sortOrder: index }));
      await taskApi.reorderTasks(payload);
      setTasks(reorderTasks); // commit to main tasks state
      toast.success('Task order saved successfully! 🎉');
      setReorderMode(false);
      setReorderTasks([]);
    } catch (err) {
      toast.error('Unable to save task order. Please try again.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Called by DraggableTaskList when user drops a task (local only, no save yet)
  const handleReorderDrag = (newOrderedTasks) => {
    setReorderTasks(newOrderedTasks);
  };

  // Task operations
  const handleComplete = async (id, isCompleting) => {
    try {
      if (isCompleting) {
        await taskApi.completeTask(id);
        toast.success('Task marked as completed');
      } else {
        await taskApi.pendingTask(id);
        toast.success('Task marked as pending');
      }
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTaskId) return;
    try {
      await taskApi.deleteTask(deleteTaskId);
      toast.success('Task deleted successfully');
      setShowDeleteModal(false);
      setDeleteTaskId(null);
      setSelectedIds(prev => prev.filter(id => id !== deleteTaskId));
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleBulkComplete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await taskApi.bulkComplete(selectedIds);
      toast.success('Selected tasks updated');
      setSelectedIds([]);
      fetchTasks();
    } catch {
      toast.error('Failed to complete selected tasks');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await taskApi.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} tasks deleted`);
      setSelectedIds([]);
      fetchTasks();
    } catch {
      toast.error('Failed to delete selected tasks');
    }
  };

  const toggleSelectOne = (id, checked) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(sid => sid !== id));
  };

  // Which tasks to display (sorted, or reorder working copy)
  const displayTasks = reorderMode ? reorderTasks : applySorting(tasks);

  const taskHandlers = {
    onView: (t) => { setDetailsTask(t); setShowDetailsModal(true); },
    onEdit: (t) => { setEditTask(t); setShowEditModal(true); },
    onDelete: (id) => { setDeleteTaskId(id); setShowDeleteModal(true); },
    onComplete: handleComplete,
  };

  const renderGridGroup = (groupTasks) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {groupTasks.map(task => (
        <TaskGridCard key={task._id} task={task} {...taskHandlers} />
      ))}
    </div>
  );

  const renderListGroup = (groupTasks) => (
    <DraggableTaskList
      tasks={groupTasks}
      {...taskHandlers}
      onReorder={handleReorderDrag}
      reorderMode={reorderMode}
    />
  );

  const renderContent = () => {
    if (loading && tasks.length === 0) {
      return (
        <div className={view === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-3'
        }>
          {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} type="task-card" />)}
        </div>
      );
    }

    if (error) return <ErrorState message={error} onRetry={() => fetchTasks()} />;

    if (displayTasks.length === 0) {
      let emptyTitle = 'No tasks found';
      let emptyDesc = filters.status || search || filters.category
        ? 'Try adjusting your filters or search terms.'
        : 'Get started by creating your first task.';

      if (dateView === 'today' && !search && !filters.status) {
        emptyTitle = 'No tasks for today';
        emptyDesc = 'You have a free schedule today! 🎉';
      } else if ((dateView === 'tomorrow' || dateView === 'custom') && !search && !filters.status) {
        emptyTitle = 'No tasks scheduled for this date.';
        emptyDesc = '';
      }

      return (
        <EmptyState
          title={emptyTitle}
          description={emptyDesc}
          actionLabel="Add Task"
          onAction={() => setShowAddModal(true)}
        />
      );
    }

    if (dateView === 'all') {
      const todayStr = getTodayString();
      const tomorrowStr = getTomorrowString();
      const yesterdayStr = getYesterdayString();

      const grouped = { today: [], tomorrow: [], future: [], yesterday: [], history: [] };
      displayTasks.forEach(task => {
        const d = task.date;
        if (d === todayStr) grouped.today.push(task);
        else if (d === tomorrowStr) grouped.tomorrow.push(task);
        else if (d > tomorrowStr) grouped.future.push(task);
        else if (d === yesterdayStr) grouped.yesterday.push(task);
        else if (d < yesterdayStr) grouped.history.push(task);
      });

      const renderGroup = (title, groupTasks, color = 'purple') => {
        if (groupTasks.length === 0) return null;
        const colorMap = {
          purple: 'bg-purple-100 text-purple-700',
          blue: 'bg-blue-100 text-blue-700',
          amber: 'bg-amber-100 text-amber-700',
          gray: 'bg-gray-100 text-gray-600',
          red: 'bg-red-100 text-red-700'
        };
        return (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 px-1">
              <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">{title}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[color] || colorMap.purple}`}>
                {groupTasks.length}
              </span>
            </div>
            {view === 'grid' ? renderGridGroup(groupTasks) : renderListGroup(groupTasks)}
          </div>
        );
      };

      return (
        <div>
          {renderGroup('Today', grouped.today, 'purple')}
          {renderGroup('Tomorrow', grouped.tomorrow, 'blue')}
          {renderGroup('Upcoming', grouped.future, 'amber')}
          {renderGroup('Yesterday', grouped.yesterday, 'gray')}
          {renderGroup('History', grouped.history, 'red')}
        </div>
      );
    }

    if (view === 'grid') {
      return renderGridGroup(displayTasks);
    }

    return renderListGroup(displayTasks);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4 pb-24 lg:pb-8 w-full max-w-7xl mx-auto">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-7 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Tasks</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 ml-3">Manage and organize your schedule.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk actions */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-xl border border-purple-100"
              >
                <span className="text-sm font-bold text-purple-700">{selectedIds.length} selected</span>
                <div className="h-4 w-px bg-purple-200" />
                <button onClick={handleBulkComplete} className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors" title="Complete Selected">
                  <CheckSquare className="w-4 h-4" />
                </button>
                <button onClick={handleBulkDelete} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Selected">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedIds([])} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reorder Mode — list view only */}
          {view === 'list' && !reorderMode && (
            <button
              onClick={enterReorder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
              title="Enable drag-to-reorder"
            >
              <GripVertical className="w-4 h-4" />
              <span className="hidden xs:inline">Reorder</span>
            </button>
          )}

          {/* Add Task — hidden on mobile (FAB handles it) */}
          <button
            onClick={() => setShowAddModal(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-200 transition-all hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* ─── Reorder Mode Banner ─── */}
      <AnimatePresence>
        {reorderMode && view === 'list' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="reorder-banner flex-wrap gap-3">
              <GripVertical className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-sm">
                Reorder mode — drag the <strong>grip handles</strong> to rearrange, then save.
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={cancelReorder}
                  disabled={isSavingOrder}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-200 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={saveReorder}
                  disabled={isSavingOrder}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
                >
                  {isSavingOrder ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {isSavingOrder ? 'Saving...' : 'Done'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Search + Toolbar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks by title, description, tags..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition-all bg-white"
            />
            {search && (
              <button onClick={() => { setSearch(''); fetchTasks(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right toolbar controls */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all relative ${
                showFilters || activeFilterCount > 0
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort — hidden in reorder mode */}
            {!reorderMode && (
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 cursor-pointer"
                  title="Sort tasks"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            )}

            {/* View toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewAndSave('list')}
                className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewAndSave('grid')}
                className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                    <select
                      value={filters.status || ''}
                      onChange={e => handleFilterChange('status', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="non_completed">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                    <select
                      value={filters.category || ''}
                      onChange={e => handleFilterChange('category', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none"
                    >
                      <option value="">All Categories</option>
                      {(categories.length > 0 ? categories : [
                        { name: 'Study' }, { name: 'Work' }, { name: 'Health' }, { name: 'Fitness' },
                        { name: 'Personal' }, { name: 'Habits' }, { name: 'Shopping' }, { name: 'Finance' },
                        { name: 'Family' }, { name: 'Other' }
                      ]).map(c => {
                        const name = typeof c === 'string' ? c : c.name;
                        return <option key={name} value={name}>{name}</option>;
                      })}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Tags</label>
                    <input
                      type="text"
                      placeholder="Filter by tag..."
                      value={filters.tags || ''}
                      onChange={e => handleFilterChange('tags', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none"
                    />
                  </div>
                </div>

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {filters.status && (
                      <span className="filter-chip">
                        Status: {filters.status === 'non_completed' ? 'Pending' : 'Completed'}
                        <button onClick={() => handleFilterChange('status', '')} className="ml-1"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {filters.category && (
                      <span className="filter-chip">
                        Category: {filters.category}
                        <button onClick={() => handleFilterChange('category', '')} className="ml-1"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {filters.tags && (
                      <span className="filter-chip">
                        Tag: {filters.tags}
                        <button onClick={() => handleFilterChange('tags', '')} className="ml-1"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    <button onClick={resetFilters} className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Date Filter Tabs ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scroll-x pb-1 -mb-1">
        {DATE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setDateView(tab.key); setPage(1); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              dateView === tab.key
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-purple-200'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Custom date picker */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 ml-auto flex-shrink-0">
          <span className="text-xs font-semibold text-gray-500 hidden sm:block">Date:</span>
          <input
            type="date"
            value={customDate}
            onChange={e => { setCustomDate(e.target.value); setDateView('custom'); setPage(1); }}
            className="text-xs border-none focus:ring-0 outline-none text-gray-700 font-semibold bg-transparent w-28 sm:w-auto"
          />
        </div>
      </div>

      {/* ─── Task Count ─── */}
      {!loading && tasks.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500 font-medium">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
          </p>
          <p className="text-xs text-gray-400">
            {view === 'grid' ? 'Grid View' : reorderMode ? '📌 Reorder Mode' : 'List View'}
          </p>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-64"
      >
        {renderContent()}
      </motion.div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={meta.pages} onPageChange={setPage} />
        </div>
      )}

      {/* ─── Modals ─── */}
      {showAddModal && (
        <TaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchTasks(); }}
          categories={categories}
        />
      )}
      {showEditModal && editTask && (
        <TaskModal
          isOpen={showEditModal}
          editTask={editTask}
          onClose={() => { setShowEditModal(false); setEditTask(null); }}
          onSuccess={() => { setShowEditModal(false); setEditTask(null); fetchTasks(); }}
          categories={categories}
        />
      )}
      {showDetailsModal && detailsTask && (
        <TaskDetailsModal
          isOpen={showDetailsModal}
          task={detailsTask}
          onClose={() => { setShowDetailsModal(false); setDetailsTask(null); }}
          onEdit={t => { setShowDetailsModal(false); setEditTask(t); setShowEditModal(true); }}
          onComplete={handleComplete}
        />
      )}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={handleDelete}
          onClose={() => { setShowDeleteModal(false); setDeleteTaskId(null); }}
        />
      )}

      {/* ─── Mobile FAB ─── */}
      <button
        onClick={() => setShowAddModal(true)}
        className="sm:hidden fab"
        aria-label="Add task"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
