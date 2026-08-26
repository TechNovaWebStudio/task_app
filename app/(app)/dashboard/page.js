'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Eye, 
  Trash2,
  LogIn,
  Plus,
  Edit,
  Activity,
  Calendar as CalendarIcon,
  Tag,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

import { dashboardApi } from '@/services/dashboardApi';
import { taskApi } from '@/services/taskApi';
import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/StatsCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const { admin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getDashboard();
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleTasksChanged = () => fetchDashboardData();
    window.addEventListener('tasks-changed', handleTasksChanged);
    return () => window.removeEventListener('tasks-changed', handleTasksChanged);
  }, []);

  const handleCompleteTask = async (id) => {
    try {
      await taskApi.completeTask(id);
      toast.success('Task marked as completed');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete task');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats || {};
  const todayTasks = data.todayTasks || [];
  const upcomingTasks = data.upcomingTasks || [];
  const recentActivity = data.recentActivity || [];
  const monthlyProgress = data.monthlyProgress || [];
  const weeklyStats = data.weeklyStats || { total: 0, completed: 0, nonCompleted: 0, completionRate: 0 };
  const monthlyStats = data.monthlyStats || { total: 0, completed: 0, nonCompleted: 0, completionRate: 0 };
  const yearlyStats = data.yearlyStats || { total: 0, completed: 0, nonCompleted: 0, completionRate: 0 };
  const categoryStats = data.categoryStats || [];

  // Safe helper to extract day of month from YYYY-MM-DD string
  const getTaskDayNumber = (t) => {
    const dateStr = t?.date || (t?.dates && t.dates[0]?.date) || t?.dueDate;
    if (!dateStr) return null;
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      return parseInt(parts[2], 10);
    }
    return null;
  };

  // Safe helper to format YYYY-MM-DD date string
  const formatTaskDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return format(d, 'MMM d');
    }
    return String(dateStr);
  };

  // Chart Data
  const doughnutData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [stats.completedTasks || 0, stats.pendingTasks || 0, stats.overdueTasks || 0],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20 },
      },
    },
  };

  const lineData = {
    labels: monthlyProgress.map(d => String(d._id)),
    datasets: [
      {
        label: 'Total Tasks',
        data: monthlyProgress.map(d => d.total || 0),
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Completed',
        data: monthlyProgress.map(d => d.completed || 0),
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        tension: 0.4,
      }
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const getActivityIcon = (action) => {
    switch(action) {
      case 'LOGIN': return <LogIn className="w-4 h-4 text-blue-500" />;
      case 'TASK_CREATED': return <Plus className="w-4 h-4 text-green-500" />;
      case 'TASK_UPDATED': return <Edit className="w-4 h-4 text-orange-500" />;
      case 'TASK_DELETED': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'TASK_COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Activity className="w-4 h-4 text-purple-500" />;
    }
  };

  const now = new Date();
  const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const today = now.getDate();

  // Map day numbers with tasks for mini calendar
  const taskDays = new Set([
    ...todayTasks.map(t => getTaskDayNumber(t)).filter(Boolean),
    ...upcomingTasks.map(t => getTaskDayNumber(t)).filter(Boolean)
  ]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6 w-full pb-20 lg:pb-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {admin?.name || 'Admin'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with your tasks today.</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-base sm:text-lg font-semibold text-gray-800">{format(now, 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-xs sm:text-sm text-gray-500">{format(now, 'h:mm a')}</p>
        </div>
      </div>

      {/* TODAY STAT CARDS */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-200">Today&apos;s Summary ({data.todayStr})</h2>
          <span className="text-xs font-semibold bg-purple-800/80 border border-purple-400/30 text-purple-100 px-3 py-1 rounded-full">
            {stats.todayCompletionRate ?? 0}% Rate
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
            <p className="text-xs text-purple-200 font-medium">Today&apos;s Tasks</p>
            <p className="text-xl font-extrabold mt-1 text-white">{stats.todayTotal ?? todayTasks.length}</p>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md rounded-xl p-3.5 border border-emerald-400/20">
            <p className="text-xs text-emerald-200 font-medium">Completed Today</p>
            <p className="text-xl font-extrabold mt-1 text-emerald-300">{stats.todayCompleted ?? 0}</p>
          </div>
          <div className="bg-amber-500/20 backdrop-blur-md rounded-xl p-3.5 border border-amber-400/20">
            <p className="text-xs text-amber-200 font-medium">Non Completed Today</p>
            <p className="text-xl font-extrabold mt-1 text-amber-300">{stats.todayNonCompleted ?? 0}</p>
          </div>
          <div className="bg-purple-500/20 backdrop-blur-md rounded-xl p-3.5 border border-purple-400/20">
            <p className="text-xs text-purple-200 font-medium">Today&apos;s Completion Rate</p>
            <p className="text-xl font-extrabold mt-1 text-purple-300">{stats.todayCompletionRate ?? 0}%</p>
          </div>
        </div>
      </div>

      {/* OVERALL STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks ?? 0}
          icon={CheckSquare}
          color="purple"
        />
        <StatsCard
          title="Pending Tasks"
          value={stats.pendingTasks ?? 0}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks ?? 0}
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard
          title="Productivity"
          value={`${stats.productivity ?? 0}%`}
          icon={TrendingUp}
          color="blue"
          trend={(stats.productivity || 0) >= (stats.lastMonthProductivity || 0) ? 'up' : 'down'}
          trendValue={`${Math.abs((stats.productivity || 0) - (stats.lastMonthProductivity || 0))}%`}
          trendLabel="vs last month"
        />
      </div>

      {/* PERIOD SUMMARY CARDS (WEEKLY, MONTHLY, YEARLY) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weekly Report */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-600" />
              Weekly Summary
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {weeklyStats.completionRate}%
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{weeklyStats.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Tasks This Week</p>
            </div>
            <div className="text-right text-xs font-medium space-y-0.5">
              <p className="text-emerald-600">✓ {weeklyStats.completed} Completed</p>
              <p className="text-amber-600">• {weeklyStats.nonCompleted} Non Completed</p>
            </div>
          </div>
        </div>

        {/* Monthly Report */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Monthly Summary
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {monthlyStats.completionRate}%
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{monthlyStats.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Tasks This Month</p>
            </div>
            <div className="text-right text-xs font-medium space-y-0.5">
              <p className="text-emerald-600">✓ {monthlyStats.completed} Completed</p>
              <p className="text-amber-600">• {monthlyStats.nonCompleted} Non Completed</p>
            </div>
          </div>
        </div>

        {/* Yearly Report */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Yearly Summary
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {yearlyStats.completionRate}%
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{yearlyStats.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Tasks This Year</p>
            </div>
            <div className="text-right text-xs font-medium space-y-0.5">
              <p className="text-emerald-600">✓ {yearlyStats.completed} Completed</p>
              <p className="text-amber-600">• {yearlyStats.nonCompleted} Non Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY STATISTICS SECTION */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-600" />
              Category Statistics
            </h2>
            <Link href="/categories" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Manage Categories
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categoryStats.map(cat => (
              <div key={cat.category} className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-1">
                <p className="text-xs font-bold text-gray-800 truncate">{cat.category}</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-extrabold text-purple-700">{cat.total}</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {cat.completionRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-purple-600 h-full transition-all" style={{ width: `${cat.completionRate}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TWO COLUMN LAYOUT */}
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
        {/* LEFT COLUMN */}
        <div className="xl:w-[60%] space-y-6">
          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">Today&apos;s Tasks</h2>
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {todayTasks.length}
                </span>
              </div>
              <Link href="/tasks" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View All
              </Link>
            </div>
            
            <div className="p-2">
              {todayTasks.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {todayTasks.slice(0, 8).map(task => (
                    <div key={task._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button 
                          onClick={() => handleCompleteTask(task._id)}
                          disabled={task.status === 'completed'}
                          className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors
                            ${task.status === 'completed' 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-gray-300 hover:border-purple-500'}`}
                        >
                          {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 truncate">
                              {task.category || 'Personal'}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                              {task.priority || 'medium'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 pl-4">
                        {(task.time || task.dueTime) && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.time || task.dueTime}
                          </span>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                          <Link href={`/tasks`} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={CheckSquare}
                  title="No tasks for today"
                  description="You have a free day! Or you can add some new tasks."
                />
              )}
            </div>
          </div>

          {/* Task Completion Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Task Status Overview</h2>
            <div className="relative h-64 w-full flex justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                <span className="text-3xl font-bold text-gray-800">
                  {(stats.totalTasks || 0) > 0 ? Math.round(((stats.completedTasks || 0) / stats.totalTasks) * 100) : 0}%
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:w-[40%] space-y-6">
          
          {/* Mini Calendar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{format(now, 'MMMM yyyy')}</h2>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-semibold text-gray-400 py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              {Array.from({ length: currentMonthDays }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today;
                const hasTask = taskDays.has(day);
                return (
                  <div key={day} className="p-1">
                    <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm relative
                      ${isToday ? 'bg-purple-600 text-white font-bold shadow-md' : 'text-gray-700 font-medium'}`}>
                      {day}
                      {hasTask && !isToday && (
                        <span className="absolute bottom-1 w-1 h-1 bg-purple-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Trend Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Progress Trend</h2>
            <div className="h-48">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Tasks</h2>
              <Link href="/tasks" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                See All
              </Link>
            </div>
            <div className="p-4">
              {upcomingTasks.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTasks.slice(0, 5).map(task => (
                    <div key={task._id} className="flex flex-col gap-1 border-l-2 border-purple-500 pl-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatTaskDate(task.date || task.dueDate)}</span>
                        {(task.time || task.dueTime) && <span>• {task.time || task.dueTime}</span>}
                        <span>• {task.category || 'Personal'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming tasks</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <Link href="/activity" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View All
              </Link>
            </div>
            <div className="p-4">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-gray-100">
                  {recentActivity.slice(0, 8).map(activity => (
                    <div key={activity._id} className="flex gap-3 relative">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center flex-shrink-0 z-10">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm text-gray-800">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
