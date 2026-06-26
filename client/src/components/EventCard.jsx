import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Ticket } from 'lucide-react';
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
    <Link
      to={`/event/${event._id}`}
      className={`group block relative rounded-[2rem] overflow-hidden bg-[#0f172a] transition-all duration-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.2)] ${
        isSoldOut ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      {/* Edge-to-Edge Banner Image */}
      <div className="relative aspect-[4/5] md:aspect-[3/4] w-full overflow-hidden">
        <ImageWithFallback
          src={event.bannerImage}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          category={event.category}
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Top Badges */}
        <div className="absolute top-5 flex items-center justify-between w-full px-5">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white tracking-widest uppercase border border-white/20">
            {event.category}
          </div>
          
          {isSoldOut ? (
            <div className="bg-rose-500/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white tracking-widest uppercase border border-rose-500/20">
              Sold Out
            </div>
          ) : availableSeats <= 20 ? (
            <div className="bg-amber-500/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white tracking-widest uppercase border border-amber-500/20 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></span>
              {availableSeats} Left
            </div>
          ) : null}
        </div>

        {/* Content Box at the Bottom */}
        <div className="absolute bottom-0 w-full p-6 flex flex-col justify-end">
          <div className="flex flex-col space-y-1 mb-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <span className="text-xs font-semibold text-indigo-300 tracking-wider uppercase mb-1">
              {dateStr}
            </span>
            <h3 className="font-black text-2xl md:text-3xl text-white leading-tight">
              {event.title}
            </h3>
            <div className="flex items-center text-sm font-medium text-slate-300 mt-2">
              <MapPin className="w-4 h-4 mr-1 text-slate-400" />
              <span className="truncate">{event.venue}, {event.city}</span>
            </div>
          </div>

          {/* Price & Action row hidden by default, shown on hover */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out delay-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Starting At</span>
              <div className="text-lg font-black text-white">${minPrice.toFixed(2)}</div>
            </div>
            
            {!isSoldOut && (
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <Ticket className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
