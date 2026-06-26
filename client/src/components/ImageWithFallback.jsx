import React, { useState, useEffect } from 'react';
import { Music, Smile, Trophy, Presentation, Drama, Image as DefaultIcon } from 'lucide-react';

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
    gradient: 'from-emerald-600 via-pink-600 to-rose-600',
    icon: Drama,
    label: 'Theatre Play'
  }
};

const ImageWithFallback = ({ src, alt, className, category }) => {
  const [error, setError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setError(false);
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

  if (error || !src) {
    return (
      <div className={`relative bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center select-none ${className}`}>
        {/* Glow grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
      </div>
    );
  }

  return (
    <img
      src={getImageUrl()}
      alt={alt}
      onError={() => setError(true)}
      className={className}
    />
  );
};

export default ImageWithFallback;
