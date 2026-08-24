'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Plus } from 'lucide-react';

export default function MultiDatePicker({ value = [], onChange }) {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const addDate = () => {
    const isDuplicate = value.some(d => (d.date || d) === currentDate);
    if (currentDate && !isDuplicate) {
      const newDates = [...value, { date: currentDate, time: currentTime }];
      newDates.sort((a, b) => (a.date || a).localeCompare(b.date || b));
      onChange(newDates);
      setCurrentDate('');
      setCurrentTime('');
    }
  };

  const removeDate = (dateToRemove) => {
    onChange(value.filter(d => (d.date || d) !== dateToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDate();
    }
  };

  return (
    <div className="w-full space-y-3">
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
          disabled={!currentDate || value.some(d => (d.date || d) === currentDate)}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {value.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-500 mb-1">Selected Dates ({value.length})</p>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
            {value.map(item => {
              const dateStr = item.date || item;
              const timeStr = item.time || '';
              return (
                <div key={dateStr} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {timeStr && (
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                        {timeStr}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDate(dateStr)}
                    className="p-1 text-red-400 hover:bg-red-50 rounded-md transition-colors"
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
