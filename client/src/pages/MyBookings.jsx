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
    <div className="max-w-4xl mx-auto space-y-10">
      
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">My Tickets</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage and view your purchased entrance tickets</p>
      </div>

      {/* Confirmed Tickets List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Active Admissions</h2>
        
        {activeBookings.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.03] border border-white/10 rounded-2xl">
            <Ticket className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No active bookings found.</p>
          </div>
        ) : (
          <div className="space-y-6">
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
                  className="flex flex-col lg:flex-row bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl"
                >
                  {/* Left Column: Event details (70%) */}
                  <div className="w-full lg:w-[70%] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="px-2.5 py-0.5 bg-teal-600/10 border border-teal-500/20 rounded-full text-[10px] font-bold text-teal-400 tracking-wide uppercase">
                          {booking.event?.category || 'Event'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-green-500/10 border border-green-500/20 text-green-400">
                          Confirmed
                        </span>
                      </div>
                      <h3 className="font-extrabold text-xl text-slate-100">{booking.event?.title}</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 pt-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                          <span className="capitalize">{booking.event?.venue}, {booking.event?.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Seats</span>
                        <span className="text-slate-200 font-bold">
                          {booking.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Amount Paid</span>
                        <span className="text-slate-200 font-bold">₹{booking.totalAmount}</span>
                      </div>
                      
                      {isCancellable && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={cancelMutation.isPending}
                          className="px-4 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold rounded-xl flex items-center space-x-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{isCancelling ? 'Cancelling...' : 'Cancel Booking'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: QR Code ticket section (30%) */}
                  <div className="w-full lg:w-[30%] bg-white/[0.03] p-6 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-800/80 relative">
                    
                    {/* Visual notches on ticket divider */}
                    <div className="hidden lg:block absolute -left-3 top-0 w-6 h-6 rounded-full bg-[#080810] border-b border-white/10"></div>
                    <div className="hidden lg:block absolute -left-3 bottom-0 w-6 h-6 rounded-full bg-[#080810] border-t border-white/10"></div>

                    {booking.qrCode ? (
                      <div className="flex flex-col items-center space-y-2">
                        <img
                          src={booking.qrCode}
                          alt="Ticket QR Code"
                          className="w-24 h-24 rounded-lg"
                        />
                        <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                          Scan at venue
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-24 h-24 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 text-center px-2 text-[10px] text-slate-500">
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
      <div className="space-y-4 pt-6">
        <h2 className="text-lg font-bold border-b border-slate-800 pb-2">History & Pending</h2>
        
        {pastBookings.length === 0 ? (
          <div className="text-center py-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <p className="text-slate-500 text-xs">No past bookings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pastBookings.map((b) => {
              let badgeStyle = 'bg-slate-800 border-slate-700 text-slate-400';
              let badgeText = b.status;
              
              if (b.status === 'pending') {
                badgeStyle = 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
                badgeText = 'Payment Pending';
              } else if (b.status === 'confirmed') {
                badgeStyle = 'bg-green-500/10 border border-green-500/20 text-green-400';
                badgeText = 'Confirmed';
              } else if (b.status === 'cancelled') {
                badgeStyle = 'bg-red-500/10 border border-red-500/20 text-red-400';
                badgeText = 'Cancelled';
              }

              return (
                <div
                  key={b._id}
                  className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex justify-between items-start"
                >
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <h4 className="font-bold text-sm text-slate-300 leading-tight">{b.event?.title || 'Unknown Event'}</h4>
                    <p>Seats: {b.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}</p>
                    <p>Paid: ₹{b.totalAmount}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${badgeStyle}`}>
                    {badgeText}
                  </span>
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
