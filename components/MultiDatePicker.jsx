'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Plus, Trash2, CalendarDays } from 'lucide-react';
import { getMonthDates, getTodayString } from '@/utils/dateUtils';

export default function MultiDatePicker({ value = [], onChange }) {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [monthPickerValue, setMonthPickerValue] = useState('');

  const addDate = () => {
    if (!currentDate) return;
    const isDuplicate = value.some(d => (typeof d === 'string' ? d : d.date) === currentDate);
    if (!isDuplicate) {
      const newDates = [...value, { date: currentDate, time: currentTime }];
      newDates.sort((a, b) => (typeof a === 'string' ? a : a.date).localeCompare(typeof b === 'string' ? b : b.date));
      onChange(newDates);
      setCurrentDate('');
      setCurrentTime('');
    }
  };

  const addFullMonth = () => {
    if (!monthPickerValue) return;
    const [yearStr, monthStr] = monthPickerValue.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed for getMonthDates
    
    const datesInMonth = getMonthDates(year, month);
    
    const existingDates = new Set(value.map(d => (typeof d === 'string' ? d : d.date)));
    const newDatesToAdd = datesInMonth
      .filter(dateStr => !existingDates.has(dateStr))
      .map(dateStr => ({ date: dateStr, time: currentTime }));
      
    if (newDatesToAdd.length > 0) {
      const newDates = [...value, ...newDatesToAdd];
      newDates.sort((a, b) => (typeof a === 'string' ? a : a.date).localeCompare(typeof b === 'string' ? b : b.date));
      onChange(newDates);
    }
    setMonthPickerValue('');
  };

  const removeDate = (dateToRemove) => {
    onChange(value.filter(d => (typeof d === 'string' ? d : d.date) !== dateToRemove));
  };

  const clearDates = () => {
    onChange([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDate();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Add Single Date & Time */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
          />
        </div>
        <div className="relative flex-[0.7]">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="time"
            value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={addDate}
          disabled={!currentDate || value.some(d => (typeof d === 'string' ? d : d.date) === currentDate)}
          className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Date</span>
        </button>
      </div>

      {/* Add Full Month */}
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
        <span className="text-xs font-semibold text-purple-900 px-1 flex-shrink-0 flex items-center gap-1">
          <CalendarDays className="w-4 h-4 text-purple-600" /> Select Month:
        </span>
        <div className="relative flex-1 w-full">
          <input
            type="month"
            value={monthPickerValue}
            onChange={(e) => setMonthPickerValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={addFullMonth}
          disabled={!monthPickerValue}
          className="px-4 py-2 w-full sm:w-auto bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Full Month</span>
        </button>
      </div>

      {/* Selected Dates Display */}
      {value.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-bold text-gray-700">Selected Dates ({value.length})</p>
            <button 
              type="button" 
              onClick={clearDates}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Dates
            </button>
          </div>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
            {value.map(item => {
              const dateStr = typeof item === 'string' ? item : item.date;
              const timeStr = typeof item === 'object' ? item.time : '';
              
              const [y, m, d] = dateStr.split('-');
              const displayDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <div key={dateStr} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">
                      {displayDate}
                    </span>
                    {timeStr && (
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {timeStr}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDate(dateStr)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove Date"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

