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
  Pencil, 
  Trash2,
  LogIn,
  Plus,
  Edit,
  Activity
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
      setData(res.data.data);
    } catch (err) {
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
      // Update local state instead of full refetch for better UX
      setData(prev => {
        const newData = { ...prev };
        const taskIndex = newData.todayTasks.findIndex(t => t._id === id);
        if (taskIndex !== -1) {
          newData.todayTasks[taskIndex].status = 'completed';
          newData.stats.completedTasks += 1;
          newData.stats.pendingTasks = Math.max(0, newData.stats.pendingTasks - 1);
        }
        return newData;
      });
    } catch (err) {
      toast.error('Failed to complete task');
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

  const { stats, todayTasks, upcomingTasks, recentActivity, monthlyProgress } = data;

  // Chart Data
  const doughnutData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [stats.completedTasks, stats.pendingTasks, stats.overdueTasks],
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
        data: monthlyProgress.map(d => d.total),
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Completed',
        data: monthlyProgress.map(d => d.completed),
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

  const currentMonthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
  const today = new Date().getDate();

  // Tasks mapped by day for the mini calendar
  const taskDays = new Set([
    ...todayTasks.map(t => new Date(t.dueDate).getDate()),
    ...upcomingTasks.map(t => new Date(t.dueDate).getDate())
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
          <p className="text-base sm:text-lg font-semibold text-gray-800">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-xs sm:text-sm text-gray-500">{format(new Date(), 'h:mm a')}</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          color="purple"
        />
        <StatsCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard
          title="Productivity"
          value={`${stats.productivity}%`}
          icon={TrendingUp}
          color="blue"
          trend={stats.productivity >= stats.lastMonthProductivity ? 'up' : 'down'}
          trendValue={`${Math.abs(stats.productivity - stats.lastMonthProductivity)}%`}
          trendLabel="vs last month"
        />
      </div>

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
                        {task.dueTime && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.dueTime}
                          </span>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                          <Link href={`/tasks/${task._id}`} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg">
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
            <h2 className="text-lg font-bold text-gray-900 mb-6">Task Status</h2>
            <div className="relative h-64 w-full flex justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                <span className="text-3xl font-bold text-gray-800">
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">{format(new Date(), 'MMMM yyyy')}</h2>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Trend</h2>
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
                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                        {task.dueTime && <span>• {task.dueTime}</span>}
                        <span>• {task.priority}</span>
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
