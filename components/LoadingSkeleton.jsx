'use client';

import React from 'react';

export default function LoadingSkeleton({ type = 'page', rows = 5 }) {
  if (type === 'page') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl mt-6"></div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="h-14 bg-gray-50 border-b border-gray-100 animate-pulse"></div>
        <div className="divide-y divide-gray-100">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center p-4 space-x-4 animate-pulse">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex justify-between items-start">
            <div className="space-y-3 flex-1">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 animate-pulse flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
