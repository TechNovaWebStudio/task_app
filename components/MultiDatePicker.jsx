'use client';

import { useState, useMemo } from 'react';
import { X, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Calendar, CheckSquare, Square } from 'lucide-react';
import { getTodayString } from '@/utils/dateUtils';

// ─── Helper functions ────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Get day-of-week index (0=Mon … 6=Sun) for start of month */
function getMonthStartDayIndex(year, month) {
  const d = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon … 6=Sat
  return (d + 6) % 7; // convert to Mon=0 … Sun=6
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function displayDate(dateStr) {
  const { year, month, day } = parseDateStr(dateStr);
  const d = new Date(year, month, day);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function isWeekend(year, month, day) {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6; // Sun or Sat
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MultiDatePicker({ value = [], onChange }) {
  const todayStr = getTodayString();
  const todayParsed = parseDateStr(todayStr);

  const [viewYear, setViewYear] = useState(todayParsed.year);
  const [viewMonth, setViewMonth] = useState(todayParsed.month);
  const [weekdayOnly, setWeekdayOnly] = useState(false);
  const [globalTime, setGlobalTime] = useState('');
  const [showCalendar, setShowCalendar] = useState(true);

  const selectedSet = useMemo(() => new Set(value.map(d => (typeof d === 'string' ? d : d.date))), [value]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startOffset = getMonthStartDayIndex(viewYear, viewMonth);

  // Stats for current view month
  const monthStats = useMemo(() => {
    let weekdays = 0, saturdays = 0, sundays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(viewYear, viewMonth, d).getDay();
      if (dow === 6) saturdays++;
      else if (dow === 0) sundays++;
      else weekdays++;
    }
    const selectedInMonth = Array.from(selectedSet).filter(ds => {
      const p = parseDateStr(ds);
      return p.year === viewYear && p.month === viewMonth;
    }).length;
    return { weekdays, saturdays, sundays, selectedInMonth };
  }, [viewYear, viewMonth, daysInMonth, selectedSet]);

  // Navigation
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const toggleDate = (dateStr) => {
    if (selectedSet.has(dateStr)) {
      onChange(value.filter(d => (typeof d === 'string' ? d : d.date) !== dateStr));
    } else {
      const newList = [...value, { date: dateStr, time: globalTime }];
      newList.sort((a, b) => (typeof a === 'string' ? a : a.date).localeCompare(typeof b === 'string' ? b : b.date));
      onChange(newList);
    }
  };

  const selectAllWeekdays = () => {
    const existing = new Set(value.map(d => (typeof d === 'string' ? d : d.date)));
    const toAdd = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (!isWeekend(viewYear, viewMonth, d)) {
        const ds = toDateStr(viewYear, viewMonth, d);
        if (!existing.has(ds)) {
          toAdd.push({ date: ds, time: globalTime });
        }
      }
    }
    const newList = [...value, ...toAdd];
    newList.sort((a, b) => (typeof a === 'string' ? a : a.date).localeCompare(typeof b === 'string' ? b : b.date));
    onChange(newList);
  };

  const clearMonthDates = () => {
    onChange(value.filter(d => {
      const p = parseDateStr(typeof d === 'string' ? d : d.date);
      return !(p.year === viewYear && p.month === viewMonth);
    }));
  };

  const removeDate = (dateStr) => {
    onChange(value.filter(d => (typeof d === 'string' ? d : d.date) !== dateStr));
  };

  const updateTime = (dateStr, time) => {
    onChange(value.map(d => {
      const ds = typeof d === 'string' ? d : d.date;
      if (ds === dateStr) return { date: ds, time };
      return d;
    }));
  };

  const applyGlobalTime = () => {
    onChange(value.map(d => {
      const ds = typeof d === 'string' ? d : d.date;
      return { date: ds, time: globalTime };
    }));
  };

  const clearAll = () => onChange([]);

  return (
    <div className="w-full space-y-4">

      {/* ── Calendar Header ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Month Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-base font-bold">{MONTH_NAMES[viewMonth]} {viewYear}</p>
            <p className="text-[10px] text-purple-200 mt-0.5">
              {monthStats.selectedInMonth} day{monthStats.selectedInMonth !== 1 ? 's' : ''} selected this month
            </p>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday-only toggle + bulk actions */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setWeekdayOnly(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              weekdayOnly
                ? 'bg-purple-100 border-purple-200 text-purple-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-purple-50'
            }`}
          >
            {weekdayOnly ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            Weekdays Only (Mon–Fri)
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={selectAllWeekdays}
              className="text-xs font-semibold px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Select All Weekdays
            </button>
            <button
              type="button"
              onClick={clearMonthDates}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              Clear Month
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={`text-center py-2 text-[10px] font-bold uppercase tracking-wide ${i >= 5 ? 'text-red-400' : 'text-gray-500'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 p-2 gap-1">
          {/* Empty offset cells */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = toDateStr(viewYear, viewMonth, day);
            const isSelected = selectedSet.has(dateStr);
            const isWknd = isWeekend(viewYear, viewMonth, day);
            const isDisabled = weekdayOnly && isWknd;
            const isPast = dateStr < todayStr;
            const isTdy = dateStr === todayStr;

            return (
              <button
                key={day}
                type="button"
                onClick={() => !isDisabled && toggleDate(dateStr)}
                disabled={isDisabled}
                title={dateStr}
                className={`
                  relative flex items-center justify-center text-xs font-semibold
                  w-full aspect-square rounded-xl transition-all duration-150
                  ${isSelected
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200'
                    : isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isWknd
                    ? 'text-red-400 hover:bg-red-50'
                    : isPast
                    ? 'text-gray-400 hover:bg-gray-100'
                    : 'text-gray-700 hover:bg-purple-100 hover:text-purple-700 cursor-pointer'
                  }
                  ${isTdy && !isSelected ? 'ring-2 ring-purple-500 ring-offset-1' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Month stats */}
        {weekdayOnly && (
          <div className="px-4 py-3 bg-purple-50 border-t border-purple-100">
            <p className="text-xs font-semibold text-purple-700 mb-1">{MONTH_NAMES[viewMonth]} {viewYear} — Weekday Analysis</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-lg p-2 text-center border border-purple-100">
                <p className="text-lg font-extrabold text-purple-700">{monthStats.weekdays}</p>
                <p className="text-[10px] text-gray-500 font-medium">Weekdays</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border border-red-100">
                <p className="text-lg font-extrabold text-red-500">{monthStats.saturdays}</p>
                <p className="text-[10px] text-gray-500 font-medium">Saturdays</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border border-orange-100">
                <p className="text-lg font-extrabold text-orange-500">{monthStats.sundays}</p>
                <p className="text-[10px] text-gray-500 font-medium">Sundays</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Global Time Setter ── */}
      <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl p-3 flex-wrap">
        <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-purple-800 flex-shrink-0">Apply time to all dates:</span>
        <input
          type="time"
          value={globalTime}
          onChange={e => setGlobalTime(e.target.value)}
          className="flex-1 min-w-[120px] px-3 py-1.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="button"
          onClick={applyGlobalTime}
          disabled={!globalTime || value.length === 0}
          className="text-xs font-bold px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          Apply to All
        </button>
      </div>

      {/* ── Selected Dates List ── */}
      {value.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              Selected Dates
              <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{value.length}</span>
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {value.map(item => {
              const dateStr = typeof item === 'string' ? item : item.date;
              const timeStr = typeof item === 'object' ? (item.time || '') : '';
              return (
                <div key={dateStr} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 truncate">{displayDate(dateStr)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <input
                      type="time"
                      value={timeStr}
                      onChange={e => updateTime(dateStr, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 w-[100px]"
                    />
                    <button
                      type="button"
                      onClick={() => removeDate(dateStr)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          Click dates on the calendar to add them. Use &quot;Select All Weekdays&quot; for quick bulk selection.
        </p>
      )}
    </div>
  );
}
