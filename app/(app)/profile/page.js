'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/services/profileApi';
import { dashboardApi } from '@/services/dashboardApi';
import { Mail, Calendar, User, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { updateAdminState } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors } } = useForm();
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors }, watch } = useForm();

  const newPassword = watch('newPassword');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, dashboardRes] = await Promise.all([
          profileApi.getProfile(),
          dashboardApi.getDashboard()
        ]);
        
        if (profileRes.data && profileRes.data.data) {
          setProfile(profileRes.data.data.admin);
          setStats(profileRes.data.data.stats);
          resetProfile({
            name: profileRes.data.data.admin.name,
            email: profileRes.data.data.admin.email,
            avatar: profileRes.data.data.admin.avatar || ''
          });
        }
        
        if (dashboardRes.data?.data?.recentActivity) {
          setRecentActivity(dashboardRes.data.data.recentActivity.slice(0, 10));
        }
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [resetProfile]);

  const onProfileSubmit = async (data) => {
    try {
      const res = await profileApi.updateProfile(data);
      const updatedAdmin = res.data?.data || { ...profile, ...data };
      setProfile(updatedAdmin);
      updateAdminState(updatedAdmin);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await profileApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setShowPasswordModal(false);
      resetPassword();
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const completionRate = stats?.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-6 w-full pb-20 lg:pb-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <div className="h-32 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
            <div className="px-6 pb-6 relative">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-3xl font-bold text-purple-700 -mt-12 overflow-hidden bg-white">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(profile.name)
                  )}
                </div>
              </div>
              
              <div className="text-center mt-4">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                  {profile.role || 'User'}
                </div>
              </div>
              
              <div className="mt-6 flex flex-col space-y-3 border-t border-gray-100 pt-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  {profile.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  Member since {formatDate(profile.createdAt)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-3 text-gray-400" />
                  Last login: {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => { setActiveTab('personal'); setEditMode(true); }}
                  className="w-full py-2 px-4 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Content */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium transition-colors ${
                  activeTab === 'personal' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium transition-colors ${
                  activeTab === 'summary' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Task Summary
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium transition-colors ${
                  activeTab === 'activity' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Recent Activity
              </button>
            </div>
            
            <div className="p-6">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Account Details</h3>
                    {!editMode && (
                      <button onClick={() => setEditMode(true)} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {editMode ? (
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input 
                            type="text" 
                            {...registerProfile('name', { required: 'Name is required' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          />
                          {profileErrors.name && <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input 
                            type="email" 
                            {...registerProfile('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          />
                          {profileErrors.email && <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL (Optional)</label>
                          <input 
                            type="text" 
                            {...registerProfile('avatar')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            placeholder="https://example.com/avatar.jpg"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditMode(false);
                            resetProfile({ name: profile.name, email: profile.email, avatar: profile.avatar || '' });
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <div className="text-sm text-gray-500">Full Name</div>
                        <div className="mt-1 text-base font-medium text-gray-900">{profile.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="mt-1 text-base font-medium text-gray-900">{profile.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Role</div>
                        <div className="mt-1 text-base font-medium text-gray-900 capitalize">{profile.role || 'User'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Account Status</div>
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {profile.isActive !== false ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-10 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Password</div>
                        <div className="text-sm text-gray-500 mt-1">Change your password to keep your account secure</div>
                      </div>
                      <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Task Summary Tab */}
              {activeTab === 'summary' && stats && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Task Statistics</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                      <div className="text-purple-500 mb-1 flex justify-center"><CheckCircle className="w-6 h-6" /></div>
                      <div className="text-3xl font-bold text-purple-700">{stats.totalTasks || 0}</div>
                      <div className="text-xs font-medium text-purple-600 uppercase mt-1">Total Tasks</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                      <div className="text-green-500 mb-1 flex justify-center"><CheckCircle className="w-6 h-6" /></div>
                      <div className="text-3xl font-bold text-green-700">{stats.completedTasks || 0}</div>
                      <div className="text-xs font-medium text-green-600 uppercase mt-1">Completed</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                      <div className="text-orange-500 mb-1 flex justify-center"><Clock className="w-6 h-6" /></div>
                      <div className="text-3xl font-bold text-orange-700">{stats.pendingTasks || 0}</div>
                      <div className="text-xs font-medium text-orange-600 uppercase mt-1">Pending</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold text-blue-700">{completionRate}%</div>
                      <div className="text-xs font-medium text-blue-600 uppercase mt-1">Completion Rate</div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Task Breakdown</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Completed</span>
                        <span className="text-gray-500">{stats.completedTasks || 0} tasks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${stats.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Pending</span>
                        <span className="text-gray-500">{stats.pendingTasks || 0} tasks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${stats.totalTasks ? (stats.pendingTasks / stats.totalTasks) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Recent Activity Tab */}
              {activeTab === 'activity' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h3>
                  
                  {recentActivity.length > 0 ? (
                    <div className="relative border-l-2 border-purple-200 ml-3 space-y-6 pb-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow"></div>
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-800">{activity.description || activity.action}</p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {new Date(activity.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent activity found.
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  {...registerPassword('currentPassword', { required: 'Current password is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                {passwordErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  {...registerPassword('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  {...registerPassword('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === newPassword || 'Passwords do not match'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                {passwordErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>}
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
