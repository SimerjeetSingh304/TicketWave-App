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
    <footer className="bg-black text-slate-400 py-16 px-6 mt-auto">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between gap-12">
        
        {/* Brand details */}
        <div className="max-w-xs space-y-4">
          <Link to="/" className="text-2xl font-black tracking-tight text-white block mb-2">
            TicketWave
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            The global standard for secure event ticketing. Experience live like never before.
          </p>
          <div className="flex items-center space-x-3 pt-2">
            <a href="https://github.com" className="w-8 h-8 rounded-full bg-[#1e293b]/50 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Github className="w-4 h-4 text-slate-300" />
            </a>
            <a href="https://twitter.com" className="w-8 h-8 rounded-full bg-[#1e293b]/50 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Twitter className="w-4 h-4 text-slate-300" />
            </a>
            <a href="https://instagram.com" className="w-8 h-8 rounded-full bg-[#1e293b]/50 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Mail className="w-4 h-4 text-slate-300" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 w-full max-w-4xl">
          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-white text-[10px] uppercase tracking-[0.2em] font-black">PLATFORM</h4>
            <ul className="space-y-3 text-xs font-semibold">
              <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Sell Tickets</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-white text-[10px] uppercase tracking-[0.2em] font-black">LEGAL</h4>
            <ul className="space-y-3 text-xs font-semibold">
              <li><Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <h4 className="text-white text-[10px] uppercase tracking-[0.2em] font-black">CONTACT</h4>
            <a href="mailto:support@ticketwave.com" className="text-xs font-semibold hover:text-white transition-colors block mt-3">
              support@ticketwave.com
            </a>
          </div>

          {/* Copyright Area */}
          <div className="col-span-2 md:col-span-1 flex flex-col justify-between items-start md:items-end">
            <div className="text-[10px] text-slate-500 font-medium text-left md:text-right max-w-[150px]">
              © 2026 TicketWave Ticketing. All rights reserved.
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              {/* Payment/Trust small icons */}
              <div className="w-6 h-4 border border-white/10 rounded flex items-center justify-center opacity-50"><span className="text-[8px] font-bold">VISA</span></div>
              <div className="w-6 h-4 border border-white/10 rounded flex items-center justify-center opacity-50"><span className="text-[8px] font-bold">MC</span></div>
              <div className="w-6 h-4 border border-white/10 rounded flex items-center justify-center opacity-50"><span className="text-[8px] font-bold">AMEX</span></div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
