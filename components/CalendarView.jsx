'use client';

import { useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ tasks = [], onDateClick, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900">{format(currentMonth, dateFormat)}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 bg-gray-100 gap-[1px]">
        {days.map((day, idx) => {
          const dayTasks = tasks.filter(t => {
            const d = t.date || t.dueDate || (t.dates && t.dates[0]?.date);
            return d && isSameDay(new Date(d), day);
          });
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <div 
              key={day.toString()}
              onClick={() => onDateClick(day)}
              className={`min-h-[100px] bg-white p-2 cursor-pointer transition-colors ${
                !isCurrentMonth ? 'text-gray-400 bg-gray-50/50' : 'text-gray-900'
              } ${isSelected ? 'ring-2 ring-inset ring-purple-500 bg-purple-50/30' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                  isToday(day) ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : ''
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="mt-2 space-y-1 overflow-y-auto max-h-[60px]">
                {dayTasks.map(task => (
                  <div 
                    key={task._id} 
                    className={`text-[10px] truncate px-1.5 py-0.5 rounded ${
                      task.status === 'completed' ? 'bg-gray-100 text-gray-500 line-through' :
                      task.priority === 'high' ? 'bg-red-50 text-red-700' : 
                      'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
