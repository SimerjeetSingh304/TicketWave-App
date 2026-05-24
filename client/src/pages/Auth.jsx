import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User as UserIcon, ShieldAlert, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const Auth = ({ isLoginMode }) => {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(isLoginMode);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // user, organizer
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync state with prop updates
  useEffect(() => {
    setIsLogin(isLoginMode);
    setError('');
  }, [isLoginMode]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        await register(name, email, password, role);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow details */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur-sm"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight">
            {isLogin ? (
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Welcome Back</span>
            ) : (
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Create Account</span>
            )}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {isLogin ? 'Enter details to log in to your account' : 'Register to unlock booking events'}
          </p>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs mb-6 animate-pulse-slow">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm text-slate-100 placeholder-slate-600 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm text-slate-100 placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm text-slate-100 placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold tracking-wide uppercase block">Register As</label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    role === 'user'
                      ? 'border-teal-500 bg-teal-500/10 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  General Attendee
                </button>
                <button
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    role === 'organizer'
                      ? 'border-teal-500 bg-teal-500/10 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  Event Organizer
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 mt-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-teal-500/10 flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{submitting ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            {!submitting && (isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-500">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <Link to="/register" className="text-teal-400 hover:text-teal-300 font-semibold hover:underline">
                Create account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold hover:underline">
                Sign in
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Auth;
