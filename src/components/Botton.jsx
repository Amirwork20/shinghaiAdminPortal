import React from 'react';

export function Button({ className = '', children, ...props }) {
  return (
    <button
      className={`px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}