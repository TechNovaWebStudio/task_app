'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import TaskModal from '@/components/TaskModal';
import { categoryApi } from '@/services/categoryApi';

export default function ProtectedLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (isAuthenticated) {
        try {
          const response = await categoryApi.getCategories();
          setCategories(response.data?.data || []);
        } catch (error) {
          // Categories load silently; task modal still works without them
        }
      }
    };
    fetchCategories();
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={collapsed} 
        onToggleCollapse={() => setCollapsed(!collapsed)} 
      />
      {/* Main content area — offset by sidebar width on desktop */}
      <div className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Navbar 
          onMenuClick={() => setSidebarOpen(true)} 
          onAddTask={() => setIsTaskModalOpen(true)}
          isCollapsed={collapsed}
        />
        <main className="flex-1 overflow-y-auto pt-16 pb-20 lg:pb-6 bg-[#F8FAFC] w-full min-w-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => {
          setIsTaskModalOpen(false);
          window.dispatchEvent(new Event('tasks-changed'));
        }}
        categories={categories}
      />
    </div>
  );
}
