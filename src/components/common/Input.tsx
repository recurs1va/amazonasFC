import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '',
  ...props 
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-white mb-2 text-sm font-medium">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
          error ? 'border-2 border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
