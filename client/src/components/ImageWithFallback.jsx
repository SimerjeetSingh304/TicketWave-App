import React, { useState, useEffect } from 'react';
import { Music, Smile, Trophy, Presentation, Drama, Image as DefaultIcon, Palette } from 'lucide-react';

const CATEGORY_THEMES = {
  concerts: {
    gradient: 'from-teal-600 via-cyan-600 to-blue-700',
    icon: Music,
    label: 'Live Concert'
  },
  comedy: {
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    icon: Smile,
    label: 'Comedy Show'
  },
  sports: {
    gradient: 'from-rose-600 via-red-600 to-orange-700',
    icon: Trophy,
    label: 'Sports Match'
  },
  conferences: {
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    icon: Presentation,
    label: 'Conference'
  },
  theatre: {
    gradient: 'from-fuchsia-600 via-pink-600 to-rose-600',
    icon: Drama,
    label: 'Theatre Play'
  },
  music: {
    gradient: 'from-purple-600 via-violet-600 to-indigo-700',
    icon: Music,
    label: 'Music Event'
  },
  exhibitions: {
    gradient: 'from-green-600 via-teal-600 to-emerald-700',
    icon: Presentation,
    label: 'Exhibition'
  }
};

const ImageWithFallback = ({ src, alt, className, category }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset states when src changes
  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  // Clean the category string
  const cleanCategory = (category || '').toLowerCase().trim();
  const theme = CATEGORY_THEMES[cleanCategory] || {
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    icon: DefaultIcon,
    label: 'Event'
  };

  const IconComponent = theme.icon;

  // Render server-uploaded relative images correctly
  const getImageUrl = () => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    // Prepend server base URL if it's a local upload e.g. /uploads/...
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return `${serverUrl}${src.startsWith('/') ? '' : '/'}${src}`;
  };

  // No src or image failed to load → gradient fallback with icon
  if (error || !src) {
    return (
      <div className={`relative bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center select-none overflow-hidden ${className}`}>
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        {/* Category icon */}
        <IconComponent className="w-10 h-10 text-white/40 mb-2 relative z-10" />
        <span className="text-xs text-white/30 font-bold uppercase tracking-widest relative z-10">
          {theme.label}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden`}>
      {/* Shimmer skeleton shown while image is loading */}
      {loading && (
        <div className="absolute inset-0 bg-slate-800 overflow-hidden">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%]" />
        </div>
      )}
      <img
        src={getImageUrl()}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};

export default ImageWithFallback;
