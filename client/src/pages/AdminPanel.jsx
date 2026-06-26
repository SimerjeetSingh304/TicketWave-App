import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  ShieldAlert,
  Users,
  Calendar,
  UserCheck,
  Ban,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  User,
  LayoutDashboard
} from 'lucide-react';

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users'); // users, events
  const [roleError, setRoleError] = useState('');
  const [eventError, setEventError] = useState('');

  // Fetch Users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data.data;
    },
    enabled: activeTab === 'users'
  });

  // Fetch Events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const res = await api.get('/admin/events');
      return res.data.data;
    },
    enabled: activeTab === 'events'
  });

  // Mutation to update user role
  const userRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const res = await api.patch(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setRoleError('');
    },
    onError: (err) => {
      setRoleError(err.response?.data?.message || 'Failed to update user role.');
    }
  });

  // Mutation to update event status (moderate)
  const eventStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }) => {
      const res = await api.patch(`/admin/events/${eventId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setEventError('');
    },
    onError: (err) => {
      setEventError(err.response?.data?.message || 'Failed to moderate event.');
    }
  });

  const handleRoleChange = (userId, currentRole, newRole) => {
    if (currentRole === newRole) return;
    if (window.confirm(`Are you sure you want to change user role to ${newRole}?`)) {
      userRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleModerateEvent = (eventId, status) => {
    const confirmationMsg = status === 'cancelled'
      ? 'Are you sure you want to cancel this event? Sockets will emit seat releases and all bookings will be cancelled!'
      : `Change event status to ${status}?`;

    if (window.confirm(confirmationMsg)) {
      eventStatusMutation.mutate({ eventId, status });
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 py-8">
      
      {/* Title banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Admin Hub</h1>
          <p className="text-slate-400 text-sm font-medium">Global permissions and live event orchestration</p>
        </div>
        <div className="flex items-center space-x-2 bg-[#1e293b]/50 border border-white/5 rounded-full px-4 py-2 backdrop-blur-sm">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Root Access</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-8">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 font-bold text-sm tracking-wider uppercase transition-all flex items-center space-x-2 relative ${
            activeTab === 'users'
              ? 'text-indigo-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Database</span>
          {activeTab === 'users' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-4 font-bold text-sm tracking-wider uppercase transition-all flex items-center space-x-2 relative ${
            activeTab === 'events'
              ? 'text-indigo-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Event Moderation</span>
          {activeTab === 'events' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
          )}
        </button>
      </div>

      {/* ERROR alerts */}
      {roleError && activeTab === 'users' && (
        <div className="flex items-center space-x-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-semibold">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{roleError}</span>
        </div>
      )}

      {eventError && activeTab === 'events' && (
        <div className="flex items-center space-x-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-semibold">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{eventError}</span>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'users' ? (
        <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          {usersLoading ? (
            <div className="flex items-center justify-center p-20">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="bg-[#1e293b]/40 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5 rounded-tl-xl">Name</th>
                    <th className="px-8 py-5">Email</th>
                    <th className="px-8 py-5">Joined</th>
                    <th className="px-8 py-5 text-center rounded-tr-xl">Permissions Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5 font-black text-white">{u.name}</td>
                      <td className="px-8 py-5 font-mono text-xs text-slate-400 group-hover:text-slate-300">{u.email}</td>
                      <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center space-x-2 bg-[#0b1120] p-1 rounded-xl border border-white/5 inline-flex mx-auto">
                          <button
                            onClick={() => handleRoleChange(u._id, u.role, 'user')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              u.role === 'user'
                                ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                                : 'border border-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            User
                          </button>
                          <button
                            onClick={() => handleRoleChange(u._id, u.role, 'organizer')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              u.role === 'organizer'
                                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                : 'border border-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Organizer
                          </button>
                          <button
                            onClick={() => handleRoleChange(u._id, u.role, 'admin')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              u.role === 'admin'
                                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                                : 'border border-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          {eventsLoading ? (
            <div className="flex items-center justify-center p-20">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="bg-[#1e293b]/40 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5 rounded-tl-xl">Event Campaign</th>
                    <th className="px-8 py-5">Organizer</th>
                    <th className="px-8 py-5">Location</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-center rounded-tr-xl">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.map((e) => (
                    <tr key={e._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div>
                          <strong className="text-white font-black text-base">{e.title}</strong>
                          <span className="text-xs text-slate-500 block mt-1 font-medium">{e.venue}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <span className="text-slate-300 font-bold block">{e.organizer?.name}</span>
                          <span className="text-[10px] text-slate-500 block mt-1 font-mono tracking-wider">{e.organizer?.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs capitalize font-bold text-slate-400">{e.city}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          e.status === 'upcoming'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : e.status === 'cancelled'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => handleModerateEvent(e._id, 'upcoming')}
                            disabled={e.status === 'upcoming'}
                            className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider text-emerald-400 disabled:opacity-30 disabled:pointer-events-none flex items-center space-x-1.5 transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Activate</span>
                          </button>
                          <button
                            onClick={() => handleModerateEvent(e._id, 'cancelled')}
                            disabled={e.status === 'cancelled'}
                            className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-400 disabled:opacity-30 disabled:pointer-events-none flex items-center space-x-1.5 transition-all"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
