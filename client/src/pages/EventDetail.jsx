import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../socket/socket';
import SeatMap from '../components/SeatMap';
import ImageWithFallback from '../components/ImageWithFallback';
import { MapPin, Calendar, Eye, ArrowRight, X, Share2, AlertTriangle, Heart, ShieldCheck, Star, User } from 'lucide-react';

const EventDetail = () => {
  const { id: eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeSection, setActiveSection] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewerCount, setViewerCount] = useState(1);
  const [highlightViewer, setHighlightViewer] = useState(false);

  // Fetch Event Details
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}`);
      const payload = res.data.data;
      
      setBookedSeats(payload.bookedSeats || []);
      setLockedSeats(payload.lockedSeats || []);
      
      if (payload.event?.seatSections?.length > 0) {
        setActiveSection(payload.event.seatSections[0]);
      }
      return payload;
    }
  });

  // Socket connection for room view triggers and viewer count broadcasts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join room (matching format backend expected, supporting object or string fallback)
    socket.emit('join-event', eventId);

    // Listeners
    socket.on('viewer-count', ({ count }) => {
      setViewerCount(count);
      setHighlightViewer(true);
      setTimeout(() => setHighlightViewer(false), 800);
    });

    return () => {
      socket.emit('leave-event', eventId);
      socket.off('viewer-count');
    };
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Event Load Failed</h3>
        <p className="text-slate-500 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const { event } = data;

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Event link copied to clipboard!', 'success');
  };

  const handleSeatClick = (sectionName, seatNum) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    const isSelected = selectedSeats.some(
      (s) => s.section === sectionName && s.seatNumber === seatNum
    );

    if (isSelected) {
      // Unlock seat
      socket.emit('unlock-seat', { eventId, section: sectionName, seatNumber: seatNum });
      api.delete('/bookings/lock', {
        data: { eventId, seats: [{ section: sectionName, seatNumber: seatNum }] }
      }).catch(err => console.error('[API unlock error]', err.message));

      setSelectedSeats((prev) =>
        prev.filter((s) => !(s.section === sectionName && s.seatNumber === seatNum))
      );
      addToast(`Seat #${seatNum} deselected.`, 'info');
    } else {
      // Lock seat
      socket.emit('lock-seat', {
        eventId,
        section: sectionName,
        seatNumber: seatNum,
        userId: user.id
      });
      setSelectedSeats((prev) => [...prev, { section: sectionName, seatNumber: seatNum }]);
      addToast(`Seat #${seatNum} selected and locked temporarily!`, 'success');
    }
  };

  const handleDeselectChip = (seat) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('unlock-seat', { eventId, section: seat.section, seatNumber: seat.seatNumber });
    }
    // Call API route to release Redis lock
    api.delete('/bookings/lock', {
      data: { eventId, seats: [seat] }
    }).catch(err => console.error('[API unlock error]', err.message));

    setSelectedSeats((prev) =>
      prev.filter((s) => !(s.section === seat.section && s.seatNumber === seat.seatNumber))
    );
    addToast(`Seat #${seat.seatNumber} deselected.`, 'info');
  };

  const handleProceedToConfirm = () => {
    if (selectedSeats.length === 0) return;
    const totalAmount = selectedSeats.length * (activeSection?.price || 0);
    const sectionName = activeSection?.name || 'VIP';

    const bookingState = {
      seats: selectedSeats,
      eventId,
      sectionName,
      totalAmount,
      eventTitle: event.title,
      eventVenue: event.venue,
      eventCity: event.city,
      eventDate: event.date
    };

    console.log('Proceeding to payment. State:', bookingState);

    navigate('/booking/confirm', { 
      state: bookingState
    });
  };

  const totalAmount = selectedSeats.length * (activeSection?.price || 0);
  const showStickyBar = selectedSeats.length > 0;

  const subtotal = totalAmount;
  const bookingFee = selectedSeats.length > 0 ? 12.50 : 0;
  const finalTotal = subtotal + bookingFee;

  return (
    <div className="pb-24">
      
      {/* Edge-to-edge Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] w-full mt-[-80px] z-0 flex flex-col justify-end">
        <div className="absolute inset-0">
          <img src={event.bannerImage || "https://images.unsplash.com/photo-1540039155733-d7696d4eb98e?auto=format&fit=crop&q=80"} alt={event.title} className="w-full h-full object-cover" />
          {/* Gradients to fade smoothly into the background color */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1120]/80 via-transparent to-[#0b1120]/80"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-6 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold tracking-[0.2em] uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Ticketing Partner</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm font-semibold text-slate-300 pt-2">
              <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{dateStr}</div>
              <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" />{event.venue}, {event.city}</div>
              <div className="flex items-center"><User className="w-4 h-4 mr-2" />Organized by {event.organizer?.name || 'Stellar Promotions'}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 shrink-0">
            <button onClick={handleShare} className="w-12 h-12 rounded-xl bg-[#1e293b]/50 hover:bg-[#1e293b] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors backdrop-blur-md">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-xl bg-[#1e293b]/50 hover:bg-[#1e293b] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors backdrop-blur-md">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-[1400px] mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Seat Selection & Details */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Seat Selection Container */}
            <div className="bg-[#111827] border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-xl font-bold text-white">Select Your Seats</h2>
                
                {/* Legend */}
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-400">
                  <div className="flex items-center"><div className="w-3 h-3 border border-slate-600 rounded-sm mr-2"></div>Available</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-slate-800 rounded-sm mr-2"></div>Locked</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-[#0b1120] border border-white/5 rounded-sm mr-2"></div>Sold Out</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-indigo-500 rounded-sm mr-2 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>Selected</div>
                </div>
              </div>

              {/* STAGE graphic */}
              <div className="w-3/4 max-w-md mx-auto h-12 bg-gradient-to-b from-[#1e293b] to-transparent border-t-2 border-indigo-500/50 rounded-t-[100%] flex items-center justify-center mb-16 relative">
                <span className="text-[10px] font-black text-indigo-300/50 tracking-[0.3em] absolute top-2">STAGE CENTER</span>
              </div>

              <div className="overflow-x-auto pb-8">
                <div className="min-w-max mx-auto px-4">
                  <SeatMap
                    eventId={eventId}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    event={event}
                    user={user}
                    selectedSeats={selectedSeats}
                    setSelectedSeats={setSelectedSeats}
                    initialLockedSeats={lockedSeats}
                    bookedSeats={bookedSeats}
                    setBookedSeats={setBookedSeats}
                    handleSeatClick={handleSeatClick}
                    errorMsg={errorMsg}
                  />
                </div>
              </div>
              
              {/* About the show inside the seat selector block (matching mockup) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-white/5">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">About the Show</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {event.description || "Join us for an unforgettable evening at the venue. This event brings their globally acclaimed audio-visual experience to the city for one night only. Featuring immersive 360-degree soundscapes and custom light installations designed by Studio Prism."}
                  </p>
                </div>
                <div className="h-40 rounded-xl overflow-hidden relative border border-white/10 opacity-80 hover:opacity-100 transition-opacity">
                  <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80" alt="Map Location" className="w-full h-full object-cover grayscale opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#1e293b] px-4 py-2 rounded shadow-lg text-xs font-bold text-white flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-teal-400" />
                      {event.city}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Checkout Card */}
              <div className="bg-[#111827] border border-white/5 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-sm font-bold text-white mb-6 pb-4 border-b border-white/5">Order Summary</h3>
                
                {selectedSeats.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 font-medium">No seats selected.</p>
                    <p className="text-xs text-slate-600 mt-2">Select seats from the interactive map to continue.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* List selected seats */}
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                      {selectedSeats.map((seat, i) => (
                        <div key={i} className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-semibold text-white">Section {seat.section}, Row {seat.section}#{seat.seatNumber}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">Standard Entry</div>
                          </div>
                          <div className="text-sm font-bold text-white">${activeSection?.price?.toFixed(2) || '0.00'}</div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Subtotal</span>
                        <span className="text-slate-300 font-semibold">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Booking Fee</span>
                        <span className="text-slate-300 font-semibold">${bookingFee.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                      <span className="text-base font-bold text-white">Total</span>
                      <span className="text-xl font-bold text-white">${finalTotal.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={handleProceedToConfirm}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] mt-2"
                    >
                      Proceed to Book
                    </button>
                    
                    <div className="flex items-center justify-center text-[10px] text-slate-500 font-medium pt-2">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Secure checkout powered by StellarPay
                    </div>
                  </div>
                )}
              </div>

              {/* VIP Callout */}
              <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4 cursor-pointer hover:bg-amber-500/20 transition-colors">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500/30" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-500">Upgrade to VIP?</h4>
                  <p className="text-xs text-amber-500/70 font-medium mt-1">Get lounge access & priority entry for +$45</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EventDetail;
