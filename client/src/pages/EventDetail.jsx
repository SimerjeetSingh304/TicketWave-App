import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../socket/socket';
import SeatMap from '../components/SeatMap';
import ImageWithFallback from '../components/ImageWithFallback';
import { MapPin, Calendar, Eye, ArrowRight, X, Share2 } from 'lucide-react';

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

  return (
    <div className={`space-y-10 transition-all duration-300 ${showStickyBar ? 'pb-28' : ''}`}>
      
      {/* Event Details Header Card */}
      <div className="flex flex-col lg:flex-row bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="lg:w-2/5 relative">
          <ImageWithFallback
            src={event.bannerImage}
            alt={event.title}
            className="w-full h-full min-h-[300px] object-cover"
            category={event.category}
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950 via-slate-950/20 to-slate-950/0 pointer-events-none"></div>
        </div>

        <div className="lg:w-3/5 p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1 bg-teal-600/10 border border-teal-500/20 rounded-full text-xs font-bold text-teal-400 tracking-wide uppercase">
                {event.category}
              </span>
              
              {/* Viewer counts display badge */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-white/5 border border-white/[0.06] px-3 py-1 rounded-full font-semibold">
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <span className={`transition-all duration-300 ${highlightViewer ? 'text-teal-400 scale-105 font-black' : ''}`}>
                  {viewerCount === 1 ? 'Only you are viewing' : `${viewerCount} people viewing right now`}
                </span>
              </div>

              {/* Share Event Button */}
              <button
                onClick={handleShare}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/[0.06] px-3 py-1 rounded-full font-semibold transition-all cursor-pointer active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share</span>
              </button>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100">{event.title}</h1>
            <p className="text-slate-400 text-sm leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Date & Time</span>
                <span className="text-xs text-slate-200">{dateStr}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Location Venue</span>
                <span className="text-xs text-slate-200 capitalize">{event.venue}, {event.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive SeatMap */}
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

      {/* Viewport-Sticky bottom booking bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-white/[0.06] px-6 py-4 transition-all duration-300 shadow-2xl ${
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(8, 8, 16, 0.95)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left panel: Count & Section */}
          <div className="text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Active Selection</span>
            <p className="text-sm font-extrabold text-slate-200 mt-0.5">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
              <span className="text-slate-500 font-medium"> · Section: </span>
              <span className="text-teal-400">{activeSection?.name}</span>
            </p>
          </div>

          {/* Middle panel: Seat chips list */}
          <div className="flex-grow max-w-lg overflow-x-auto flex items-center space-x-2 py-1 scrollbar-none">
            {selectedSeats.map((seat) => (
              <div
                key={`${seat.section}-${seat.seatNumber}`}
                className="flex items-center space-x-1 bg-white/5 border border-white/10 text-xs text-slate-200 font-bold px-2.5 py-1.5 rounded-full shrink-0"
              >
                <span>#{seat.seatNumber}</span>
                <button
                  onClick={() => handleDeselectChip(seat)}
                  className="p-0.5 text-slate-500 hover:text-rose-400 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Right panel: Pricing & Proceed */}
          <div className="flex items-center justify-between md:justify-end md:space-x-6">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-black block">Amount Due</span>
              <span className="text-2xl font-black text-white leading-none">₹{totalAmount}</span>
            </div>

            <button
              onClick={handleProceedToConfirm}
              className="premium-btn flex items-center space-x-2 px-6 py-3"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default EventDetail;
