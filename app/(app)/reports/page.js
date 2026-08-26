'use client';
import React, { useState, useEffect } from 'react';
import { reportApi } from '@/services/reportApi';
import { taskApi } from '@/services/taskApi';
import toast from 'react-hot-toast';
import { Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TaskCard from '@/components/TaskCard';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('this_week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
      setError('Failed to load reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period === 'custom' && (!startDate || !endDate)) {
      return;
    }
    fetchReports();
  }, [period, startDate, endDate]);

  const handleExport = () => {
    toast('Export feature coming soon', { icon: '🚧' });
  };

  const handleComplete = async (taskId, isCompleted) => {
    try {
      if (isCompleted) {
        await taskApi.completeTask(taskId);
      } else {
        await taskApi.pendingTask(taskId);
      }
      toast.success(isCompleted ? 'Task completed' : 'Task marked non completed');
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const toggleExpand = (date) => {
    setExpandedDate(prev => (prev === date ? null : date));
  };

  const renderContent = () => {
    if (loading && !reportData) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      );
    }
    
    if (error && !reportData) {
      return (
        <div className="text-center text-red-500 py-10">
          <p>{error}</p>
          <button onClick={fetchReports} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Retry</button>
        </div>
      );
    }

    if (!reportData) return null;

    const { totalTasks, completedTasks, nonCompletedTasks, completionPercentage, dailyReports, monthlyBreakdown, categoryBreakdown, taskDetails } = reportData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total Tasks" value={totalTasks} />
          <StatCard title="Completed" value={completedTasks} color="text-emerald-500" />
          <StatCard title="Non Completed" value={nonCompletedTasks} color="text-red-500" />
          <StatCard title="Completion Rate" value={`${completionPercentage}%`} color="text-purple-600" />
        </div>

        {/* Category Breakdown for Selected Period */}
        {categoryBreakdown && categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Category Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {categoryBreakdown.map(cb => (
                <div key={cb.category} className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-1">
                  <p className="text-xs font-bold text-gray-800 truncate">{cb.category}</p>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-extrabold text-purple-700">{cb.total} tasks</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {cb.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-purple-600 h-full" style={{ width: `${cb.completionPercentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Breakdown for Yearly Report */}
        {monthlyBreakdown && monthlyBreakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Monthly Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyBreakdown.map(mb => (
                <div key={mb.month} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <p className="text-sm font-bold text-purple-900">{mb.month}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                    <span>Total: <b>{mb.total}</b></span>
                    <span>Completed: <b className="text-emerald-600">{mb.completed}</b></span>
                    <span>Non Completed: <b className="text-red-500">{mb.nonCompleted}</b></span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full" style={{ width: `${mb.completionPercentage}%` }}></div>
                  </div>
                  <p className="text-right text-[11px] font-semibold text-purple-700 mt-1">{mb.completionPercentage}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Day-by-Day Breakdown</h2>
          </div>
          
          {(!dailyReports || dailyReports.length === 0) ? (
            <div className="p-8 text-center text-gray-500">
              No task data available for this period.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dailyReports.map((day) => {
                const isExpanded = expandedDate === day.date;
                const dayTasks = (taskDetails || []).filter(t => (t.date || (t.dates && t.dates[0]?.date)) === day.date);

                return (
                  <div key={day.date} className="hover:bg-gray-50 transition-colors">
                    <div 
                      className="p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      onClick={() => toggleExpand(day.date)}
                    >
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {format(parseISO(day.date), 'EEEE, MMM d, yyyy')}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {day.totalTasks} Tasks • {day.completedTasks} Completed • {day.nonCompletedTasks} Non Completed • {day.completionPercentage}% Rate
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600" style={{ width: `${day.completionPercentage}%` }}></div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-700">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 bg-gray-50/50">
                        {dayTasks.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
                          <p className="text-sm text-gray-500 mt-2">No tasks found for this day.</p>
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
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6 w-full pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Dashboard &gt; Reports</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            className="bg-white border border-gray-300 text-gray-700 py-2 px-2 sm:px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year (Yearly)</option>
            <option value="all_time">All Time</option>
            <option value="custom">Custom Date Range</option>
          </select>
          
          {period === 'custom' && (
            <>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-gray-300 text-gray-700 py-2 px-2 sm:px-3 rounded-lg focus:outline-none text-xs sm:text-sm flex-1 sm:flex-none" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-gray-300 text-gray-700 py-2 px-2 sm:px-3 rounded-lg focus:outline-none text-xs sm:text-sm flex-1 sm:flex-none" />
            </>
          )}

          <button onClick={handleExport} className="flex items-center gap-1 sm:gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-2 sm:px-4 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none justify-center">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}

function StatCard({ title, value, color = "text-gray-800" }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className={`text-2xl sm:text-3xl font-bold ${color}`}>{value ?? 0}</div>
    </div>
  );
}
