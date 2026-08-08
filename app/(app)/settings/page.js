'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi } from '@/services/settingsApi';
import { profileApi } from '@/services/profileApi';
import { 
  User, Lock, Bell, Palette, Globe, Shield, 
  Database, HardDrive, Save
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { updateAdminState } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('account');
  const [saving, setSaving] = useState(false);

  // Forms
  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors } } = useForm();
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors }, watch } = useForm();
  
  const newPassword = watch('newPassword');

  // Notifications State (managed manually for toggle switches)
  const [notifSettings, setNotifSettings] = useState({
    notificationsEnabled: true,
    emailNotifications: true,
    taskReminders: true,
    weeklyReport: false
  });

  // Appearance & Regional State
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // Fetch profile to populate account settings
        const profileRes = await profileApi.getProfile();
        if (profileRes.data && profileRes.data.data) {
          resetProfile({
            name: profileRes.data.data.admin.name,
            email: profileRes.data.data.admin.email
          });
        }

        // Fetch user settings
        const settingsRes = await settingsApi.getSettings();
        if (settingsRes.data && settingsRes.data.data) {
          const s = settingsRes.data.data;
          setSettings(s);
          
          setNotifSettings({
            notificationsEnabled: s.notificationsEnabled ?? true,
            emailNotifications: s.emailNotifications ?? true,
            taskReminders: s.taskReminders ?? true,
            weeklyReport: s.weeklyReport ?? false
          });

          setAppSettings({
            theme: s.theme || 'light',
            timezone: s.timezone || 'UTC',
            dateFormat: s.dateFormat || 'MM/DD/YYYY',
            timeFormat: s.timeFormat || '12h',
            language: s.language || 'en'
          });
        }
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [resetProfile]);

  const onProfileSubmit = async (data) => {
    try {
      setSaving(true);
      const res = await profileApi.updateProfile(data);
      const updatedAdmin = res.data?.data;
      if (updatedAdmin) updateAdminState(updatedAdmin);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setSaving(true);
      await profileApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      resetPassword();
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (updates) => {
    try {
      setSaving(true);
      await settingsApi.updateSettings(updates);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifToggle = (key) => {
    const newValue = !notifSettings[key];
    const newSettings = { ...notifSettings, [key]: newValue };
    setNotifSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleAppSettingChange = (e) => {
    const { name, value } = e.target;
    const newSettings = { ...appSettings, [name]: value };
    setAppSettings(newSettings);
    // Auto-save on change
    saveSettings({ [name]: value });
  };

  const ToggleSwitch = ({ value, onChange }) => (
    <button 
      type="button"
      onClick={onChange} 
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${value ? 'bg-purple-600' : 'bg-gray-200'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  const sections = [
    { id: 'account', label: 'Profile Settings', icon: <User className="w-5 h-5" /> },
    { id: 'password', label: 'Change Password', icon: <Lock className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
    { id: 'region', label: 'Language & Region', icon: <Globe className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'data', label: 'Data Management', icon: <Database className="w-5 h-5" /> },
    { id: 'backup', label: 'Backup & Restore', icon: <HardDrive className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-6 w-full pb-20 lg:pb-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Nav */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <nav className="flex flex-col p-2 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`mr-3 ${activeSection === section.id ? 'text-purple-600' : 'text-gray-400'}`}>
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Right Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
            <div className="p-6 md:p-8">
              
              {/* Account Section */}
              {activeSection === 'account' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        {...registerProfile('email', { required: 'Email is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      />
                      {profileErrors.email && <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>}
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Password Section */}
              {activeSection === 'password' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        {...registerPassword('currentPassword', { required: 'Required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                      />
                      {passwordErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input 
                        type="password" 
                        {...registerPassword('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                      />
                      {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        {...registerPassword('confirmPassword', { 
                          required: 'Required',
                          validate: val => val === newPassword || 'Passwords do not match'
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                      />
                      {passwordErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>}
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h3 className="font-medium text-gray-900">Enable All Notifications</h3>
                        <p className="text-sm text-gray-500 mt-1">Master switch for all system notifications</p>
                      </div>
                      <ToggleSwitch value={notifSettings.notificationsEnabled} onChange={() => handleNotifToggle('notificationsEnabled')} />
                    </div>
                    
                    <div className={`space-y-4 ${!notifSettings.notificationsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-500">Receive daily summaries and alerts via email</p>
                        </div>
                        <ToggleSwitch value={notifSettings.emailNotifications} onChange={() => handleNotifToggle('emailNotifications')} />
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-medium text-gray-900">Task Reminders</h3>
                          <p className="text-sm text-gray-500">Get notified when tasks are due soon</p>
                        </div>
                        <ToggleSwitch value={notifSettings.taskReminders} onChange={() => handleNotifToggle('taskReminders')} />
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h3 className="font-medium text-gray-900">Weekly Report</h3>
                          <p className="text-sm text-gray-500">Receive a weekly digest of your productivity</p>
                        </div>
                        <ToggleSwitch value={notifSettings.weeklyReport} onChange={() => handleNotifToggle('weeklyReport')} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Appearance</h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Theme Preference</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${appSettings.theme === 'light' ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                          <input type="radio" name="theme" value="light" checked={appSettings.theme === 'light'} onChange={handleAppSettingChange} className="sr-only" />
                          <span className="flex flex-1">
                            <span className="flex flex-col">
                              <span className="block text-sm font-medium text-gray-900">Light Mode</span>
                              <span className="mt-1 flex items-center text-sm text-gray-500">Default bright interface</span>
                            </span>
                          </span>
                          <CheckCircleIcon className={`h-5 w-5 ${appSettings.theme === 'light' ? 'text-purple-600' : 'hidden'}`} />
                        </label>
                        
                        <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${appSettings.theme === 'dark' ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                          <input type="radio" name="theme" value="dark" checked={appSettings.theme === 'dark'} onChange={handleAppSettingChange} className="sr-only" />
                          <span className="flex flex-1">
                            <span className="flex flex-col">
                              <span className="block text-sm font-medium text-gray-900">Dark Mode</span>
                              <span className="mt-1 flex items-center text-sm text-gray-500">Easier on the eyes (Coming soon)</span>
                            </span>
                          </span>
                          <CheckCircleIcon className={`h-5 w-5 ${appSettings.theme === 'dark' ? 'text-purple-600' : 'hidden'}`} />
                        </label>
                      </div>
                      <p className="mt-4 text-sm text-gray-500 italic">Note: Only light theme is currently implemented across the app.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Language & Region Section */}
              {activeSection === 'region' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Language & Region</h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select name="language" value={appSettings.language} onChange={handleAppSettingChange} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm border bg-white">
                        <option value="en">English (US)</option>
                        <option value="es">Español (ES)</option>
                        <option value="fr">Français (FR)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                      <select name="timezone" value={appSettings.timezone} onChange={handleAppSettingChange} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm border bg-white">
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">Eastern Time (US & Canada)</option>
                        <option value="America/Chicago">Central Time (US & Canada)</option>
                        <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris, Berlin, Rome</option>
                        <option value="Asia/Kolkata">India Standard Time</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Australia/Sydney">Sydney</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                        <select name="dateFormat" value={appSettings.dateFormat} onChange={handleAppSettingChange} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm border bg-white">
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                        <select name="timeFormat" value={appSettings.timeFormat} onChange={handleAppSettingChange} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm border bg-white">
                          <option value="12h">12-hour (1:00 PM)</option>
                          <option value="24h">24-hour (13:00)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Section (Placeholder) */}
              {activeSection === 'security' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
                  <Shield className="w-16 h-16 text-gray-300 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Security Settings</h2>
                  <p className="text-gray-500">Security settings such as two-factor authentication and active sessions are managed by your system administrator.</p>
                </motion.div>
              )}

              {/* Data Management Section (Placeholder) */}
              {activeSection === 'data' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
                  <Database className="w-16 h-16 text-gray-300 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Data Management</h2>
                  <p className="text-gray-500 mb-6">Export or import your task data across platforms.</p>
                  <button onClick={() => toast('Export feature coming soon', { icon: '🚧' })} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Export All Tasks
                  </button>
                </motion.div>
              )}

              {/* Backup & Restore Section (Placeholder) */}
              {activeSection === 'backup' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
                  <HardDrive className="w-16 h-16 text-gray-300 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Backup & Restore</h2>
                  <p className="text-gray-500">Automated daily backups are enabled by default. Restore functionality is available upon request to support.</p>
                </motion.div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  );
}
