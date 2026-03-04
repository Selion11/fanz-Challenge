import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card = ({ children, className = '', style }: CardProps) => {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};