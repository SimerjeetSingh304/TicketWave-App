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
  FileSpreadsheet,
  ChevronDown
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
    <div className="max-w-[1400px] mx-auto px-6 pt-32 pb-12 relative min-h-[80vh]">
      
      {/* Dashboard title banner */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-indigo-300 tracking-tight">Organizer Dashboard</h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">Welcome back, Stellar Promotions. Here's your performance summary.</p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        
        {/* Revenue Card */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-4">Total Revenue</span>
            <span className="text-4xl font-bold text-white block mb-6">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <div className="flex items-center text-amber-400 text-[10px] font-bold">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+12.5% from last month</span>
            </div>
          </div>
          <div className="absolute right-[-10%] bottom-[-20%] text-white/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <DollarSign className="w-40 h-40" />
          </div>
        </div>

        {/* Tickets Sold Card */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-4">Tickets Sold</span>
            <span className="text-4xl font-bold text-white block mb-6">{totalTickets.toLocaleString()}</span>
            <div className="flex items-center text-amber-400 text-[10px] font-bold">
              <Users className="w-3 h-3 mr-1" />
              <span>{avgOccupancy}% capacity average</span>
            </div>
          </div>
          <div className="absolute right-[-10%] bottom-[-20%] text-white/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <Ticket className="w-40 h-40" />
          </div>
        </div>

        {/* Active Events Card */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-4">Active Events</span>
            <span className="text-4xl font-bold text-white block mb-6">{totalEvents}</span>
            <div className="flex items-center text-slate-400 text-[10px] font-bold">
              <Calendar className="w-3 h-3 mr-1" />
              <span>3 events starting this week</span>
            </div>
          </div>
          <div className="absolute right-[-10%] bottom-[-20%] text-white/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <Calendar className="w-40 h-40" />
          </div>
        </div>

      </div>

      {/* Events Listing */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">My Events</h2>
          
          {/* Filters */}
          <div className="flex items-center space-x-2 bg-[#1e293b]/30 p-1 rounded-full border border-white/5">
            <button className="px-5 py-2 rounded-full text-xs font-semibold bg-[#2e3b4e] text-white transition-colors">All Events</button>
            <button className="px-5 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-colors">Upcoming</button>
            <button className="px-5 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-colors">Ongoing</button>
          </div>
        </div>
        
        {events.length === 0 ? (
          <div className="text-center py-16 bg-[#1e293b]/30 border border-white/5 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No events found. Click the + button to create one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((e) => {
              const startDate = new Date(e.date);
              const endDate = new Date(startDate);
              endDate.setDate(startDate.getDate() + 2); // mockup simulation for range
              
              const dateRangeStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

              return (
                <div key={e._id} className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-4 hover:bg-[#1e293b]/60 transition-colors flex items-center justify-between group cursor-pointer">
                  
                  <div className="flex items-center space-x-6">
                    <div className="w-48 h-28 rounded-xl overflow-hidden shrink-0 relative">
                      <img src={e.bannerImage || "https://images.unsplash.com/photo-1540039155733-d7696d4eb98e?auto=format&fit=crop&q=80"} alt={e.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 to-transparent"></div>
                    </div>

                    <div className="space-y-3 py-2">
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-[9px] font-black tracking-widest uppercase rounded">
                          {e.status || 'Upcoming'}
                        </span>
                        <div className="flex items-center text-[11px] font-semibold text-slate-400">
                          <MapPin className="w-3 h-3 mr-1" />
                          {e.venue}, {e.city.toUpperCase()}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white">{e.title}</h3>
                      
                      <div className="text-xs font-semibold text-slate-400">
                        {dateRangeStr}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-12 pr-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${(e.revenue || 0).toLocaleString()}</div>
                      <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{e.totalTicketsSold} Tickets Sold</div>
                    </div>
                    <button className="text-slate-500 group-hover:text-white transition-colors">
                      <ChevronDown className="w-5 h-5 -rotate-90" />
                    </button>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-transform hover:scale-105 z-50">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
        </svg>
      </button>

    </div>
  );
};

export default OrganizerDashboard;
