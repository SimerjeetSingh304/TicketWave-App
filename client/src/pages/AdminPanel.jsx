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
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Title banner */}
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Admin Panel</h1>
        <p className="text-slate-500 text-sm mt-0.5">Control global site permissions and moderate live event campaigns</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Database</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] flex items-center space-x-2 ${
            activeTab === 'events'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Event Moderation</span>
        </button>
      </div>

      {/* ERROR alerts */}
      {roleError && activeTab === 'users' && (
        <div className="flex items-center space-x-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
          <span>{roleError}</span>
        </div>
      )}

      {eventError && activeTab === 'events' && (
        <div className="flex items-center space-x-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
          <span>{eventError}</span>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'users' ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          {usersLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400 border-collapse">
                <thead className="bg-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-center">Permissions Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-200">{u.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{u.email}</td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleRoleChange(u._id, u.role, 'user')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                              u.role === 'user'
                                ? 'bg-white/5 border-cyan-500/40 text-cyan-400 shadow-sm'
                                : 'border-white/10 bg-white/5 hover:border-white/20 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            User
                          </button>
                          <button
                            onClick={() => handleRoleChange(u._id, u.role, 'organizer')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                              u.role === 'organizer'
                                ? 'bg-white/5 border-emerald-500/40 text-emerald-400 shadow-sm'
                                : 'border-white/10 bg-white/5 hover:border-white/20 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Organizer
                          </button>
                          <button
                            onClick={() => handleRoleChange(u._id, u.role, 'admin')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                              u.role === 'admin'
                                ? 'bg-white/5 border-rose-500/40 text-rose-400 shadow-sm'
                                : 'border-white/10 bg-white/5 hover:border-white/20 text-slate-500 hover:text-slate-300'
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
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          {eventsLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400 border-collapse">
                <thead className="bg-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Event Campaign</th>
                    <th className="px-6 py-4">Organizer</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {events.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <strong className="text-slate-200 block">{e.title}</strong>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{e.venue}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div>
                          <span className="text-slate-300 font-medium">{e.organizer?.name}</span>
                          <span className="text-[10px] block text-slate-500 mt-0.5 font-mono">{e.organizer?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs capitalize font-medium">{e.city}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          e.status === 'upcoming'
                            ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                            : e.status === 'cancelled'
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleModerateEvent(e._id, 'upcoming')}
                            disabled={e.status === 'upcoming'}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-lg text-xs font-semibold text-slate-300 disabled:opacity-20 flex items-center space-x-1 transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Activate</span>
                          </button>
                          <button
                            onClick={() => handleModerateEvent(e._id, 'cancelled')}
                            disabled={e.status === 'cancelled'}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-lg text-xs font-semibold text-rose-400 disabled:opacity-20 flex items-center space-x-1 transition-all"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-500" />
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
