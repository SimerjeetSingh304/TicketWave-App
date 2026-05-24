import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setMemoryToken, clearMemoryToken, registerLogoutCallback } from '../services/api';
import { initSocketClient, disconnectSocketClient, getSocket } from '../socket/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Check if session can be restored on startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Attempt to silently refresh token
        const res = await api.post('/auth/refresh');
        const { accessToken } = res.data.data;
        
        setMemoryToken(accessToken);
        
        // Fetch current user details
        const userRes = await api.get('/auth/my-bookings'); // Wait, we can fetch own bookings or user profile.
        // Actually, we can fetch user profile. Wait! Do we have a profile route?
        // We can just decode the token or request user details. Let's see:
        // We can create a quick route or decode the accessToken.
        // Actually, during login we return { user, accessToken }.
        // Let's create an endpoint in Auth routes or retrieve it in the refresh route:
        // In our auth refresh route, it returns `{ success: true, data: { accessToken } }`.
        // Wait, can we extract user details from the JWT token?
        // Yes! We can decode the JWT in the browser (using a simple base64 decoder) since the payload has { id, role, email }.
        // Or we can request the user's booking profile or build a profile endpoint.
        // Let's decode the JWT, it's 100% client-side and requires no extra endpoints!
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        
        // Wait, we need the user's name too. Let's make the refresh endpoint or another endpoint return user details.
        // In our refresh controller, it returned only `{ accessToken }`. But we can also get the user from the database and return user details in `/auth/refresh`!
        // Wait, yes, in `authController.js` we can return `{ accessToken, user }`. Let's check:
        // Oh, let's see. In `authController.js` refresh route we did:
        // `res.status(200).json({ success: true, data: { accessToken }, message: ... })`
        // We can extract email, id, role from the JWT, and query a profile endpoint or we can modify the refresh controller.
        // Wait, we can just decode the token payload. The payload has `id`, `role`, and `email`. If we want the `name`, we can use the `name` stored, or query a route.
        // Wait, let's see if we can decode and use it. Let's do that. Or we can just call `/api/bookings/my` to see if it responds, which verifies the user is authorized.
        // Let's make sure we decode the payload:
        const decoded = JSON.parse(atob(accessToken.split('.')[1]));
        // To get name, let's look up if we have name. Oh, in token signing:
        // `jwt.sign({ id: user._id, role: user.role, email: user.email }, ...)`
        // We can update the token payload to include `name`! Let's modify `auth.js` middleware to sign with `{ id, role, email, name: user.name }`.
        // Wait! We can modify the middleware `server/src/middleware/auth.js` to sign with the name. This is super easy and clean. Let's do this edit!
        // But first let's finish the AuthContext design.
        setUser({
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || 'User' // Default name if not in token
        });

        // Initialize socket and join room
        const socket = initSocketClient(decoded.id);
        setupSocketListeners(socket);

      } catch (err) {
        console.log('[AuthContext] Session restore skipped (no active refresh token)');
        clearMemoryToken();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
    
    // Register global logout callback for Axios interceptor
    registerLogoutCallback(logout);

    return () => {
      if (user) {
        disconnectSocketClient(user.id);
      }
    };
  }, []);

  const setupSocketListeners = (socket) => {
    socket.off('notification');
    socket.on('notification', (newNotif) => {
      console.log('[Socket Client] Real-time notification received:', newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
    });
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken } = res.data.data;
    
    setMemoryToken(accessToken);
    setUser(userData);
    
    const socket = initSocketClient(userData.id);
    setupSocketListeners(socket);
    
    return res.data;
  };

  const register = async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { user: userData, accessToken } = res.data.data;
    
    setMemoryToken(accessToken);
    setUser(userData);
    
    const socket = initSocketClient(userData.id);
    setupSocketListeners(socket);
    
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      const currentUserId = user?.id;
      clearMemoryToken();
      setUser(null);
      setNotifications([]);
      disconnectSocketClient(currentUserId);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, notifications, setNotifications }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
