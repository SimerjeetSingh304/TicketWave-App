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
    <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3 border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm rounded-2xl text-[10px] sm:text-xs font-bold shadow-inner mb-6">
      <div className="flex items-center space-x-2 text-teal-400">
        <span className="w-5 h-5 bg-teal-600/10 border border-teal-500/30 rounded-full flex items-center justify-center font-bold text-[10px]">1</span>
        <span>Select Seats</span>
      </div>
      <div className="border-t border-dashed border-slate-800 flex-grow mx-2 sm:mx-4"></div>
      <div className={`flex items-center space-x-2 ${successBooking ? 'text-teal-400' : 'text-cyan-400'}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${successBooking ? 'bg-teal-600/10 border border-teal-500/30' : 'bg-cyan-600/10 border border-cyan-500'}`}>2</span>
        <span>Review & Pay</span>
      </div>
      <div className="border-t border-dashed border-slate-800 flex-grow mx-2 sm:mx-4"></div>
      <div className={`flex items-center space-x-2 ${successBooking ? 'text-emerald-400' : 'text-slate-600'}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${successBooking ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>3</span>
        <span>Confirmed</span>
      </div>
    </div>
  );

  // Loading spinner guard: ONLY show during active processing API call, not on initial load
  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // 1. Success Ticket view (If Booking is confirmed)
  if (successBooking) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        {renderStepper()}
        
        <div className="text-center space-y-3 p-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-pulse" />
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Booking Confirmed!</h2>
          <p className="text-slate-400 text-sm">Your seats are secured. Show the QR code below at the venue.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="bg-gradient-to-r from-teal-950 to-cyan-900 px-6 py-5 border-b border-slate-800">
            <h3 className="font-extrabold text-lg text-white leading-tight">{eventTitle || 'Grand Event'}</h3>
            <span className="text-[10px] tracking-widest text-teal-300 font-bold uppercase mt-1 block">
              Venue Entrance Pass
            </span>
          </div>

          <div className="p-8 flex flex-col items-center border-b border-dashed border-slate-800/80 relative">
            <div className="absolute -left-3 top-full -translate-y-1/2 w-6 h-6 rounded-full bg-[#080810] border-r border-white/10 z-10"></div>
            <div className="absolute -right-3 top-full -translate-y-1/2 w-6 h-6 rounded-full bg-[#080810] border-l border-white/10 z-10"></div>

            {successBooking.qrCode ? (
              <img
                src={successBooking.qrCode}
                alt="Ticket QR Code"
                className="w-48 h-48 bg-white p-2 rounded-2xl shadow-lg border border-slate-700/50"
              />
            ) : (
              <div className="w-48 h-48 bg-white/5 flex items-center justify-center rounded-2xl">
                <Ticket className="w-10 h-10 text-slate-700" />
              </div>
            )}
            <span className="text-[10px] font-mono text-slate-500 mt-4 tracking-wider uppercase">
              Ticket ID: {successBooking._id}
            </span>
          </div>

          <div className="p-6 space-y-4 text-sm text-slate-400">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Seats Block</span>
                <span className="text-slate-200 font-bold">
                  {successBooking.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Amount</span>
                <span className="text-slate-200 font-bold">₹{successBooking.totalAmount}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Location Venue</span>
              <span className="text-slate-200 capitalize">
                {eventVenue}, {eventCity}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Link
            to="/my-bookings"
            className="flex-1 text-center py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-all"
          >
            My Bookings List
          </Link>
          <Link
            to="/"
            className="flex-1 text-center py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl text-sm transition-all shadow-lg"
          >
            Explore More
          </Link>
        </div>
      </div>
    );
  }

  // 2. Pending checkout payment screen (Booking Summary UI shown immediately on mount)
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {renderStepper()}

      <div className="flex items-center space-x-2">
        <Link to={`/event/${eventId}`} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold">Confirm Order</h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
        {/* Timer count down */}
        {timerStarted && timeLeft > 0 && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-2xl text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span className="font-semibold">Seat reservation expires in:</span>
            </div>
            <span className="font-mono font-black text-lg tracking-wider">{formatTime(timeLeft)}</span>
          </div>
        )}

        {timerStarted && timeLeft <= 0 && (
          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Reservation Expired. Please restart seat selection.</span>
          </div>
        )}

        {/* Display local API error if any occurred during Confirm & Pay click */}
        {errorMessage && (
          <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Payment Failed</span>
              <span className="text-xs text-rose-300/90">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-xl border-b border-slate-800 pb-3">{eventTitle}</h3>
          
          <div className="space-y-2.5 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Section Category:</span>
              <span className="text-slate-200 font-semibold capitalize">
                {sectionName}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Seats Selected:</span>
              <span className="text-slate-200 font-semibold">
                {seats.map(s => s.seatNumber).join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Venue Location:</span>
              <span className="text-slate-200 font-semibold capitalize">
                {eventVenue}, {eventCity}
              </span>
            </div>
            {formattedDate && (
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="text-slate-200 font-semibold">
                  {formattedDate}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex justify-between items-end">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Payable Total</span>
              <span className="text-3xl font-black text-white block">₹{totalAmount}</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Including all taxes</span>
          </div>
        </div>

        {/* Action Button: trigger pending booking creation + payment confirmation */}
        <button
          onClick={handleConfirmAndPay}
          disabled={isProcessing || (timerStarted && timeLeft <= 0)}
          className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center space-x-2"
        >
          <CreditCard className="w-5 h-5" />
          <span>Confirm & Pay</span>
        </button>

      </div>
    </div>
  );
};

export default BookingConfirm;
