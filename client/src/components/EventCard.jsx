import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

const EventCard = ({ event }) => {
  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Safe parameters extraction
  const availableSeats = typeof event.availableSeats !== 'undefined' 
    ? event.availableSeats 
    : (event.totalSeats - (event.bookedSeats || 0));
  
  const seatsLeft = typeof event.seatsLeft !== 'undefined' 
    ? event.seatsLeft 
    : (event.totalSeats > 0 ? Math.round((availableSeats / event.totalSeats) * 100) : 0);

  const minPrice = event.seatSections && event.seatSections.length > 0 
    ? Math.min(...event.seatSections.map(s => s.price)) 
    : 0;

  const isSoldOut = availableSeats === 0;

  return (
    <div
      className={`group bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-lg hover:border-teal-500/40 hover:shadow-teal-500/5 transition-all duration-300 flex flex-col ${
        isSoldOut ? 'opacity-60' : ''
      }`}
    >
      
      {/* Banner Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <ImageWithFallback
          src={event.bannerImage}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          category={event.category}
        />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-cyan-300 tracking-wide uppercase border border-white/10">
          {event.category}
        </div>

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-extrabold text-sm uppercase tracking-widest border border-white/20 px-4 py-2 rounded-xl">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Capacity status badges */}
        {!isSoldOut && (
          <>
            {availableSeats <= 20 ? (
              <div className="absolute bottom-4 left-4 bg-rose-500/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-white tracking-wide uppercase shadow-lg shadow-rose-500/20 border border-rose-400/20 animate-pulse">
                Only {availableSeats} left!
              </div>
            ) : seatsLeft <= 50 ? (
              <div className="absolute bottom-4 left-4 bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-white tracking-wide uppercase shadow-lg shadow-amber-500/20 border border-amber-400/20">
                Filling fast
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Body Content */}
      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center text-xs text-slate-500 space-x-1">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            <span className="capitalize">{event.venue}, {event.city}</span>
          </div>
          
          <h3 className="font-extrabold text-lg text-slate-100 group-hover:text-teal-400 transition-colors leading-tight">
            {event.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide">Starting from</span>
            <span className="text-lg font-black text-slate-100">₹{minPrice}</span>
          </div>

          {isSoldOut ? (
            <button
              disabled
              className="px-4 py-2 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-700/30"
            >
              Sold Out
            </button>
          ) : (
            <Link
              to={`/event/${event._id}`}
              className="px-4 py-2 bg-slate-800 group-hover:bg-teal-600 text-slate-200 group-hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

    </div>
  );
};

export default EventCard;
