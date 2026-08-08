'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Search, Plus, Bell, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationApi } from '@/services/notificationApi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onMenuClick, onAddTask, isCollapsed = false }) {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await notificationApi.getNotifications({ unread: 'true', limit: 1 });
        setUnreadCount(data.meta?.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <header className={`h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-auto z-30 shadow-sm transition-all duration-300 ${isCollapsed ? 'lg:w-[calc(100%-4rem)]' : 'lg:w-[calc(100%-16rem)]'}`}>
      {/* Left: Hamburger + App Title (mobile) + Search (desktop) */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* App title visible only on mobile */}
        <span className="lg:hidden font-bold text-base text-gray-800 flex-shrink-0">TodoApp</span>

        <div className="relative hidden sm:flex items-center max-w-xs w-full">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            onFocus={() => router.push('/tasks')}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Add Task Button */}
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-200 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        )}

        {/* Notifications */}
        <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{admin?.name}</p>
                  <p className="text-xs text-gray-500">{admin?.email}</p>
                </div>
                <div className="p-2">
                  <Link href="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
