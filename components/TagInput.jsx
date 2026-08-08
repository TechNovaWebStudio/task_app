'use client';

import { useState } from 'react';
import { X, Tag as TagIcon } from 'lucide-react';

export default function TagInput({ value = [], onChange, placeholder = "Add a tag and press Enter" }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
        setInputValue('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter(t => t !== tagToRemove));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <span 
            key={tag} 
            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 hover:bg-purple-200 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1.5 ml-1">Press Enter to add multiple tags</p>
    </div>
  );
}
