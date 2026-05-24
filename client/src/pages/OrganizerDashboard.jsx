import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import {
  TrendingUp,
  DollarSign,
  Ticket,
  Percent,
  Calendar,
  MapPin,
  QrCode,
  Users,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  FileSpreadsheet
} from 'lucide-react';

const OrganizerDashboard = () => {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [verifyIdInput, setVerifyIdInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState('');

  // Fetch organizer events with statistics
  const { data: events = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['organizer-events'],
    queryFn: async () => {
      const res = await api.get('/events/organizer/my-events');
      return res.data.data;
    }
  });

  // Fetch bookings list for a specific event
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['event-bookings', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const res = await api.get(`/bookings/event/${selectedEventId}`);
      return res.data.data;
    },
    enabled: !!selectedEventId
  });

  // Verify ticket scan mutation
  const verifyMutation = useMutation({
    mutationFn: async (bookingId) => {
      const res = await api.get(`/bookings/verify/${bookingId}`);
      return res.data.data;
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      setVerificationError('');
    },
    onError: (err) => {
      setVerificationError(err.response?.data?.message || 'Invalid ticket code or verification failed.');
      setVerificationResult(null);
    }
  });

  const handleVerifyTicketSubmit = (e) => {
    e.preventDefault();
    if (!verifyIdInput) return;
    verifyMutation.mutate(verifyIdInput.trim());
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setVerifyIdInput('');
    setVerificationResult(null);
    setVerificationError('');
  };

  // Compute overall stats
  const totalEvents = events.length;
  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);
  const totalTickets = events.reduce((sum, e) => sum + (e.totalTicketsSold || 0), 0);
  const avgOccupancy = totalEvents > 0 
    ? Math.round(events.reduce((sum, e) => sum + (e.occupancyRate || 0), 0) / totalEvents) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Dashboard title banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Organizer Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track revenues, analyze seat occupancy, and validate event admissions</p>
        </div>

        <button
          onClick={() => setShowScanner(true)}
          className="premium-btn flex items-center space-x-2 self-start md:self-auto"
        >
          <QrCode className="w-5 h-5" />
          <span>Validate Admission QR</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Events Hosted</span>
            <span className="text-2xl font-black text-slate-200">{totalEvents}</span>
          </div>
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Revenues</span>
            <span className="text-2xl font-black text-slate-200">₹{totalRevenue}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Tickets Sold</span>
            <span className="text-2xl font-black text-slate-200">{totalTickets}</span>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Average Occupancy</span>
            <span className="text-2xl font-black text-slate-200">{avgOccupancy}%</span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Events listing column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Active Event Campaigns</h2>
          
          {events.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No events found. Contact admin or create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((e) => {
                const formattedDate = new Date(e.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                const isSelected = selectedEventId === e._id;

                return (
                  <div
                    key={e._id}
                    onClick={() => setSelectedEventId(e._id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500/80 shadow-md shadow-teal-500/5'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            e.status === 'upcoming' 
                              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                              : e.status === 'cancelled' 
                              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          }`}>
                            {e.status}
                          </span>
                          <span className="text-[10px] text-slate-500 capitalize">{e.city}</span>
                        </div>
                        <h3 className="font-extrabold text-base text-slate-200">{e.title}</h3>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-600" />{formattedDate}</span>
                          <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-600" />{e.venue}</span>
                        </div>
                      </div>

                      {/* Stat summary pills */}
                      <div className="flex items-center space-x-3 text-xs bg-white/[0.03] p-2.5 rounded-xl border border-white/10 self-end sm:self-auto">
                        <div className="text-center px-2">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Sold</span>
                          <span className="font-extrabold text-slate-200">{e.totalTicketsSold}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800"></div>
                        <div className="text-center px-2">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Revenue</span>
                          <span className="font-extrabold text-slate-200">₹{e.revenue}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800"></div>
                        <div className="text-center px-2">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Filled</span>
                          <span className="font-extrabold text-slate-200">{e.occupancyRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Event Attendee List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Admission Log</h2>
          
          {!selectedEventId ? (
            <div className="text-center py-16 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl text-slate-500 text-xs">
              <FileSpreadsheet className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <span>Select an event to view booked seats roster</span>
            </div>
          ) : bookingsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              <Users className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <span>No tickets sold yet for this campaign</span>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
              {bookings.map((booking) => (
                <div key={booking._id} className="p-4 space-y-2 hover:bg-slate-800/20 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="text-xs">
                      <p className="font-bold text-slate-200">{booking.user?.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{booking.user?.email}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-cyan-400">
                      ₹{booking.totalAmount}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>
                      Seats: <strong className="text-slate-200">{booking.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}</strong>
                    </span>
                    <span className="text-slate-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Ticket Validator modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-[rgba(8,8,16,0.8)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            
            {/* Modal close */}
            <button
              onClick={handleCloseScanner}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              
              <div className="text-center space-y-2">
                <QrCode className="w-10 h-10 text-teal-400 mx-auto" />
                <h3 className="text-xl font-bold text-slate-100">Admission Ticket Validator</h3>
                <p className="text-slate-500 text-xs">Verify ticket authenticity by entering the unique Booking ID code.</p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleVerifyTicketSubmit} className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={verifyIdInput}
                    onChange={(e) => setVerifyIdInput(e.target.value)}
                    placeholder="Enter Booking ID code e.g. 660f78..."
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm text-slate-100 placeholder-slate-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyMutation.isPending}
                  className="px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
                >
                  Verify
                </button>
              </form>

              {/* Results */}
              {verifyMutation.isPending && (
                <div className="flex items-center justify-center p-6 bg-white/[0.03] rounded-2xl border border-white/10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                </div>
              )}

              {verificationError && (
                <div className="flex items-start space-x-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              {verificationResult && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in text-sm">
                  
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-extrabold text-slate-200">Ticket Authentic</span>
                    <span className={`ml-auto px-2 py-0.5 text-[9px] rounded-full font-bold uppercase ${
                      verificationResult.status === 'confirmed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {verificationResult.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Event Campaign:</span>
                      <strong className="text-slate-200">{verificationResult.eventTitle}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Attendee Name:</span>
                      <strong className="text-slate-200">{verificationResult.userName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Seats Verified:</span>
                      <strong className="text-slate-200">
                        {verificationResult.seats.map(s => `${s.section} #${s.seatNumber}`).join(', ')}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Collected:</span>
                      <strong className="text-cyan-400">₹{verificationResult.totalAmount}</strong>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrganizerDashboard;
