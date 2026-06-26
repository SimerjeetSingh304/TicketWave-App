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
    <div className="w-full min-h-screen flex items-center justify-center -mt-20"> {/* Negative margin to offset navbar if needed, or just let it sit full screen */}
      <div className="w-full h-screen flex flex-col lg:flex-row bg-[#0b1120]">
        
        {/* Left Side: Immersive Image */}
        <div className="relative hidden lg:flex flex-1 items-center justify-center overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80" 
            alt="Concert Crowd" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1120]/40 to-[#0b1120]"></div>
          <div className="relative z-10 max-w-lg px-12 animate-fade-in-up">
            <h1 className="text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Your Front Row Seat To <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Eternal Moments.</span>
            </h1>
            <p className="text-lg text-slate-300 font-medium">
              Join the world's most exclusive event platform. Secure, authenticated, and seamless.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-20 py-24 relative overflow-y-auto">
          {/* subtle background glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="w-full max-w-md relative z-10 flex flex-col h-full justify-center">
            
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-normal text-white mb-3">
                {isLogin ? 'Sign in' : 'Create an account'}
              </h2>
              <p className="text-slate-400 font-light text-sm">
                {isLogin ? 'Enter your details to proceed.' : 'Join TicketWave for exclusive access.'}
              </p>
            </div>

            {error && (
              <div className="flex items-start space-x-3 bg-rose-500/10 border-l-2 border-rose-500 text-rose-400 p-4 text-sm mb-8">
                <ShieldAlert className="w-5 h-5 shrink-0 opacity-80" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {!isLogin && (
                <div className="relative group">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-transparent border-b border-white/20 pb-3 text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none transition-colors peer"
                  />
                  <div className="absolute left-0 bottom-0 w-full h-[1px] bg-indigo-500 scale-x-0 peer-focus:scale-x-100 transition-transform origin-left duration-300"></div>
                </div>
              )}

              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-transparent border-b border-white/20 pb-3 text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none transition-colors peer"
                />
                <div className="absolute left-0 bottom-0 w-full h-[1px] bg-indigo-500 scale-x-0 peer-focus:scale-x-100 transition-transform origin-left duration-300"></div>
              </div>

              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-transparent border-b border-white/20 pb-3 text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none transition-colors peer"
                />
                <div className="absolute left-0 bottom-0 w-full h-[1px] bg-indigo-500 scale-x-0 peer-focus:scale-x-100 transition-transform origin-left duration-300"></div>
              </div>

              {!isLogin && (
                <div className="pt-2">
                  <span className="text-xs text-slate-500 mb-4 block">Select Account Type</span>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`py-3 text-sm font-medium transition-all border-b-2 ${
                        role === 'user'
                          ? 'border-indigo-500 text-white bg-white/5'
                          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                      }`}
                    >
                      Attendee
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('organizer')}
                      className={`py-3 text-sm font-medium transition-all border-b-2 ${
                        role === 'organizer'
                          ? 'border-indigo-500 text-white bg-white/5'
                          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                      }`}
                    >
                      Organizer
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 mt-8 bg-white text-[#0b1120] hover:bg-slate-200 font-semibold text-sm rounded-full flex items-center justify-center space-x-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>{submitting ? 'Please wait...' : 'Continue'}</span>
                {!submitting && <ArrowRight className="w-4 h-4 opacity-70" />}
              </button>
            </form>

            <div className="mt-12 text-sm text-slate-500">
              {isLogin ? (
                <p>
                  New here?{' '}
                  <Link to="/register" className="text-white hover:text-indigo-300 transition-colors">
                    Create an account
                  </Link>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <Link to="/login" className="text-white hover:text-indigo-300 transition-colors">
                    Sign in
                  </Link>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
