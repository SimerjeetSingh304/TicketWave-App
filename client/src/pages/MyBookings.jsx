import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, Ticket, AlertCircle, Info, Ban, Sparkles, CheckCircle2 } from 'lucide-react';

const MyBookings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Fetch bookings using TanStack Query
  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings/my');
      return res.data.data;
    }
  });

  // Mutation to cancel booking
  const cancelMutation = useMutation({
    mutationFn: async (bookingId) => {
      const res = await api.patch(`/bookings/${bookingId}/cancel`);
      return res.data;
    },
    onSuccess: (data) => {
      addToast(data.message || 'Booking cancelled successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to cancel booking.';
      addToast(msg, 'error');
    }
  });

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action is irreversible.')) {
      cancelMutation.mutate(bookingId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl max-w-md mx-auto space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold">Failed to load bookings</h3>
        <p className="text-slate-500 text-sm">{error.message}</p>
      </div>
    );
  }

  // Active Admissions: only CONFIRMED bookings in the future
  const activeBookings = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.event?.date) > new Date()
  );

  // History & Pending: PENDING + CANCELLED + past CONFIRMED bookings
  const pastBookings = bookings.filter(
    (b) =>
      b.status === 'cancelled' ||
      b.status === 'pending' ||
      (b.status === 'confirmed' && new Date(b.event?.date) <= new Date())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-16 px-6 pt-32 pb-32">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -top-32 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300 tracking-widest uppercase">Digital Wallet</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tighter mb-4">
            My Tickets
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl">
            Access your exclusive passes, manage upcoming events, and view your complete admission history.
          </p>
        </div>
      </div>

      {/* Confirmed Tickets List */}
      <div className="space-y-8 relative z-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-3">
            <div className="w-2 h-6 bg-teal-500 rounded-full"></div>
            <span>Active Admissions</span>
          </h2>
          <span className="text-sm font-bold bg-white/10 text-white px-3 py-1 rounded-full">{activeBookings.length} Active</span>
        </div>
        
        {activeBookings.length === 0 ? (
          <div className="text-center py-32 bg-gradient-to-b from-[#111827] to-[#0b1120] border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl transform group-hover:-translate-y-2 transition-transform duration-500">
                <Ticket className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Your wallet is empty</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">You don't have any upcoming events. Discover extraordinary experiences waiting for you.</p>
              <a href="/#explore" className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                Explore Events
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {activeBookings.map((booking) => {
              const eventDate = new Date(booking.event?.date);
              const formattedDate = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              // Check: event start is >24hr away
              const isCancellable = booking.event && (new Date(booking.event.date) - new Date() > 24 * 60 * 60 * 1000);
              const isCancelling = cancelMutation.isPending && cancelMutation.variables === booking._id;

              return (
                <div
                  key={booking._id}
                  className="flex flex-col lg:flex-row bg-[#0b1120]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all duration-500 hover:border-indigo-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                  
                  {/* Left Column: Event details */}
                  <div className="w-full lg:w-[72%] p-8 md:p-12 space-y-8 flex flex-col justify-between relative z-10">
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-black text-indigo-300 tracking-widest uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                          {booking.event?.category || 'Event'}
                        </span>
                        <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Admit One</span>
                        </span>
                      </div>
                      
                      <h3 className="font-black text-3xl md:text-5xl text-white leading-[1.1] tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-200 transition-all duration-300">
                        {booking.event?.title}
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-slate-300 font-semibold pt-2">
                        <div className="flex items-center space-x-4 bg-white/5 px-5 py-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                          <Calendar className="w-5 h-5 text-indigo-400" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center space-x-4 bg-white/5 px-5 py-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                          <MapPin className="w-5 h-5 text-teal-400" />
                          <span className="capitalize">{booking.event?.venue}, {booking.event?.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-wrap items-end justify-between gap-8 text-sm relative">
                      <div className="flex space-x-12">
                        <div>
                          <span className="text-xs text-slate-500 block uppercase tracking-widest font-black mb-1.5">Sector & Seat</span>
                          <span className="text-white font-black text-xl md:text-2xl tracking-tight">
                            {booking.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block uppercase tracking-widest font-black mb-1.5">Paid</span>
                          <span className="text-white font-black text-xl md:text-2xl tracking-tight">${booking.totalAmount}</span>
                        </div>
                      </div>
                      
                      {isCancellable && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={cancelMutation.isPending}
                          className="px-6 py-3 bg-[#1e293b] hover:bg-rose-500/90 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-500 font-bold rounded-xl flex items-center space-x-2 transition-all duration-300 uppercase tracking-widest text-[11px] disabled:opacity-50 disabled:pointer-events-none hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                        >
                          <Ban className="w-4 h-4" />
                          <span>{isCancelling ? 'Processing...' : 'Relinquish'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Ticket Stub */}
                  <div className="w-full lg:w-[28%] bg-gradient-to-b from-[#1e293b] to-[#0f172a] p-8 md:p-12 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l-[2px] border-dashed border-slate-700 relative z-10">
                    
                    {/* Visual notches on ticket divider */}
                    <div className="hidden lg:block absolute -left-5 top-8 w-10 h-10 bg-[#030305] rounded-full shadow-inner"></div>
                    <div className="hidden lg:block absolute -left-5 bottom-8 w-10 h-10 bg-[#030305] rounded-full shadow-inner"></div>
                    <div className="hidden lg:block absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#030305] rounded-full shadow-inner"></div>

                    {booking.qrCode ? (
                      <div className="flex flex-col items-center w-full">
                        <div className="bg-white p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform group-hover:scale-105 transition-transform duration-500 w-full max-w-[200px] aspect-square flex items-center justify-center relative">
                          {/* Scan line animation */}
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-teal-400 opacity-50 shadow-[0_0_10px_#2dd4bf] animate-[scan_2s_ease-in-out_infinite]"></div>
                          <img
                            src={booking.qrCode}
                            alt="Ticket QR Code"
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="mt-8 text-center">
                          <span className="text-xs text-indigo-400 font-black uppercase tracking-[0.2em] block mb-2">
                            Valid Admission
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono tracking-widest block bg-black/20 px-3 py-1 rounded-full">
                            #{booking._id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <div className="w-full max-w-[200px] aspect-square bg-white/5 rounded-3xl flex flex-col items-center justify-center border border-white/10 text-center px-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-pulse"></div>
                          <Ticket className="w-8 h-8 text-slate-600 mb-3" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generating QR</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical / Cancelled Bookings */}
      <div className="space-y-8 pt-16 relative z-10">
        <div className="flex items-center space-x-4 border-b border-white/5 pb-4">
          <h2 className="text-lg font-black text-slate-500 uppercase tracking-widest">Archives & Pending</h2>
          <div className="flex-grow h-[1px] bg-gradient-to-r from-slate-800 to-transparent"></div>
        </div>
        
        {pastBookings.length === 0 ? (
          <div className="text-center py-16 bg-[#0f172a]/30 border border-white/[0.03] rounded-3xl backdrop-blur-sm">
            <p className="text-slate-500 text-sm font-semibold tracking-wide">No past history found in the archives.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastBookings.map((b) => {
              let badgeStyle = 'bg-slate-800/50 text-slate-400 border-slate-700/50';
              let badgeText = b.status;
              
              if (b.status === 'pending') {
                badgeStyle = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                badgeText = 'Payment Pending';
              } else if (b.status === 'confirmed') {
                badgeStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                badgeText = 'Completed';
              } else if (b.status === 'cancelled') {
                badgeStyle = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                badgeText = 'Voided';
              }

              return (
                <div
                  key={b._id}
                  className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                >
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-lg text-white leading-tight line-clamp-2 group-hover:text-indigo-300 transition-colors">{b.event?.title || 'Unknown Event'}</h4>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${badgeStyle}`}>
                        {badgeText}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400 bg-black/20 rounded-xl p-4">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Seats</span>
                        <span className="text-slate-300">{b.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Total</span>
                        <span className="text-slate-300">${b.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-[10px] text-slate-600 font-mono tracking-widest">#{b._id.slice(-8).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center">
                      <Info className="w-3 h-3 mr-1" />
                      Archived
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default MyBookings;
