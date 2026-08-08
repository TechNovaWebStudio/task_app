'use client';
import React, { useState, useEffect } from 'react';
import { reportApi } from '@/services/reportApi';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Bar, Pie, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await reportApi.getReports({
        period,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 10
      });
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
    fetchReports();
  }, [period, startDate, endDate, page]);

  const handleExport = () => {
    toast('Export feature coming soon', { icon: '🚧' });
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Task Report' },
    { id: 'categories', label: 'Category Report' },
    { id: 'priorities', label: 'Priority Report' },
    { id: 'productivity', label: 'Productivity' }
  ];

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

    const { stats, categoryBreakdown, priorityBreakdown, dailyTrend, taskDetails } = reportData;

    if (reportType === 'overview') {
      const doughnutData = {
        labels: ['Completed', 'Pending', 'Overdue'],
        datasets: [{
          data: [stats?.completedTasks || 0, stats?.pendingTasks || 0, stats?.overdueTasks || 0],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0,
        }]
      };

      const categoryLabels = categoryBreakdown?.map(c => c._id) || [];
      const categoryData = {
        labels: categoryLabels,
        datasets: [{
          label: 'Tasks',
          data: categoryBreakdown?.map(c => c.total) || [],
          backgroundColor: '#7C3AED',
          borderRadius: 4
        }]
      };

      const priorityData = {
        labels: priorityBreakdown?.map(p => p._id) || [],
        datasets: [{
          data: priorityBreakdown?.map(p => p.total) || [],
          backgroundColor: priorityBreakdown?.map(p => 
            p._id.toLowerCase() === 'high' ? '#EF4444' : 
            p._id.toLowerCase() === 'medium' ? '#F59E0B' : '#10B981'
          ),
          borderWidth: 0
        }]
      };

      const trendData = {
        labels: dailyTrend?.map(d => d._id) || [],
        datasets: [
          {
            label: 'Total',
            data: dailyTrend?.map(d => d.total) || [],
            borderColor: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Completed',
            data: dailyTrend?.map(d => d.completed) || [],
            borderColor: '#10B981',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4
          }
        ]
      };

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
            <StatCard title="Total Tasks" value={stats?.totalTasks} />
            <StatCard title="Pending" value={stats?.pendingTasks} color="text-amber-500" />
            <StatCard title="Completed" value={stats?.completedTasks} color="text-emerald-500" />
            <StatCard title="Overdue" value={stats?.overdueTasks} color="text-red-500" />
            <StatCard title="Completion" value={`${stats?.completionRate || 0}%`} color="text-purple-600" />
            <StatCard title="Avg Time" value={`${stats?.avgCompletionTime || 0}m`} />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Tasks by Status</h3>
                <div className="h-48 sm:h-64 flex items-center justify-center relative">
                  <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, cutout: '70%' }} />
                  <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-lg sm:text-2xl font-bold text-gray-800">{stats?.totalTasks || 0}</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Tasks by Category</h3>
                <div className="h-48 sm:h-64">
                  <Bar data={categoryData} options={{ maintainAspectRatio: false, indexAxis: 'y' }} />
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Tasks by Priority</h3>
                <div className="h-48 sm:h-64">
                  <Pie data={priorityData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Tasks Trend</h3>
                <div className="h-48 sm:h-64">
                  <Line data={trendData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/4">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                <h3 className="text-sm sm:text-lg font-semibold mb-4 sm:mb-6 text-gray-800">Monthly Progress</h3>
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="relative w-32 sm:w-40 h-32 sm:h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" className="stroke-gray-100" strokeWidth="10" fill="none" />
                      <circle cx="50" cy="50" r="45" className="stroke-purple-600 transition-all duration-1000 ease-out" 
                              strokeWidth="10" fill="none" 
                              strokeDasharray={`${(stats?.completionRate || 0) * 2.827} 282.7`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl sm:text-3xl font-bold text-gray-800">{stats?.completionRate || 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-50">
                    <span className="text-xs sm:text-sm text-gray-500">Completed</span>
                    <span className="font-semibold text-emerald-500 text-sm sm:text-base">{stats?.completedTasks || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-50">
                    <span className="text-xs sm:text-sm text-gray-500">Pending</span>
                    <span className="font-semibold text-amber-500 text-sm sm:text-base">{stats?.pendingTasks || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-50">
                    <span className="text-xs sm:text-sm text-gray-500">Overdue</span>
                    <span className="font-semibold text-red-500 text-sm sm:text-base">{stats?.overdueTasks || 0}</span>
                  </div>
                </div>
                <button onClick={() => setReportType('tasks')} className="w-full mt-6 sm:mt-8 py-2 px-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium text-xs sm:text-sm transition-colors">
                  View Full Report
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (reportType === 'tasks') {
      const filteredTasks = (taskDetails || []).filter(t => t.title?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                   className="w-full md:w-64 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Task</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Priority</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Due Date</th>
                  <th className="p-4 font-medium">Completed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No tasks found.</td></tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task._id} className="hover:bg-gray-50 text-sm">
                      <td className="p-4 font-medium text-gray-800">{task.title}</td>
                      <td className="p-4">{typeof task.category === 'object' ? task.category?.name : task.category || 'Personal'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {task.priority || 'medium'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : task.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                          {task.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}</td>
                      <td className="p-4 text-gray-500">{task.completedAt ? format(new Date(task.completedAt), 'MMM d, yyyy') : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 flex justify-between items-center">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50 text-sm">Previous</button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-100 rounded text-sm">Next</button>
          </div>
        </div>
      );
    }

    if (reportType === 'categories') {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium text-right">Total</th>
                  <th className="p-4 font-medium text-right">Completed</th>
                  <th className="p-4 font-medium text-right">Pending</th>
                  <th className="p-4 font-medium text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryBreakdown?.map((cat, idx) => {
                  const pending = cat.total - (cat.completed || 0);
                  const rate = cat.total ? Math.round(((cat.completed || 0) / cat.total) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-gray-50 text-sm">
                      <td className="p-4 font-medium text-gray-800">{cat._id}</td>
                      <td className="p-4 text-right">{cat.total}</td>
                      <td className="p-4 text-right text-emerald-600">{cat.completed || 0}</td>
                      <td className="p-4 text-right text-amber-600">{pending}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600" style={{ width: `${rate}%` }}></div>
                          </div>
                          <span className="w-8 text-right">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (reportType === 'priorities') {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Priority</th>
                  <th className="p-4 font-medium text-right">Count</th>
                  <th className="p-4 font-medium text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priorityBreakdown?.map((p, idx) => {
                  const percent = stats?.totalTasks ? Math.round((p.total / stats.totalTasks) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-gray-50 text-sm">
                      <td className="p-4 font-medium text-gray-800 capitalize">{p._id}</td>
                      <td className="p-4 text-right">{p.total}</td>
                      <td className="p-4 text-right">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (reportType === 'productivity') {
      const trendData = {
        labels: dailyTrend?.map(d => d._id) || [],
        datasets: [{
          label: 'Completed Tasks',
          data: dailyTrend?.map(d => d.completed) || [],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-xl text-white shadow-md">
              <h3 className="text-purple-100 text-sm font-medium mb-1">Completion Rate</h3>
              <div className="text-4xl font-bold">{stats?.completionRate || 0}%</div>
              <p className="text-purple-100 text-sm mt-2">Overall task completion</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Avg Completion Time</h3>
              <div className="text-3xl font-bold text-gray-800">{stats?.avgCompletionTime || 0}m</div>
              <p className="text-gray-400 text-sm mt-2">Time from creation to done</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Productivity Trend</h3>
            <div className="h-80">
              <Line data={trendData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6 w-full pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Dashboard &gt; Reports</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-white border border-gray-300 text-gray-700 py-2 px-2 sm:px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm flex-1 sm:flex-none">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-gray-300 text-gray-700 py-2 px-2 sm:px-3 rounded-lg focus:outline-none text-xs sm:text-sm flex-1 sm:flex-none" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-gray-300 text-gray-700 py-2 px-2 sm:px-3 rounded-lg focus:outline-none text-xs sm:text-sm flex-1 sm:flex-none" />
          <button onClick={handleExport} className="flex items-center gap-1 sm:gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-2 sm:px-4 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none justify-center">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setReportType(tab.id); setPage(1); setSearchTerm(''); }}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
                    ${reportType === tab.id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}

function StatCard({ title, value, color = "text-gray-800" }) {
  return (
    <div className="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
      <h3 className="text-[10px] sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">{title}</h3>
      <div className={`text-xl sm:text-2xl font-bold ${color}`}>{value || 0}</div>
    </div>
  );
}
