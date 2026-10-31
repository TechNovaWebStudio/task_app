'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Eye,
  Trash2,
  LogIn,
  Plus,
  Edit,
  Activity,
  Calendar as CalendarIcon,
  Tag,
  PieChart,
  BarChart3,
  Target,
  Zap,
  Star
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
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      const h = now.getHours();
      if (h < 12) setGreeting('Good Morning');
      else if (h < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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

  useEffect(() => { fetchDashboardData(); }, []);
  useEffect(() => {
    const handler = () => fetchDashboardData();
    window.addEventListener('tasks-changed', handler);
    return () => window.removeEventListener('tasks-changed', handler);
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
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
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

  const getTaskDayNumber = (t) => {
    const dateStr = t?.date || (t?.dates && t.dates[0]?.date) || t?.dueDate;
    if (!dateStr) return null;
    const parts = String(dateStr).split('T')[0].split('-');
    return parts.length === 3 ? parseInt(parts[2], 10) : null;
  };

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
    datasets: [{
      data: [stats.completedTasks || 0, stats.pendingTasks || 0, stats.overdueTasks || 0],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    cutout: '75%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } } },
    },
  };

  const lineData = {
    labels: monthlyProgress.map(d => String(d._id)),
    datasets: [
      {
        label: 'Total Tasks',
        data: monthlyProgress.map(d => d.total || 0),
        borderColor: '#8B16F9',
        backgroundColor: 'rgba(139, 22, 249, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8B16F9',
        pointRadius: 3,
      },
      {
        label: 'Completed',
        data: monthlyProgress.map(d => d.completed || 0),
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointBackgroundColor: '#10B981',
        pointRadius: 3,
      }
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true, padding: 16 } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
      x: { grid: { display: false } },
    },
  };

  const getActivityIcon = (action) => {
    switch (action) {
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

  const taskDays = new Set([
    ...todayTasks.map(t => getTaskDayNumber(t)).filter(Boolean),
    ...upcomingTasks.map(t => getTaskDayNumber(t)).filter(Boolean)
  ]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6 w-full pb-24 lg:pb-8">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-purple-600 mb-1 uppercase tracking-wide">
            {greeting} 👋
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">
            Welcome back, <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{admin?.name || 'Admin'}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your tasks today.
          </p>
        </div>
        <div className="text-left md:text-right flex-shrink-0">
          <p className="text-base sm:text-lg font-bold text-gray-800">{format(now, 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-lg sm:text-xl font-mono font-bold text-purple-600 tabular-nums mt-0.5">
            {currentTime}
          </p>
        </div>
      </div>

      {/* ─── TODAY'S SUMMARY (Premium Gradient) ─── */}
      <div className="relative bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-purple-300">
                Today&apos;s Summary
              </h2>
              <p className="text-sm text-purple-200 mt-0.5">{data.todayStr}</p>
            </div>
            <span className="text-xs font-bold bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
              {stats.todayCompletionRate ?? 0}% Done
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Today's Tasks", value: stats.todayTotal ?? todayTasks.length, bg: 'bg-white/10', accent: 'text-white', icon: CheckSquare },
              { label: 'Completed Today', value: stats.todayCompleted ?? 0, bg: 'bg-emerald-500/20', accent: 'text-emerald-300', icon: CheckCircle2 },
              { label: 'Non Completed', value: stats.todayNonCompleted ?? 0, bg: 'bg-amber-500/20', accent: 'text-amber-300', icon: Clock },
              { label: 'Completion Rate', value: `${stats.todayCompletionRate ?? 0}%`, bg: 'bg-purple-500/20', accent: 'text-purple-300', icon: Target },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} backdrop-blur-sm rounded-xl p-3.5 border border-white/10`}>
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wide leading-tight">{item.label}</p>
                </div>
                <p className={`text-2xl font-extrabold ${item.accent}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── OVERALL STATS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Total Tasks" value={stats.totalTasks ?? 0} icon={CheckSquare} color="purple" />
        <StatsCard title="Pending Tasks" value={stats.pendingTasks ?? 0} icon={Clock} color="orange" />
        <StatsCard title="Completed Tasks" value={stats.completedTasks ?? 0} icon={CheckCircle2} color="green" />
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

      {/* ─── PERIOD SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Weekly Summary', stats: weeklyStats, icon: CalendarIcon, color: 'purple', bg: 'from-purple-50 to-indigo-50', badge: 'bg-purple-100 text-purple-700' },
          { title: 'Monthly Summary', stats: monthlyStats, icon: BarChart3, color: 'blue', bg: 'from-blue-50 to-cyan-50', badge: 'bg-blue-100 text-blue-700' },
          { title: 'Yearly Summary', stats: yearlyStats, icon: PieChart, color: 'emerald', bg: 'from-emerald-50 to-teal-50', badge: 'bg-emerald-100 text-emerald-700' },
        ].map((p, i) => (
          <div key={i} className={`bg-gradient-to-br ${p.bg} p-5 rounded-2xl border border-white shadow-sm space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <p.icon className="w-4 h-4 text-gray-500" />
                {p.title}
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${p.badge}`}>
                {p.stats.completionRate}%
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-gray-900">{p.stats.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
              </div>
              <div className="text-right text-xs font-semibold space-y-1">
                <div className="flex items-center gap-1.5 justify-end text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  {p.stats.completed} Completed
                </div>
                <div className="flex items-center gap-1.5 justify-end text-amber-600">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  {p.stats.nonCompleted} Pending
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/60 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min(p.stats.completionRate || 0, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ─── CATEGORY STATS ─── */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" />
              Category Statistics
            </h2>
            <Link href="/categories" className="text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors">
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categoryStats.map(cat => (
              <div key={cat.category} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 hover:shadow-sm transition-shadow">
                <p className="text-xs font-bold text-gray-800 truncate">{cat.category}</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-extrabold text-purple-700">{cat.total}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    {cat.completionRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all" style={{ width: `${cat.completionRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TWO COLUMN LAYOUT ─── */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT COLUMN */}
        <div className="xl:w-[60%] space-y-6">

          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Today&apos;s Tasks</h2>
                  <p className="text-xs text-gray-500">Scheduled for {format(now, 'MMM d')}</p>
                </div>
                <span className="ml-2 bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {todayTasks.length}
                </span>
              </div>
              <Link href="/tasks" className="text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors">
                View All →
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {todayTasks.length > 0 ? todayTasks.slice(0, 8).map(task => (
                <div key={task._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/80 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <button
                      onClick={() => handleCompleteTask(task._id)}
                      disabled={task.status === 'completed'}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                      }`}
                    >
                      {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          {task.category || 'Personal'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pl-3">
                    {(task.time || task.dueTime) && (
                      <span className="text-xs text-gray-400 flex items-center gap-1 hidden sm:flex">
                        <Clock className="w-3 h-3" /> {task.time || task.dueTime}
                      </span>
                    )}
                    <Link href="/tasks" className="p-1.5 text-gray-300 group-hover:text-purple-500 rounded-lg hover:bg-purple-50 transition-all opacity-0 group-hover:opacity-100">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="p-8">
                  <EmptyState
                    icon={CheckSquare}
                    title="No tasks for today"
                    description="You have a free day! Or you can add some new tasks."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Task Status Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Task Status Overview</h2>
                <p className="text-xs text-gray-500 mt-0.5">Overall completion breakdown</p>
              </div>
            </div>
            <div className="relative h-64 w-full flex justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
                <span className="text-4xl font-extrabold text-gray-800">
                  {(stats.totalTasks || 0) > 0 ? Math.round(((stats.completedTasks || 0) / stats.totalTasks) * 100) : 0}%
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-1">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:w-[40%] space-y-6">

          {/* Mini Calendar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">{format(now, 'MMMM yyyy')}</h2>
              <Link href="/calendar" className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
                Full View →
              </Link>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-[10px] font-bold text-gray-400 py-1 uppercase">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-1" />
              ))}
              {Array.from({ length: currentMonthDays }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today;
                const hasTask = taskDays.has(day);
                return (
                  <div key={day} className="p-0.5">
                    <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-semibold relative transition-all
                      ${isToday ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200 font-bold' : 'text-gray-700 hover:bg-purple-50 cursor-pointer'}`}
                    >
                      {day}
                      {hasTask && !isToday && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Trend Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Monthly Progress</h2>
                <p className="text-xs text-gray-500 mt-0.5">Tasks vs completions trend</p>
              </div>
            </div>
            <div className="h-48">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Upcoming Tasks</h2>
              </div>
              <Link href="/tasks" className="text-sm text-purple-600 hover:text-purple-700 font-semibold">
                See All →
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {upcomingTasks.length > 0 ? upcomingTasks.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {formatTaskDate(task.date || task.dueDate)}
                      </span>
                      {(task.time || task.dueTime) && <span>• {task.time || task.dueTime}</span>}
                      <span>• {task.category || 'Personal'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">No upcoming tasks</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
              </div>
              <Link href="/activity" className="text-sm text-purple-600 hover:text-purple-700 font-semibold">
                View All →
              </Link>
            </div>
            <div className="p-4">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-gray-100">
                  {recentActivity.slice(0, 8).map(activity => (
                    <div key={activity._id} className="flex gap-3 relative">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="pt-0.5">
                        <p className="text-xs text-gray-800 leading-snug">{activity.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
