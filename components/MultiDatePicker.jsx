'use client';

import { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';

export default function MultiDatePicker({ value = [], onChange }) {
  const [currentDate, setCurrentDate] = useState('');

  const addDate = () => {
    if (currentDate && !value.includes(currentDate)) {
      const newDates = [...value, currentDate].sort();
      onChange(newDates);
      setCurrentDate('');
    }
  };

  const removeDate = (dateToRemove) => {
    onChange(value.filter(d => d !== dateToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDate();
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
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
        <button
          type="button"
          onClick={addDate}
          disabled={!currentDate || value.includes(currentDate)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {value.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-500 mb-1">Selected Dates ({value.length})</p>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
            {value.map(date => (
              <div key={date} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => removeDate(date)}
                  className="p-1 text-red-400 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
