'use client';

import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm"
    >
      <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
        {Icon && <Icon className="w-10 h-10 text-purple-500" />}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mb-8">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm shadow-purple-200 flex items-center gap-2"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
