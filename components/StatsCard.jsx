'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, color = 'purple', bgColor, trend, trendValue, trendLabel }) {
  const getGradient = (c) => {
    const gradients = {
      purple: 'from-purple-500 to-indigo-600',
      green: 'from-emerald-400 to-emerald-600',
      orange: 'from-amber-400 to-orange-500',
      red: 'from-red-400 to-rose-600',
      blue: 'from-blue-400 to-cyan-500'
    };
    return gradients[c] || gradients.purple;
  };

  const getShadow = (c) => {
    const shadows = {
      purple: 'shadow-purple-200',
      green: 'shadow-emerald-200',
      orange: 'shadow-orange-200',
      red: 'shadow-red-200',
      blue: 'shadow-blue-200'
    };
    return shadows[c] || shadows.purple;
  };

  const strokeColor = {
    purple: '#7c3aed',
    green: '#10b981',
    orange: '#f59e0b',
    red: '#ef4444',
    blue: '#3b82f6'
  }[color] || '#7c3aed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity" />
      
      <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
        <div>
          <p className="text-[10px] sm:text-sm font-semibold text-gray-500 mb-1 sm:mb-2">{title}</p>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-br ${getGradient(color)} flex items-center justify-center shadow-lg ${getShadow(color)} transform group-hover:rotate-12 transition-transform duration-300 flex-shrink-0`}>
          <Icon className="w-5 sm:w-7 h-5 sm:h-7 text-white" />
        </div>
      </div>

      <div className="flex items-end justify-between mt-3 sm:mt-4">
        {trendValue !== undefined && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {trend === 'up' ? (
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-sm font-bold">
                  <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4" />
                  {trendValue}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-sm font-bold">
                  <TrendingDown className="w-3 sm:w-4 h-3 sm:h-4" />
                  {trendValue}
                </div>
              )}
            </div>
            {trendLabel && <span className="text-[9px] sm:text-xs text-gray-400 font-medium pl-1">{trendLabel}</span>}
          </div>
        )}

        <div className="w-1/2 opacity-60 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 100 30" className="w-full h-6 sm:h-8 drop-shadow-sm" preserveAspectRatio="none">
            <path
              d="M0,25 C20,20 30,10 50,15 C70,20 80,5 100,10"
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="path-animate"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
