import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Clock, CheckCircle2, CreditCard, Ticket, ArrowLeft, AlertCircle } from 'lucide-react';

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const { seats, eventId, sectionName, totalAmount, eventTitle, eventVenue, eventCity, eventDate } = location.state;

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default (in seconds)
  const [timerStarted, setTimerStarted] = useState(false);

  // Countdown timer logic
  const timerExpiredRef = useRef(false);
  useEffect(() => {
    if (!timerStarted || successBooking || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          if (!timerExpiredRef.current) {
            timerExpiredRef.current = true;
            addToast('Your seat reservation has expired. Please try again.', 'warning');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timerStarted, successBooking, timeLeft, addToast]);

  const handleConfirmAndPay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // 1. Call POST /api/bookings to create pending booking (and lock seats)
      const createRes = await api.post('/bookings', {
        eventId,
        seats,
        totalAmount
      });
      
      const bookingId = createRes.data.data.bookingId;
      addToast('Seats successfully locked! Authorizing mock payment...', 'success');
      
      // Start the local timer using backend expiresIn value
      if (createRes.data.data.expiresIn) {
        setTimeLeft(createRes.data.data.expiresIn);
      }
      setTimerStarted(true);

      // 2. Call POST /api/bookings/:id/confirm to complete mock payment
      const confirmRes = await api.post(`/bookings/${bookingId}/confirm`);
      
      setSuccessBooking(confirmRes.data.data);
      addToast('Mock payment approved. Booking confirmed!', 'success');
      
      // Invalidate queries so that state is updated elsewhere
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    } catch (err) {
      console.error('[Checkout Error]', err);
      const msg = err.response?.data?.message || err.message;
      setErrorMessage(msg);
      addToast(`Booking failed: ${msg}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  const renderStepper = () => (
    <div className="flex items-center justify-between max-w-lg mx-auto px-6 py-4 bg-[#1e293b]/50 border border-white/5 backdrop-blur-md rounded-2xl text-[10px] sm:text-xs font-bold shadow-2xl mb-10">
      <div className="flex items-center space-x-3 text-indigo-400">
        <span className="w-6 h-6 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center justify-center font-bold text-[10px]">1</span>
        <span className="uppercase tracking-wider">Select Seats</span>
      </div>
      <div className="border-t border-dashed border-white/10 flex-grow mx-4"></div>
      <div className={`flex items-center space-x-3 ${successBooking ? 'text-indigo-400' : 'text-cyan-400'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${successBooking ? 'bg-indigo-600/20 border border-indigo-500/30' : 'bg-cyan-600/20 border border-cyan-500/50'}`}>2</span>
        <span className="uppercase tracking-wider">Review & Pay</span>
      </div>
      <div className="border-t border-dashed border-white/10 flex-grow mx-4"></div>
      <div className={`flex items-center space-x-3 ${successBooking ? 'text-emerald-400' : 'text-slate-600'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${successBooking ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-white/5 border border-white/10'}`}>3</span>
        <span className="uppercase tracking-wider">Confirmed</span>
      </div>
    </div>
  );

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-spin-slow"></div>
        </div>
        <p className="text-indigo-300 font-bold tracking-widest uppercase text-sm animate-pulse">Processing Payment securely...</p>
      </div>
    );
  }

  // 1. Success Ticket view (If Booking is confirmed)
  if (successBooking) {
    return (
      <div className="max-w-xl mx-auto space-y-8 pt-12 pb-24 px-4">
        {renderStepper()}
        
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Booking Confirmed!</h2>
          <p className="text-slate-400 font-medium">Your seats are secured. Show the QR code below at the venue.</p>
        </div>

        {/* Digital Ticket Card */}
        <div className="relative bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden mt-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>
          
          {/* Header */}
          <div className="bg-[#1e293b]/40 px-8 py-6 flex justify-between items-center border-b border-white/5">
            <div>
              <span className="text-[10px] tracking-[0.2em] text-indigo-400 font-bold uppercase block mb-1">Venue Entrance Pass</span>
              <h3 className="font-black text-2xl text-white">{eventTitle || 'Stellar Event'}</h3>
            </div>
            <Ticket className="w-8 h-8 text-white/10" />
          </div>

          {/* Body */}
          <div className="flex flex-col md:flex-row relative">
            
            {/* Left Info Section */}
            <div className="flex-1 p-8 space-y-6">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold mb-1">Date & Time</span>
                <span className="text-white font-bold">{formattedDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold mb-1">Location</span>
                <span className="text-white font-bold capitalize">{eventVenue}, {eventCity}</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold mb-1">Section</span>
                  <span className="text-indigo-300 font-bold capitalize">{sectionName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold mb-1">Seats</span>
                  <span className="text-white font-black text-lg">{successBooking.seats.map(s => s.seatNumber).join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Right QR Section with Perforated Edge */}
            <div className="md:w-[280px] p-8 bg-[#0b1120] border-t md:border-t-0 md:border-l border-dashed border-white/10 flex flex-col items-center justify-center relative">
              {/* Semi-circle cutouts for ticket effect */}
              <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0f172a] rounded-full border-r border-white/10"></div>
              
              <div className="bg-white p-3 rounded-2xl shadow-xl">
                {successBooking.qrCode ? (
                  <img src={successBooking.qrCode} alt="Ticket QR Code" className="w-32 h-32 md:w-40 md:h-40" />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-100 flex items-center justify-center rounded-xl">
                    <Ticket className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-6 tracking-widest uppercase">ID: {successBooking._id}</span>
              <span className="text-2xl font-black text-white mt-2">${successBooking.totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Link
            to="/my-bookings"
            className="flex-1 text-center py-4 bg-[#1e293b] hover:bg-[#2e3b4e] text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all border border-white/5"
          >
            View All Bookings
          </Link>
          <Link
            to="/"
            className="flex-1 text-center py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
          >
            Explore More Events
          </Link>
        </div>
      </div>
    );
  }

  // 2. Pending checkout payment screen
  return (
    <div className="max-w-xl mx-auto space-y-8 pt-12 pb-24 px-4">
      {renderStepper()}

      <div className="flex items-center space-x-4">
        <Link to={`/event/${eventId}`} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-3xl font-black text-white tracking-tight">Review & Pay</h2>
      </div>

      <div className="bg-[#1e293b]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Timer count down */}
        {timerStarted && timeLeft > 0 && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 text-amber-400 px-5 py-4 rounded-xl text-sm">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 animate-pulse" />
              <span className="font-bold tracking-wide">Seats reserved for:</span>
            </div>
            <span className="font-mono font-black text-xl tracking-wider">{formatTime(timeLeft)}</span>
          </div>
        )}

        {timerStarted && timeLeft <= 0 && (
          <div className="flex items-center space-x-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold tracking-wide">Reservation Expired. Please restart seat selection.</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start space-x-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-1">Payment Failed</span>
              <span className="text-xs text-rose-300/90">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="space-y-6 relative z-10">
          <div>
            <h3 className="font-black text-2xl text-white mb-1">{eventTitle}</h3>
            <p className="text-sm font-semibold text-slate-400 capitalize">{eventVenue}, {eventCity}</p>
          </div>
          
          <div className="bg-[#0f172a] rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Section</span>
              <span className="text-indigo-300 font-black uppercase tracking-wider">{sectionName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Seats</span>
              <span className="text-white font-black">{seats.map(s => s.seatNumber).join(', ')}</span>
            </div>
            {formattedDate && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Date</span>
                <span className="text-slate-300 font-semibold text-sm">{formattedDate}</span>
              </div>
            )}
          </div>

          <div className="bg-indigo-600/10 rounded-2xl p-6 border border-indigo-500/20 flex justify-between items-end">
            <div>
              <span className="text-[10px] text-indigo-300 uppercase font-black tracking-widest block mb-1">Total Amount</span>
              <span className="text-[10px] text-slate-400 font-medium">Includes taxes & fees</span>
            </div>
            <span className="text-4xl font-black text-white">${totalAmount}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirmAndPay}
          disabled={isProcessing || (timerStarted && timeLeft <= 0)}
          className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black uppercase tracking-wider text-sm rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center space-x-3 relative z-10"
        >
          <CreditCard className="w-5 h-5" />
          <span>Confirm & Pay Securely</span>
        </button>

      </div>
    </div>
  );
};

export default BookingConfirm;
