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
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.07)',
      }}
    >
      <div className="flex justify-around items-stretch h-[62px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-2 relative transition-all duration-200 ${
                isActive ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* Active top bar indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
              )}

              {/* Icon with pill background when active */}
              <div className={`flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-purple-100' : ''
              }`}>
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-all ${
                  isActive ? 'text-purple-600 scale-110' : 'text-gray-400'
                }`} />
              </div>

              <span className={`text-[9px] font-semibold leading-tight tracking-wide transition-colors ${
                isActive ? 'text-purple-600' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
