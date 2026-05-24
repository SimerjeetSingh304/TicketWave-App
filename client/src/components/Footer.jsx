import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Github, Twitter, Instagram, Send, CheckCircle } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  const handleFilterSelect = (type, value) => {
    navigate('/');
    // Set search param in a timeout so route change happens first if not on home page
    setTimeout(() => {
      const params = {};
      if (type === 'city') {
        params.city = value.toLowerCase();
        const currentCategory = searchParams.get('category');
        if (currentCategory) params.category = currentCategory;
      } else if (type === 'category') {
        params.category = value.toLowerCase();
        const currentCity = searchParams.get('city');
        if (currentCity) params.city = currentCity;
      }
      setSearchParams(params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <footer className="bg-transparent border-t border-white/[0.06] text-slate-400 mt-20 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 border-b border-white/[0.06] pb-12 mb-8">
        
        {/* Brand details */}
        <div className="lg:col-span-2 space-y-5">
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold tracking-tight text-white">
            <span className="text-teal-500 font-extrabold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">TicketWave</span>
            <span>🌊</span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            Discover live experiences, secure verified tickets, and lock seats in real-time. TicketWave is your premier destination for concerts, standup comedy, sports, and theatre.
          </p>
          <div className="flex items-center space-x-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <h4 className="text-white text-xs uppercase tracking-widest font-black">Categories</h4>
          <ul className="space-y-2.5 text-sm">
            {['Concerts', 'Comedy', 'Theatre', 'Conferences', 'Sports'].map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => handleFilterSelect('category', cat)}
                  className="hover:text-white transition-colors duration-200 text-left font-medium hover:underline"
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Cities Section */}
        <div className="space-y-4">
          <h4 className="text-white text-xs uppercase tracking-widest font-black">Trending Cities</h4>
          <ul className="space-y-2.5 text-sm">
            {['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'].map((city) => (
              <li key={city}>
                <button
                  onClick={() => handleFilterSelect('city', city)}
                  className="hover:text-white transition-colors duration-200 text-left font-medium hover:underline"
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div className="space-y-4 col-span-1 md:col-span-2 lg:col-span-1">
          <h4 className="text-white text-xs uppercase tracking-widest font-black">Stay Updated</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Subscribe to our newsletter to receive updates on hot events and early-bird ticket offers.
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="space-y-2">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1.5 focus-within:border-teal-500/50 transition-all">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none w-full px-2 py-1"
                disabled={subscribed}
              />
              <button
                type="submit"
                disabled={subscribed}
                className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition-all"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
            {subscribed && (
              <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Successfully subscribed! Check your inbox.</span>
              </div>
            )}
          </form>
        </div>

      </div>

      {/* Bottom Metadata Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
        <div>
          <span>© 2026 TicketWave. Created with premium UI tokens & MERN.</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/" className="hover:text-slate-400 hover:underline transition-colors font-medium">Terms of Service</Link>
          <Link to="/" className="hover:text-slate-400 hover:underline transition-colors font-medium">Privacy Policy</Link>
          <Link to="/" className="hover:text-slate-400 hover:underline transition-colors font-medium">Cookie settings</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
