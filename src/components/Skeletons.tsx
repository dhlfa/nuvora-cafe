import React from 'react';

export const CategorySkeleton: React.FC = () => {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-9 w-24 custom-skeleton custom-skeleton-animate rounded-full flex-shrink-0" />
      ))}
    </div>
  );
};

export const MenuCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 flex flex-col justify-between h-[210px] sm:h-[260px]">
      <div className="w-full aspect-square rounded-lg custom-skeleton custom-skeleton-animate mb-2" />
      <div className="space-y-1.5 flex-1">
        <div className="h-4 w-3/4 custom-skeleton custom-skeleton-animate rounded" />
        <div className="h-3 w-5/6 custom-skeleton custom-skeleton-animate rounded" />
      </div>
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div className="h-4 w-12 custom-skeleton custom-skeleton-animate rounded" />
        <div className="h-6 w-10 custom-skeleton custom-skeleton-animate rounded-md" />
      </div>
    </div>
  );
};

export const MenuGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <MenuCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-surface border border-border p-8 rounded-3xl h-[420px] w-full">
      <div className="space-y-4">
        <div className="h-8 w-3/4 custom-skeleton custom-skeleton-animate rounded" />
        <div className="h-4 w-5/6 custom-skeleton custom-skeleton-animate rounded" />
        <div className="h-4 w-2/3 custom-skeleton custom-skeleton-animate rounded" />
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-28 custom-skeleton custom-skeleton-animate rounded-xl" />
          <div className="h-10 w-28 custom-skeleton custom-skeleton-animate rounded-xl" />
        </div>
      </div>
      <div className="hidden md:block w-full h-[300px] custom-skeleton custom-skeleton-animate rounded-2xl" />
    </div>
  );
};

export const CartSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="h-6 w-1/4 custom-skeleton custom-skeleton-animate rounded mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 items-center border-b border-border pb-3">
          <div className="w-16 h-16 custom-skeleton custom-skeleton-animate rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 custom-skeleton custom-skeleton-animate rounded" />
            <div className="h-3 w-1/3 custom-skeleton custom-skeleton-animate rounded" />
          </div>
          <div className="w-12 h-6 custom-skeleton custom-skeleton-animate rounded" />
        </div>
      ))}
      <div className="pt-4 space-y-2">
        <div className="h-4 w-1/3 custom-skeleton custom-skeleton-animate rounded animate-pulse" />
        <div className="h-10 w-full custom-skeleton custom-skeleton-animate rounded-xl" />
      </div>
    </div>
  );
};

export const CheckoutSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-3">
        <div className="h-5 w-1/3 custom-skeleton custom-skeleton-animate rounded" />
        <div className="h-12 w-full custom-skeleton custom-skeleton-animate rounded-xl" />
        <div className="h-12 w-full custom-skeleton custom-skeleton-animate rounded-xl" />
      </div>
      <div className="space-y-3 pt-4">
        <div className="h-5 w-1/3 custom-skeleton custom-skeleton-animate rounded" />
        <div className="h-32 w-full custom-skeleton custom-skeleton-animate rounded-xl" />
      </div>
      <div className="h-12 w-full custom-skeleton custom-skeleton-animate rounded-xl mt-6" />
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 custom-skeleton custom-skeleton-animate rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-5 w-32 custom-skeleton custom-skeleton-animate rounded" />
          <div className="h-3 w-48 custom-skeleton custom-skeleton-animate rounded" />
        </div>
      </div>
      <div className="space-y-3 pt-4">
        <div className="h-24 w-full custom-skeleton custom-skeleton-animate rounded-xl" />
        <div className="h-12 w-full custom-skeleton custom-skeleton-animate rounded-xl" />
      </div>
    </div>
  );
};

export const MenuDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="w-full h-64 custom-skeleton custom-skeleton-animate rounded-2xl" />
      <div className="space-y-2">
        <div className="h-6 custom-skeleton custom-skeleton-animate rounded w-2/3" />
        <div className="h-4 custom-skeleton custom-skeleton-animate rounded w-1/3" />
      </div>
      <div className="h-20 custom-skeleton custom-skeleton-animate rounded-xl" />
      <div className="space-y-3 py-2">
        <div className="h-4 custom-skeleton custom-skeleton-animate rounded w-1/4" />
        <div className="h-10 custom-skeleton custom-skeleton-animate rounded-xl" />
        <div className="h-10 custom-skeleton custom-skeleton-animate rounded-xl" />
      </div>
      <div className="h-16 custom-skeleton custom-skeleton-animate rounded-xl" />
    </div>
  );
};

export const OrderStatusSkeleton: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="h-16 custom-skeleton custom-skeleton-animate rounded-2xl" />
      <div className="h-40 custom-skeleton custom-skeleton-animate rounded-2xl" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-5 h-5 custom-skeleton custom-skeleton-animate rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 custom-skeleton custom-skeleton-animate rounded w-1/3" />
              <div className="h-3 custom-skeleton custom-skeleton-animate rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
