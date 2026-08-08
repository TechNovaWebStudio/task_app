'use client';
import React, { useState, useEffect } from 'react';
import { notificationApi } from '@/services/notificationApi';
import { formatDistanceToNow } from 'date-fns';
import { CheckSquare, CheckCircle2, AlertTriangle, Clock, Bell, Trash2, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter === 'unread') params.unread = 'true';
      const { data } = await notificationApi.getNotifications(params);
      setNotifications(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, pages: 1, unreadCount: 0 });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setMeta(prev => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success('All marked as read');
      fetchNotifications();
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'task': return <CheckSquare className="w-5 h-5 text-purple-600" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'reminder': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {meta.unreadCount > 0 && (
            <span className="bg-purple-100 text-purple-700 py-1 px-3 rounded-full text-xs font-semibold">
              {meta.unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button onClick={() => { setFilter('all'); setPage(1); }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              All
            </button>
            <button onClick={() => { setFilter('unread'); setPage(1); }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Unread
            </button>
          </div>
          <button onClick={handleMarkAllRead} className="text-sm text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5">
            Mark all read
          </button>
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications yet</h3>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex gap-4 p-4 rounded-xl border transition-colors ${notif.read ? 'bg-white border-gray-100' : 'bg-purple-50/50 border-purple-100'}`}
              >
                <div className="mt-1 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                    {getIcon(notif.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-1">
                    <h4 className={`text-base ${notif.read ? 'font-medium text-gray-800' : 'font-semibold text-gray-900'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{notif.message}</p>
                  
                  <div className="flex items-center gap-3">
                    {!notif.read && (
                      <button onClick={() => handleMarkRead(notif._id)} className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700">
                        <Check className="w-3.5 h-3.5" /> Mark as read
                      </button>
                    )}
                    <button onClick={() => handleDelete(notif._id)} className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {meta.pages > 1 && (
            <div className="flex justify-between items-center pt-6 pb-2">
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 text-sm font-medium hover:bg-gray-50">
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {meta.pages}</span>
              <button disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 text-sm font-medium hover:bg-gray-50">
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
