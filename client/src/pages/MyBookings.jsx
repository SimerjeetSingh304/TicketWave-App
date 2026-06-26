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
    <div className="max-w-5xl mx-auto space-y-12 px-4 pt-32 pb-24">
      
      <div className="text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">My Tickets</h1>
        <p className="text-slate-400 text-sm font-medium">Manage and view your exclusive event access</p>
      </div>

      {/* Confirmed Tickets List */}
      <div className="space-y-8">
        <h2 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4">Active Admissions</h2>
        
        {activeBookings.length === 0 ? (
          <div className="text-center py-20 bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-3xl">
            <Ticket className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-semibold">No active bookings found.</p>
          </div>
        ) : (
          <div className="space-y-8">
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
                  className="flex flex-col lg:flex-row bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group hover:shadow-[0_0_40px_rgba(79,70,229,0.15)] transition-all duration-500"
                >
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  {/* Left Column: Event details (70%) */}
                  <div className="w-full lg:w-[70%] p-8 space-y-6 flex flex-col justify-between relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white tracking-widest uppercase">
                          {booking.event?.category || 'Event'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Confirmed</span>
                        </span>
                      </div>
                      <h3 className="font-black text-2xl md:text-3xl text-white leading-tight">{booking.event?.title}</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300 font-medium pt-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                          </div>
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                          </div>
                          <span className="capitalize truncate">{booking.event?.venue}, {booking.event?.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-6 flex flex-wrap items-center justify-between gap-6 text-sm">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold mb-1">Seats</span>
                        <span className="text-white font-black text-lg">
                          {booking.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold mb-1">Amount Paid</span>
                        <span className="text-white font-black text-lg">${booking.totalAmount}</span>
                      </div>
                      
                      {isCancellable && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={cancelMutation.isPending}
                          className="px-5 py-2.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] font-bold rounded-xl flex items-center space-x-2 transition-all duration-300 uppercase tracking-wider text-[10px] disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <Ban className="w-4 h-4" />
                          <span>{isCancelling ? 'Cancelling...' : 'Cancel Booking'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: QR Code ticket section (30%) */}
                  <div className="w-full lg:w-[30%] bg-[#0b1120] p-8 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-dashed border-white/10 relative z-10">
                    
                    {/* Visual notches on ticket divider */}
                    <div className="hidden lg:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#080810] rounded-full border-r border-white/10"></div>

                    {booking.qrCode ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="bg-white p-3 rounded-2xl shadow-xl">
                          <img
                            src={booking.qrCode}
                            alt="Ticket QR Code"
                            className="w-32 h-32 md:w-40 md:h-40"
                          />
                        </div>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                          Scan at venue
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-center px-4 text-xs font-semibold text-slate-500">
                          QR Generating...
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
      <div className="space-y-6 pt-12">
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-4">History & Pending</h2>
        
        {pastBookings.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <p className="text-slate-600 text-sm font-semibold">No past bookings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastBookings.map((b) => {
              let badgeStyle = 'bg-white/5 border-white/10 text-slate-400';
              let badgeText = b.status;
              
              if (b.status === 'pending') {
                badgeStyle = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                badgeText = 'Payment Pending';
              } else if (b.status === 'confirmed') {
                badgeStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                badgeText = 'Completed';
              } else if (b.status === 'cancelled') {
                badgeStyle = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                badgeText = 'Cancelled';
              }

              return (
                <div
                  key={b._id}
                  className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-colors"
                >
                  <div className="space-y-3 mb-4">
                    <h4 className="font-bold text-base text-white leading-tight line-clamp-1">{b.event?.title || 'Unknown Event'}</h4>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Seats: {b.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}</p>
                      <p>Paid: ${b.totalAmount}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">ID: {b._id.slice(-6)}</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                      {badgeText}
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
