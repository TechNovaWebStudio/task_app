'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Calendar, BarChart3, Tag, Tags,
  User, Settings, LogOut, Rocket, X, Bell, Activity, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationApi } from '@/services/notificationApi';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/history', icon: Clock, label: 'History' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
  { href: '/categories', icon: Tag, label: 'Categories' },
  { href: '/tags', icon: Tags, label: 'Tags' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/activity', icon: Activity, label: 'Activity Log' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const pathname = usePathname();
  const { admin, logout, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAuthenticated) return;
      try {
        const { data } = await notificationApi.getNotifications({ unread: 'true', limit: 1 });
        setUnreadCount(data.meta?.unreadCount || 0);
      } catch {}
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white relative">
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-purple-100`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200 shrink-0">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent truncate">
              TodoApp
            </span>
          )}
        </div>
        {/* Mobile close */}
        {!isCollapsed && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-purple-50 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 py-4' : 'p-4'} space-y-1`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isNotification = item.href === '/notifications';
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={`flex items-center gap-3 ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-2.5'} rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <div className="relative shrink-0">
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                {isNotification && unreadCount > 0 && isCollapsed && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {isNotification && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Banner (hidden if collapsed) */}
      {!isCollapsed && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold text-sm">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-purple-200 mb-3">Get unlimited tasks & more.</p>
          <button className="w-full bg-white text-purple-700 text-xs font-semibold py-2 rounded-xl hover:bg-purple-50 transition-colors">
            Upgrade Now
          </button>
        </div>
      )}

      {/* Admin Info */}
      <div className={`p-4 border-t border-purple-100 flex items-center ${isCollapsed ? 'justify-center flex-col gap-3' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{admin?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500 capitalize">{admin?.role || 'Admin'}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Collapse Toggle Button - Desktop Only */}
      <button 
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-500 hover:text-purple-600 hover:border-purple-200 shadow-sm z-10"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 fixed left-0 top-0 bottom-0 z-40 shadow-sm transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-white z-40 lg:hidden shadow-2xl overflow-y-auto"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
