'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { taskApi } from '@/services/taskApi';
import { Tag, Search, Hash, Layers, TrendingUp, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TAG_COLORS = [
  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', bar: 'bg-purple-500' },
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', bar: 'bg-blue-500' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', bar: 'bg-emerald-500' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', bar: 'bg-amber-500' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', bar: 'bg-rose-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100', bar: 'bg-cyan-500' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', bar: 'bg-indigo-500' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-100', bar: 'bg-fuchsia-500' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', bar: 'bg-teal-500' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', bar: 'bg-orange-500' },
];

export default function TagsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState([]);
  const [allTasksCount, setAllTasksCount] = useState(0);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const res = await taskApi.getTasks({ limit: 500 });
        if (res.data && res.data.data) {
          const tasks = res.data.data;
          setAllTasksCount(tasks.length);
          const tagMap = new Map();
          tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
              task.tags.forEach(tag => {
                const tagName = tag.trim();
                if (!tagName) return;
                const lowerTag = tagName.toLowerCase();
                if (!tagMap.has(lowerTag)) {
                  tagMap.set(lowerTag, { name: tagName, count: 1, tasks: [task.title] });
                } else {
                  const existing = tagMap.get(lowerTag);
                  existing.count += 1;
                  if (existing.tasks.length < 3) existing.tasks.push(task.title);
                }
              });
            }
          });
          const tagsArray = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
          setTags(tagsArray);
        }
      } catch (error) {
        console.error('Failed to fetch tasks for tags', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const q = search.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  const totalTagRefs = tags.reduce((sum, t) => sum + t.count, 0);
  const mostUsedTag = tags.length > 0 ? tags[0] : null;

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-7 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Tags</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-3">All tags extracted from your tasks.</p>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 bg-white w-full sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Hash className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Tags</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{tags.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total References</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{totalTagRefs}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Most Used</p>
            <p className="text-lg font-extrabold text-gray-900 mt-0.5 truncate">{mostUsedTag ? `#${mostUsedTag.name}` : '–'}</p>
          </div>
        </div>
      </div>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{search ? 'No matching tags' : 'No tags yet'}</h3>
          <p className="text-gray-500 text-sm">{search ? 'Try a different search term.' : 'Add tags to your tasks to see them here.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredTags.map((tag, idx) => {
              const colorScheme = TAG_COLORS[idx % TAG_COLORS.length];
              const maxCount = tags[0]?.count || 1;
              const barWidth = Math.round((tag.count / maxCount) * 100);

              return (
                <motion.div
                  key={tag.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Link
                        href={`/tasks?tags=${encodeURIComponent(tag.name)}`}
                        className="flex items-center gap-1.5 group"
                      >
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${colorScheme.bg} ${colorScheme.text} ${colorScheme.border} group-hover:opacity-80 transition-opacity`}>
                          <Hash className="w-3 h-3" />
                          {tag.name}
                        </span>
                      </Link>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${colorScheme.bg} ${colorScheme.text}`}>
                        {tag.count} {tag.count === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full ${colorScheme.bar} transition-all duration-500`} style={{ width: `${barWidth}%` }} />
                    </div>

                    {/* Sample task titles */}
                    {tag.tasks.length > 0 && (
                      <div className="space-y-1">
                        {tag.tasks.map((title, i) => (
                          <p key={i} className="text-xs text-gray-500 truncate">• {title}</p>
                        ))}
                        {tag.count > tag.tasks.length && (
                          <p className="text-xs text-gray-400 font-medium">+{tag.count - tag.tasks.length} more tasks</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
