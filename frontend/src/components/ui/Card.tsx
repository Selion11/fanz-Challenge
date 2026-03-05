interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void; 
}

export const Card = ({ children, className = '', style, onClick }: CardProps) => {
  return (
    <div 
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}
      style={style}
      onClick={onClick} 
    >
      {children}
    </div>
  );
};