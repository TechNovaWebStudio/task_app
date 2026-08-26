'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, X, LayoutGrid, List, CheckSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskApi } from '@/services/taskApi';
import { categoryApi } from '@/services/categoryApi';
import TaskTable from '@/components/TaskTable';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import TaskDetailsModal from '@/components/TaskDetailsModal';
import DeleteModal from '@/components/DeleteModal';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import Pagination from '@/components/Pagination';
import { getTodayString, getTomorrowString, getYesterdayString } from '@/utils/dateUtils';

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 100 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [dateView, setDateView] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('table');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  
  const searchTimeoutRef = useRef(null);

  const fetchTasks = async (currentSearch = search) => {
    try {
      setLoading(true);
      setError(null);
      
      const todayStr = getTodayString();
      const tomorrowStr = getTomorrowString();
      const yesterdayStr = getYesterdayString();

      const params = { page, limit: 100, sortBy: 'createdAt', order: 'desc', ...filters };
      if (currentSearch) params.search = currentSearch;
      
      // Date View Logic
      if (dateView === 'today') {
        params.date = todayStr;
      } else if (dateView === 'tomorrow') {
        params.date = tomorrowStr;
      } else if (dateView === 'yesterday') {
        params.date = yesterdayStr;
      } else if (dateView === 'history') {
        params.dateTo = yesterdayStr;
      } else if (dateView === 'custom' && customDate) {
        params.date = customDate;
      }
      
      // Clean up empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });
      
      const { data } = await taskApi.getTasks(params);
      setTasks(data.data || []);
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
    } catch (err) {
      // Categories optional
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearch(urlSearch);
      setPage(1);
      fetchTasks(urlSearch);
    } else {
      fetchTasks();
    }
  }, [page, filters, dateView, customDate]);

  useEffect(() => {
    const handleTasksChanged = () => fetchTasks();
    window.addEventListener('tasks-changed', handleTasksChanged);
    return () => window.removeEventListener('tasks-changed', handleTasksChanged);
  }, [page, filters, search, dateView, customDate]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchTasks(value);
    }, 400);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ status: '' });
    setSearch('');
    setPage(1);
  };

  // Handlers
  const handleComplete = async (id, isCompleting) => {
    try {
      if (isCompleting) {
        await taskApi.completeTask(id);
        toast.success('Task marked as completed');
      } else {
        await taskApi.pendingTask(id);
        toast.success('Task marked as non_completed');
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to complete selected tasks');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await taskApi.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} tasks deleted successfully`);
      setSelectedIds([]);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete selected tasks');
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(tasks.map(t => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const renderContent = () => {
    if (loading && tasks.length === 0) {
      return (
        <div className="space-y-4">
          <LoadingSkeleton type="table" />
          <LoadingSkeleton type="table" />
          <LoadingSkeleton type="table" />
        </div>
      );
    }

    if (error) {
      return <ErrorState message={error} onRetry={() => fetchTasks()} />;
    }

    if (tasks.length === 0) {
      let emptyTitle = "No tasks found";
      let emptyDesc = filters.status || search
        ? "Try adjusting your filters or search terms." 
        : "Get started by creating your first task.";
        
      if (dateView === 'today' && !search && !filters.status) {
        emptyTitle = "No tasks for today";
        emptyDesc = "You have a free schedule today.";
      } else if ((dateView === 'tomorrow' || dateView === 'custom') && !search && !filters.status) {
        emptyTitle = "No tasks scheduled for this date.";
        emptyDesc = "";
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

      const grouped = {
        today: [],
        tomorrow: [],
        future: [],
        yesterday: [],
        history: []
      };

      tasks.forEach(task => {
        const d = task.date;
        if (d === todayStr) grouped.today.push(task);
        else if (d === tomorrowStr) grouped.tomorrow.push(task);
        else if (d > tomorrowStr) grouped.future.push(task);
        else if (d === yesterdayStr) grouped.yesterday.push(task);
        else if (d < yesterdayStr) grouped.history.push(task);
      });

      // Sort newest created first within each section
      const sortByNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      grouped.today.sort(sortByNewest);
      grouped.tomorrow.sort(sortByNewest);
      grouped.future.sort(sortByNewest);
      grouped.yesterday.sort(sortByNewest);
      grouped.history.sort(sortByNewest);

      const renderGroup = (title, groupTasks) => {
        if (groupTasks.length === 0) return null;
        return (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 px-1">
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {groupTasks.length}
              </span>
            </div>
            {view === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupTasks.map((task) => (
                  <div key={task._id} className="relative group">
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(task._id)}
                        onChange={(e) => toggleSelectOne(task._id, e.target.checked)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 shadow-sm"
                      />
                    </div>
                    <TaskCard
                      task={task}
                      onView={(t) => { setDetailsTask(t); setShowDetailsModal(true); }}
                      onEdit={(t) => { setEditTask(t); setShowEditModal(true); }}
                      onDelete={(id) => { setDeleteTaskId(id); setShowDeleteModal(true); }}
                      onComplete={handleComplete}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <TaskTable
                tasks={groupTasks}
                loading={false}
                selectedIds={selectedIds}
                onSelectAll={toggleSelectAll}
                onSelectOne={toggleSelectOne}
                onView={(t) => { setDetailsTask(t); setShowDetailsModal(true); }}
                onEdit={(t) => { setEditTask(t); setShowEditModal(true); }}
                onDelete={(id) => { setDeleteTaskId(id); setShowDeleteModal(true); }}
                onComplete={handleComplete}
              />
            )}
          </div>
        );
      };

      return (
        <div>
          {renderGroup('TODAY', grouped.today)}
          {renderGroup('TOMORROW', grouped.tomorrow)}
          {renderGroup('OTHER FUTURE TASKS', grouped.future)}
          {renderGroup('YESTERDAY', grouped.yesterday)}
          {renderGroup('PAST TASKS / HISTORY', grouped.history)}
        </div>
      );
    }

    if (view === 'card') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div key={task._id} className="relative group">
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(task._id)}
                  onChange={(e) => toggleSelectOne(task._id, e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 shadow-sm"
                />
              </div>
              <TaskCard
                task={task}
                onView={(t) => { setDetailsTask(t); setShowDetailsModal(true); }}
                onEdit={(t) => { setEditTask(t); setShowEditModal(true); }}
                onDelete={(id) => { setDeleteTaskId(id); setShowDeleteModal(true); }}
                onComplete={handleComplete}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <TaskTable
        tasks={tasks}
        loading={loading}
        selectedIds={selectedIds}
        onSelectAll={toggleSelectAll}
        onSelectOne={toggleSelectOne}
        onView={(t) => { setDetailsTask(t); setShowDetailsModal(true); }}
        onEdit={(t) => { setEditTask(t); setShowEditModal(true); }}
        onDelete={(id) => { setDeleteTaskId(id); setShowDeleteModal(true); }}
        onComplete={handleComplete}
      />
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20 lg:pb-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and organize your schedule.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100"
            >
              <span className="text-sm font-medium text-purple-700">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-purple-200 mx-1"></div>
              <button 
                onClick={handleBulkComplete}
                className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                title="Complete Selected"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button 
                onClick={handleBulkDelete}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors ml-1"
                title="Deselect All"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
          <button
            onClick={() => setShowAddModal(true)}
            className="hidden sm:flex px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-sm items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks by title, description, or tags..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 flex-1 lg:flex-none border rounded-xl flex items-center justify-center gap-2 transition-colors ${
                showFilters || filters.status
                  ? 'bg-purple-50 border-purple-200 text-purple-700 font-medium' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setView('table')}
                className={`p-1.5 rounded-lg transition-colors ${view === 'table' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Table View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('card')}
                className={`p-1.5 rounded-lg transition-colors ${view === 'card' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Card View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status Filter</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="non_completed">Non Completed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Date Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar w-full">
        {[
          { key: 'today', label: 'Today' },
          { key: 'tomorrow', label: 'Tomorrow' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: 'history', label: 'History (Past)' },
          { key: 'all', label: 'All Dates' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => { setDateView(item.key); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              dateView === item.key 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1 ml-auto">
          <span className="text-xs font-medium text-gray-500 pl-1">Date:</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => { 
              setCustomDate(e.target.value); 
              setDateView('custom'); 
              setPage(1); 
            }}
            className="text-sm border-none focus:ring-0 outline-none p-1 text-gray-700 font-medium"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={meta.pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modals */}
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
          onEdit={(t) => {
            setShowDetailsModal(false);
            setEditTask(t);
            setShowEditModal(true);
          }}
          onComplete={handleComplete}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          title="Delete Task"
          message="Are you sure you want to delete this task occurrence? This action cannot be undone."
          onConfirm={handleDelete}
          onClose={() => { setShowDeleteModal(false); setDeleteTaskId(null); }}
        />
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="sm:hidden fixed bottom-20 right-6 z-40 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg shadow-purple-300 flex items-center justify-center hover:bg-purple-700 transition-transform active:scale-95"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}

