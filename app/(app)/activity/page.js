'use client';
import React, { useState, useEffect } from 'react';
import { dashboardApi } from '@/services/dashboardApi';
import { formatDistanceToNow, format, isSameDay, parseISO } from 'date-fns';
import { LogIn, LogOut, Plus, Edit3, Trash2, CheckCircle2, Archive, Tag, Edit, Trash, User, Lock, Settings, CheckSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const { data } = await dashboardApi.getDashboard();
        setActivities(data?.data?.recentActivity || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load activity log');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const getActionConfig = (action) => {
    switch (action) {
      case 'LOGIN': return { icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'LOGOUT': return { icon: LogOut, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'TASK_CREATED': return { icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'TASK_UPDATED': return { icon: Edit3, color: 'text-purple-500', bg: 'bg-purple-50' };
      case 'TASK_DELETED': return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' };
      case 'TASK_COMPLETED': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'TASK_ARCHIVED': return { icon: Archive, color: 'text-gray-500', bg: 'bg-gray-50' };
      case 'CATEGORY_CREATED': return { icon: Tag, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'CATEGORY_UPDATED': return { icon: Edit, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'CATEGORY_DELETED': return { icon: Trash, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'PROFILE_UPDATED': return { icon: User, color: 'text-purple-500', bg: 'bg-purple-50' };
      case 'PASSWORD_CHANGED': return { icon: Lock, color: 'text-purple-500', bg: 'bg-purple-50' };
      case 'SETTINGS_UPDATED': return { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-50' };
      case 'BULK_DELETE': return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' };
      case 'BULK_COMPLETE': return { icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50' };
      default: return { icon: Tag, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return activity.action.startsWith('TASK_') || activity.action.startsWith('BULK_');
    if (filter === 'categories') return activity.action.startsWith('CATEGORY_');
    if (filter === 'account') return ['LOGIN', 'LOGOUT', 'PROFILE_UPDATED', 'PASSWORD_CHANGED', 'SETTINGS_UPDATED'].includes(activity.action);
    return true;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto w-full pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity Log</h1>
        <p className="text-gray-500 text-sm">Track all your recent actions and task changes.</p>
      </div>

      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
        {['all', 'tasks', 'categories', 'account'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors whitespace-nowrap
                    ${filter === f ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No activity yet</h3>
          <p className="text-gray-500">Start by creating a task!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
            {filteredActivities.map((activity, index) => {
              const prevActivity = index > 0 ? filteredActivities[index - 1] : null;
              const showDateSeparator = !prevActivity || !isSameDay(new Date(activity.createdAt), new Date(prevActivity.createdAt));
              
              const config = getActionConfig(activity.action);
              const Icon = config.icon;

              return (
                <React.Fragment key={activity._id}>
                  {showDateSeparator && (
                    <div className="absolute -left-[9px] mt-2 flex items-center -ml-1 w-max">
                      <div className="h-4 w-4 rounded-full bg-gray-200 border-4 border-white" />
                      <span className="ml-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-white py-1">
                        {format(new Date(activity.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  
                  <div className={`relative pl-8 ${showDateSeparator ? 'pt-12' : ''}`}>
                    <div className={`absolute -left-[17px] mt-1.5 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center ${config.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200 shadow-sm">
                          {activity.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{activity.description}</p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">Showing your 10 most recent activities. Activity log is updated in real-time.</p>
          </div>
        </div>
      )}
    </div>
  );
}
