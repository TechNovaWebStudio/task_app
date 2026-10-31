'use client';
import React, { useState, useEffect } from 'react';
import { reportApi } from '@/services/reportApi';
import { taskApi } from '@/services/taskApi';
import { categoryApi } from '@/services/categoryApi';
import toast from 'react-hot-toast';
import { Download, ChevronDown, ChevronUp, Clock, CheckCircle2, BarChart3, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TaskCard from '@/components/TaskCard';

const PERIOD_OPTIONS = [
  { value: 'all_time', label: 'All History' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

function StatCard({ title, value, color = 'text-gray-800', icon: Icon, iconBg = 'bg-gray-100' }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      {Icon && (
        <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</h3>
        <div className={`text-2xl sm:text-3xl font-extrabold mt-0.5 ${color}`}>{value ?? 0}</div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('all_time');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDate, setExpandedDate] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { period };
      if (period === 'custom') {
        if (startDate) payload.startDate = startDate;
        if (endDate) payload.endDate = endDate;
      }
      const { data } = await reportApi.getReports(payload);
      setReportData(data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load history');
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryApi.getCategories().then(res => {
      setCategories(res.data?.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (period === 'custom' && (!startDate || !endDate)) return;
    fetchReports();
  }, [period, startDate, endDate]);

  const handleExport = () => { toast('Export feature coming soon', { icon: '🚧' }); };

  const handleComplete = async (taskId, isCompleted) => {
    try {
      if (isCompleted) { await taskApi.completeTask(taskId); }
      else { await taskApi.pendingTask(taskId); }
      toast.success(isCompleted ? 'Task completed' : 'Task marked pending');
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const toggleExpand = (date) => setExpandedDate(prev => (prev === date ? null : date));

  const renderContent = () => {
    if (loading && !reportData) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading history...</p>
        </div>
      );
    }

    if (error && !reportData) {
      return (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-red-500 font-semibold">{error}</p>
          <button onClick={fetchReports} className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 text-sm font-semibold">Retry</button>
        </div>
      );
    }

    if (!reportData) return null;

    const { totalTasks, completedTasks, nonCompletedTasks, completionPercentage, dailyReports, categoryBreakdown, taskDetails } = reportData;

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Total Tasks" value={totalTasks} icon={BarChart3} iconBg="bg-purple-100" color="text-purple-700" />
          <StatCard title="Completed" value={completedTasks} icon={CheckCircle2} iconBg="bg-emerald-100" color="text-emerald-600" />
          <StatCard title="Non Completed" value={nonCompletedTasks} icon={Clock} iconBg="bg-amber-100" color="text-amber-600" />
          <StatCard title="Completion Rate" value={`${completionPercentage}%`} icon={BarChart3} iconBg="bg-indigo-100" color="text-indigo-600" />
        </div>

        {/* Completion Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">Overall Completion</h3>
            <span className="text-sm font-extrabold text-purple-700">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{completedTasks} completed</span>
            <span>{nonCompletedTasks} pending</span>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryBreakdown && categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Category History Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {categoryBreakdown.map(cb => (
                <div key={cb.category} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 hover:shadow-sm transition-shadow">
                  <p className="text-xs font-bold text-gray-800 truncate">{cb.category}</p>
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-extrabold text-purple-700">{cb.total}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{cb.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${cb.completionPercentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day-by-Day History Log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Day-by-Day History Log</h2>
            <span className="text-xs text-gray-400 font-medium">{dailyReports?.length || 0} days</span>
          </div>

          {(!dailyReports || dailyReports.length === 0) ? (
            <div className="p-10 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No task history available for this period.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {dailyReports.map((day) => {
                const isExpanded = expandedDate === day.date;
                let dayTasks = (taskDetails || [])
                  .filter(t => (t.date || (t.dates && t.dates[0]?.date)) === day.date)
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                if (statusFilter !== 'all') {
                  dayTasks = dayTasks.filter(t => t.status === statusFilter);
                }
                if (categoryFilter !== 'all') {
                  dayTasks = dayTasks.filter(t => t.category === categoryFilter);
                }

                if ((statusFilter !== 'all' || categoryFilter !== 'all') && dayTasks.length === 0) return null;

                return (
                  <div key={day.date} className="hover:bg-gray-50/80 transition-colors">
                    <div
                      className="px-5 py-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      onClick={() => toggleExpand(day.date)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900">
                          {format(parseISO(day.date), 'EEEE, MMM d, yyyy')}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[11px] text-gray-500 font-medium">{day.totalTasks} Tasks</span>
                          <span className="text-[11px] text-emerald-600 font-semibold">{day.completedTasks} Completed</span>
                          <span className="text-[11px] text-amber-600 font-semibold">{day.nonCompletedTasks} Pending</span>
                          <span className="text-[11px] font-bold text-purple-700">{day.completionPercentage}% Rate</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:block w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${day.completionPercentage}%` }} />
                        </div>
                        <button className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 bg-gray-50/50">
                        {dayTasks.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            {dayTasks.map(task => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                onComplete={handleComplete}
                                onView={() => {}}
                                onEdit={() => {}}
                                onDelete={() => {}}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">No matching tasks found for this day.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6 w-full pb-24 lg:pb-8">
      {/* Premium Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-7 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">History</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-3">Review your past tasks and completion records.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 text-sm font-semibold cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="non_completed">Non Completed</option>
            </select>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 text-sm font-semibold cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Period pill buttons */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                period === opt.value
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {period === 'custom' && (
          <div className="flex flex-wrap gap-2 mt-3">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm flex-1 sm:flex-none" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm flex-1 sm:flex-none" />
          </div>
        )}
      </div>

      {renderContent()}
    </div>
  );
}
