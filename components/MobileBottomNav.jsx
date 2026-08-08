'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Calendar, BarChart3, User } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 lg:hidden shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex justify-around items-stretch h-[58px] max-w-screen-sm mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-2 relative transition-colors rounded-xl mx-0.5 ${
                isActive ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isActive && (
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-purple-600 rounded-full" />
              )}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-purple-600' : ''}`} />
              <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-purple-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
