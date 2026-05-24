import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import EventDetail from './pages/EventDetail.jsx';
import BookingConfirm from './pages/BookingConfirm.jsx';
import MyBookings from './pages/MyBookings.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-100 font-sans pb-12">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth isLoginMode={true} />} />
          <Route path="/register" element={<Auth isLoginMode={false} />} />
          <Route path="/event/:id" element={<EventDetail />} />

          {/* User Protected Routes */}
          <Route
            path="/booking/confirm"
            element={
              <ProtectedRoute allowedRoles={['user', 'organizer', 'admin']}>
                <BookingConfirm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute allowedRoles={['user', 'organizer', 'admin']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Organizer Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
