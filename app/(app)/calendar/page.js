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
import { ChevronLeft, ChevronRight, Plus, Clock, LayoutGrid, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { taskApi } from '@/services/taskApi';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month'); // 'month' or 'week'

  const fetchMonthTasks = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const res = await taskApi.getTasks({ month, year, limit: 200 });
      setTasks(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch calendar tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthTasks(currentMonth);
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(startOfMonth(now));
    setSelectedDate(now);
  };

  // Calendar Grid generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [startDate, endDate]);

  // Tasks filtered for the selected date
  const dayTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const filtered = [];
    tasks.forEach(task => {
      if (task.dates) {
        const dMatch = task.dates.find(d => (d.date || d) === dateStr);
        if (dMatch) {
          filtered.push({ ...task, currentOccurrence: dMatch });
        }
      }
    });
    return filtered;
  }, [tasks, selectedDate]);
  
  const dailyStats = useMemo(() => {
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.currentOccurrence?.completed).length;
    const nonCompleted = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, nonCompleted, progress };
  }, [dayTasks]);

  const getStatusColor = (completed) => {
    return completed ? 'bg-emerald-500' : 'bg-amber-500';
  };

  const getStatusBorder = (completed) => {
    return completed ? 'border-emerald-500' : 'border-amber-500';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-5 w-full pb-20 lg:pb-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
            Calendar
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your tasks by date.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setView('month')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${view === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${view === 'week' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Week
            </button>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 w-32 sm:w-36 text-center text-xs sm:text-base">
              {format(currentMonth, 'MMM yyyy')}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
          
          <button 
            onClick={handleToday}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => fetchMonthTasks(currentMonth)} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1">
          {/* LEFT COLUMN: CALENDAR GRID */}
          <div className="lg:w-[65%] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
              {loading && tasks.length === 0 ? (
                <div className="col-span-7 p-10">
                  <LoadingSkeleton type="cards" />
                </div>
              ) : (
                calendarDays.map((day, i) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isDayToday = isToday(day);
                  
                  const tasksForDay = tasks.filter(t => {
                    if (!t.dates) return false;
                    return t.dates.some(d => (d.date || d) === dayStr);
                  }).map(t => {
                    const occ = t.dates.find(d => (d.date || d) === dayStr);
                    return { ...t, isCompleted: occ?.completed };
                  });
                  const displayTasks = tasksForDay.slice(0, 3);
                  const remainingCount = tasksForDay.length - 3;

                  return (
                    <div 
                      key={dayStr}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[70px] sm:min-h-[90px] md:min-h-[100px] border-b border-r border-gray-50 p-1 sm:p-2 cursor-pointer transition-colors relative group
                        ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white hover:bg-purple-50/30'}
                        ${isSelected ? 'ring-2 ring-inset ring-purple-500 bg-purple-50/10' : ''}
                        ${i % 7 === 6 ? 'border-r-0' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                          ${isDayToday ? 'bg-purple-600 text-white' : 
                            !isCurrentMonth ? 'text-gray-400' : 'text-gray-700 group-hover:text-purple-700'
                          }
                        `}>
                          {format(day, 'd')}
                        </span>
                        
                        {/* Mobile dots indicator */}
                        <div className="md:hidden flex gap-0.5 mt-1">
                          {displayTasks.map((t, idx) => (
                            <span key={idx} className={`w-1.5 h-1.5 rounded-full ${getStatusColor(t.isCompleted)}`}></span>
                          ))}
                        </div>
                      </div>

                      {/* Desktop task list */}
                      <div className="hidden md:flex flex-col gap-1 mt-2">
                        {displayTasks.map(t => (
                          <div 
                            key={t._id} 
                            className={`text-[10px] leading-tight px-1.5 py-1 rounded truncate border-l-2 ${getStatusBorder(t.isCompleted)} bg-gray-50`}
                          >
                            {t.title}
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="text-[10px] font-medium text-gray-500 px-1">
                            +{remainingCount} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: TASK LIST FOR SELECTED DATE */}
          <div className="lg:w-[35%] bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:max-h-[700px]">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center justify-between">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
              </h2>
              {dayTasks.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-medium">
                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <span className="block text-gray-500 mb-1">Total</span>
                    <span className="text-sm font-bold text-gray-900">{dailyStats.total}</span>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                    <span className="block text-emerald-600 mb-1">Completed</span>
                    <span className="text-sm font-bold text-emerald-700">{dailyStats.completed}</span>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                    <span className="block text-amber-600 mb-1">Non Completed</span>
                    <span className="text-sm font-bold text-amber-700">{dailyStats.nonCompleted}</span>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                    <span className="block text-purple-600 mb-1">Progress</span>
                    <span className="text-sm font-bold text-purple-700">{dailyStats.progress}%</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              {loading && tasks.length === 0 ? (
                <LoadingSkeleton type="list" rows={4} />
              ) : dayTasks.length > 0 ? (
                <div className="space-y-3">
                  {dayTasks.map(task => {
                    const isCompleted = task.currentOccurrence?.completed;
                    return (
                    <div 
                      key={task._id} 
                      className={`p-3 rounded-xl border border-gray-100 bg-gray-50 flex gap-3 hover:shadow-md transition-shadow
                        border-l-4 ${getStatusBorder(isCompleted)}
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap capitalize
                            ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                          `}>
                            {isCompleted ? 'Completed' : 'Non Completed'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {task.dueTime && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                              <Clock className="w-3 h-3" />
                              {task.dueTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <EmptyState 
                    icon={LayoutGrid}
                    title="No tasks scheduled"
                    description={`You have no tasks scheduled for ${selectedDate ? format(selectedDate, 'MMM d') : 'this day'}.`}
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <Link 
                href="/tasks"
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
