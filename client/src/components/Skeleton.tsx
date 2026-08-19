import React from 'react';

interface SkeletonProps {
  className?: string;
  type?: 'text' | 'circular' | 'rectangular';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', type = 'text' }) => {
  const baseClass = "bg-slate-200 animate-pulse";
  
  const typeClasses = {
    text: "h-4 w-3/4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg"
  };

  return (
    <div className={`${baseClass} ${typeClasses[type]} ${className}`} />
  );
};

export const SkeletonRow: React.FC = () => (
  <div className="flex items-center gap-4 py-4 border-b border-slate-100">
    <Skeleton type="rectangular" className="h-12 w-12" />
    <div className="flex-1 space-y-2">
      <Skeleton type="text" className="h-4 w-1/3" />
      <Skeleton type="text" className="h-3 w-1/4" />
    </div>
    <Skeleton type="text" className="h-6 w-16" />
  </div>
);

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border border-slate-200 rounded-2xl p-4 bg-white">
        <Skeleton type="rectangular" className="w-full h-40 mb-4" />
        <Skeleton type="text" className="h-5 w-3/4 mb-2" />
        <Skeleton type="text" className="h-4 w-1/2 mb-4" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton type="text" className="h-6 w-20" />
          <Skeleton type="circular" className="h-10 w-10" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
