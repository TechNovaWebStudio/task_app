'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { taskApi } from '@/services/taskApi';
import toast from 'react-hot-toast';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonthTasks = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const res = await taskApi.getTasks({ month, year, limit: 500 });
      setTasks(res.data.data || []);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthTasks(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    const handler = () => fetchMonthTasks(currentMonth);
    window.addEventListener('tasks-changed', handler);
    return () => window.removeEventListener('tasks-changed', handler);
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(startOfMonth(now));
    setSelectedDate(now);
  };

  // Monday-first calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [startDate.getTime(), endDate.getTime()]);

  const dayTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tasks
      .filter(task => (task.date || task.dates?.[0]?.date || task.dates?.[0]) === dateStr)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [tasks, selectedDate]);

  const dailyStats = useMemo(() => {
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.status === 'completed').length;
    const nonCompleted = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, nonCompleted, progress };
  }, [dayTasks]);

  const handleToggleComplete = async (task) => {
    try {
      const isCompleted = task.status === 'completed';
      if (isCompleted) {
        await taskApi.pendingTask(task._id);
        toast.success('Task marked as pending');
      } else {
        await taskApi.completeTask(task._id);
        toast.success('Task completed!');
      }
      fetchMonthTasks(currentMonth);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5 w-full pb-20 lg:pb-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
            <CalendarIcon className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
            Calendar
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">View and manage your tasks by date.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handlePrevMonth}
              className="p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-colors border border-gray-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 min-w-[110px] sm:min-w-[130px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-colors border border-gray-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={handleToday}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            Today
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => fetchMonthTasks(currentMonth)} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 flex-1">
          {/* LEFT COLUMN: CALENDAR GRID */}
          <div className="lg:w-[62%] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              {WEEKDAYS.map((day, i) => (
                <div key={day} className={`py-2.5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                  i >= 5 ? 'text-purple-400' : 'text-gray-500'
                }`}>
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7">
              {loading && tasks.length === 0 ? (
                <div className="col-span-7 p-8">
                  <LoadingSkeleton type="cards" />
                </div>
              ) : (
                calendarDays.map((day, i) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isDayToday = isToday(day);
                  const dayIndex = i % 7; // 0=Mon, 5=Sat, 6=Sun
                  const isWeekend = dayIndex === 5 || dayIndex === 6;
                  
                  const tasksForDay = tasks.filter(t => (t.date || t.dates?.[0]?.date || t.dates?.[0]) === dayStr);
                  const completedCount = tasksForDay.filter(t => t.status === 'completed').length;
                  const pendingCount = tasksForDay.length - completedCount;

                  return (
                    <div 
                      key={dayStr}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[42px] sm:min-h-[72px] md:min-h-[88px] border-b border-r border-gray-100 p-1 sm:p-2 cursor-pointer transition-colors relative
                        ${!isCurrentMonth ? 'bg-gray-50/70' : isSelected ? 'bg-purple-50/60' : 'bg-white hover:bg-purple-50/30'}
                        ${isSelected ? 'ring-2 ring-inset ring-purple-400' : ''}
                        ${i % 7 === 6 ? 'border-r-0' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[11px] sm:text-sm font-semibold transition-all ${
                          isDayToday 
                            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold shadow-sm' 
                            : isSelected && !isDayToday
                            ? 'bg-purple-100 text-purple-700 font-bold'
                            : !isCurrentMonth 
                            ? 'text-gray-400' 
                            : isWeekend
                            ? 'text-purple-400'
                            : 'text-gray-700'
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* Task dots - mobile */}
                      {tasksForDay.length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap">
                          {completedCount > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                          {pendingCount > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          )}
                          {tasksForDay.length > 2 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      )}

                      {/* Task labels - desktop/tablet */}
                      {tasksForDay.length > 0 && (
                        <div className="hidden md:flex flex-col gap-0.5 mt-1">
                          {tasksForDay.slice(0, 2).map(t => (
                            <div 
                              key={t._id} 
                              className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate font-medium border-l-2 ${
                                t.status === 'completed'
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                  : 'border-amber-400 bg-amber-50 text-amber-800'
                              }`}
                            >
                              {t.title}
                            </div>
                          ))}
                          {tasksForDay.length > 2 && (
                            <div className="text-[9px] font-semibold text-gray-500 px-1">
                              +{tasksForDay.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: TASK LIST FOR SELECTED DATE */}
          <div className="lg:w-[38%] bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:max-h-[700px]">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
              </h2>
              {dayTasks.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-medium">
                  <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                    <span className="block text-gray-400 mb-1 text-[10px] uppercase tracking-wide">Total</span>
                    <span className="text-sm font-bold text-gray-900">{dailyStats.total}</span>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
                    <span className="block text-emerald-500 mb-1 text-[10px] uppercase tracking-wide">Done</span>
                    <span className="text-sm font-bold text-emerald-700">{dailyStats.completed}</span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
                    <span className="block text-amber-500 mb-1 text-[10px] uppercase tracking-wide">Left</span>
                    <span className="text-sm font-bold text-amber-700">{dailyStats.nonCompleted}</span>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2 border border-purple-100">
                    <span className="block text-purple-500 mb-1 text-[10px] uppercase tracking-wide">Progress</span>
                    <span className="text-sm font-bold text-purple-700">{dailyStats.progress}%</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
              {loading && tasks.length === 0 ? (
                <LoadingSkeleton type="list" rows={4} />
              ) : dayTasks.length > 0 ? (
                <div className="space-y-3">
                  {dayTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    const isFuture = task.date > format(new Date(), 'yyyy-MM-dd');
                    return (
                      <div 
                        key={task._id} 
                        className={`p-3 rounded-xl border transition-all hover:shadow-sm ${
                          isCompleted 
                            ? 'border-emerald-100 bg-emerald-50/40' 
                            : 'border-amber-100 bg-amber-50/20'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => !isFuture && handleToggleComplete(task)}
                            disabled={isFuture}
                            className={`flex-shrink-0 mt-0.5 transition-all ${isFuture ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isFuture ? 'Cannot complete future tasks' : isCompleted ? 'Mark as pending' : 'Mark as completed'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" style={{width:'18px',height:'18px'}} />
                            ) : (
                              <Circle className={`text-gray-300 hover:text-purple-500 transition-colors`} style={{width:'18px',height:'18px'}} />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {(task.time || task.dueTime) && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                                  <Clock className="w-3 h-3" />
                                  {task.time || task.dueTime}
                                </span>
                              )}
                              {task.category && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                                  {task.category}
                                </span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-semibold ${
                                isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {isCompleted ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <EmptyState 
                    icon={CalendarIcon}
                    title="No tasks scheduled"
                    description={`No tasks for ${selectedDate ? format(selectedDate, 'MMM d') : 'this day'}.`}
                  />
                </div>
              )}
            </div>
            
            {/* Add Task button */}
            <div className="p-4 border-t border-gray-100">
              <Link 
                href="/tasks"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
