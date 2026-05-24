import React from 'react';

const EventCardSkeleton = () => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-lg flex flex-col animate-pulse">
      
      {/* Banner Image Placeholder */}
      <div className="relative aspect-[16/10] bg-slate-800 flex items-center justify-center">
        {/* Category Badge Placeholder */}
        <div className="absolute top-4 left-4 h-6 w-20 bg-slate-700 rounded-full"></div>
      </div>

      {/* Body Content Placeholder */}
      <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
        <div className="space-y-3.5">
          {/* Location Placeholder */}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-slate-800 shrink-0"></div>
            <div className="h-3 w-1/2 bg-slate-800 rounded-md"></div>
          </div>
          
          {/* Title Placeholder (2 lines) */}
          <div className="space-y-2">
            <div className="h-4.5 w-11/12 bg-slate-800 rounded-md"></div>
            <div className="h-4.5 w-3/4 bg-slate-800 rounded-md"></div>
          </div>

          {/* Description Placeholder */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full bg-slate-800/60 rounded-md"></div>
            <div className="h-3 w-5/6 bg-slate-800/60 rounded-md"></div>
          </div>
        </div>

        {/* Pricing & Button Placeholders footer */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-slate-800 rounded-md"></div>
            <div className="h-5 w-24 bg-slate-800 rounded-md"></div>
          </div>

          <div className="h-9 w-24 bg-slate-800 rounded-xl"></div>
        </div>
      </div>

    </div>
  );
};

export default EventCardSkeleton;
