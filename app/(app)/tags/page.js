'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { taskApi } from '@/services/taskApi';
import { Tag, Search, Hash, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PASTEL_COLORS = [
  'bg-red-50 text-red-700 border-red-100',
  'bg-orange-50 text-orange-700 border-orange-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-green-50 text-green-700 border-green-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-teal-50 text-teal-700 border-teal-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100',
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-indigo-50 text-indigo-700 border-indigo-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-purple-50 text-purple-700 border-purple-100',
  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  'bg-pink-50 text-pink-700 border-pink-100',
  'bg-rose-50 text-rose-700 border-rose-100',
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
        // Fetch as many tasks as possible to extract tags
        const res = await taskApi.getTasks({ limit: 500 });
        
        if (res.data && res.data.data) {
          const tasks = res.data.data;
          setAllTasksCount(tasks.length);
          
          // Process tags
          const tagMap = new Map();
          
          tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
              task.tags.forEach(tag => {
                const tagName = tag.trim();
                if (!tagName) return;
                
                const lowerTag = tagName.toLowerCase();
                if (!tagMap.has(lowerTag)) {
                  tagMap.set(lowerTag, {
                    name: tagName,
                    count: 1,
                    tasks: [task.title]
                  });
                } else {
                  const existing = tagMap.get(lowerTag);
                  existing.count += 1;
                  if (existing.tasks.length < 3) {
                    existing.tasks.push(task.title);
                  }
                }
              });
            }
          });
          
          // Convert map to array and sort by count descending
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
    const lowerSearch = search.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(lowerSearch));
  }, [tags, search]);

  const mostUsedTag = tags.length > 0 ? tags[0] : null;

  // Simple string hashing function to consistently assign a color to a tag
  const getTagColor = (tagName) => {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PASTEL_COLORS.length;
    return PASTEL_COLORS[index];
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6 w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Tag className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Tags</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">View and manage tags across all your tasks.</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Tags are created when adding tasks. Add tags to tasks to organize them here.</p>
        </div>
        
        <div className="w-full md:w-auto relative">
          <Search className="w-4 sm:w-5 h-4 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm"
          />
        </div>
      </div>

      {/* Stats */}
      {!loading && tags.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Unique Tags</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{tags.length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-full">
              <Hash className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Tagged Tasks</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {tags.reduce((sum, tag) => sum + tag.count, 0)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-50 text-green-600 rounded-full">
              <Tag className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Most Used Tag</p>
              <p className="text-xl font-bold text-gray-900 mt-1 truncate max-w-[150px]">
                {mostUsedTag ? `#${mostUsedTag.name}` : '-'}
              </p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
              <span className="font-bold text-lg">{mostUsedTag ? mostUsedTag.count : 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px] p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Tag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tags yet</h3>
            <p className="text-gray-500 max-w-sm">
              Add tags to your tasks to organize them here. They'll automatically appear on this page.
            </p>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tags found</h3>
            <p className="text-gray-500">No tags match your search "{search}".</p>
            <button 
              onClick={() => setSearch('')}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTags.map((tag, i) => (
              <motion.div 
                key={tag.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <div className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all h-full flex flex-col bg-white hover:border-purple-200">
                  <div className={`p-4 border-b ${getTagColor(tag.name)} flex justify-between items-center transition-colors`}>
                    <h3 className="font-bold text-lg truncate pr-2 flex items-center">
                      <Hash className="w-4 h-4 mr-1 opacity-70" />
                      {tag.name}
                    </h3>
                    <span className="bg-white/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                      {tag.count} {tag.count === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recent Tasks</h4>
                    <ul className="space-y-2 mb-4 flex-1">
                      {tag.tasks.map((taskTitle, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 mr-2 shrink-0"></div>
                          <span className="line-clamp-1">{taskTitle}</span>
                        </li>
                      ))}
                      {tag.count > 3 && (
                        <li className="text-xs text-gray-500 italic ml-3.5 mt-1">
                          + {tag.count - 3} more {tag.count - 3 === 1 ? 'task' : 'tasks'}
                        </li>
                      )}
                    </ul>
                    
                    <Link href={`/tasks?search=${encodeURIComponent(tag.name)}`} className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-center text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors group-hover:bg-purple-50 -mx-4 -mb-4 pb-4">
                      View all tasks <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 text-center">
        <p className="text-sm text-purple-800 flex items-center justify-center gap-2">
          <span className="text-xl">💡</span> To create tags, add them when creating or editing tasks. Tags help you organize tasks across different categories.
        </p>
      </div>
    </div>
  );
}
