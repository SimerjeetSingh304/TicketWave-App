import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import useDebounce from '../hooks/useDebounce';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import Footer from '../components/Footer';
import { Search, MapPin, Calendar, Compass, Sparkles, AlertCircle, X, ChevronDown } from 'lucide-react';

const CATEGORIES = ['Concerts', 'Comedy', 'Theatre', 'Conferences', 'Sports'];

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input and dropdown states
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Sync parameters from URL params
  const selectedCity = searchParams.get('city') || '';
  const selectedCategory = searchParams.get('category') || '';

  // Fetch all events from API once (client-side filtering)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['all-events-list'],
    queryFn: async () => {
      const res = await api.get('/events?limit=100'); // Fetch enough events to filter client-side
      return res.data.data;
    }
  });

  const allEvents = data?.events || [];

  // Extract unique cities from fetched events database
  const availableCities = Array.from(
    new Set(allEvents.map((e) => (e.city || '').trim().toLowerCase()))
  )
    .filter(Boolean)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1)); // Title Case

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation for autocomplete suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIdx >= 0 && activeSuggestionIdx < suggestions.length) {
        navigate(`/event/${suggestions[activeSuggestionIdx]._id}`);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Autocomplete Suggestions - Client-side filter from allEvents by title match
  const suggestions = searchInput.trim()
    ? allEvents
        .filter((e) => e.title.toLowerCase().includes(searchInput.toLowerCase()))
        .slice(0, 6)
    : [];

  // Highlight matching text helper
  const highlightMatch = (text, search) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-teal-500/30 text-teal-300 font-bold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Update filters in URL
  const updateFilters = (newCity, newCategory) => {
    const params = {};
    if (newCity) params.city = newCity;
    if (newCategory) params.category = newCategory;
    setSearchParams(params);
    setPage(1); // Reset page on filter change
  };

  const handleCitySelect = (cityValue) => {
    updateFilters(cityValue, selectedCategory);
    setCityDropdownOpen(false);
  };

  const handleCategorySelect = (categoryValue) => {
    updateFilters(selectedCity, categoryValue === selectedCategory ? '' : categoryValue);
  };

  const handleResetAll = () => {
    setSearchInput('');
    setDateFilter('');
    setSearchParams({});
    setPage(1);
  };

  // Perform Client-side filtering for main grid
  const filteredEvents = allEvents.filter((event) => {
    // 1. City filter
    if (selectedCity && event.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    // 2. Category filter
    if (selectedCategory && event.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    // 3. Search debounced input filter
    if (debouncedSearch && !event.title.toLowerCase().includes(debouncedSearch.toLowerCase())) {
      return false;
    }
    // 4. Date filter
    if (dateFilter) {
      const eventDate = new Date(event.date).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      if (eventDate !== filterDate) return false;
    }
    return true;
  });

  // Client-side pagination variables
  const limit = 20; // Increased limit so events fit on 1 page
  const total = filteredEvents.length;
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const paginatedEvents = filteredEvents.slice(skip, skip + limit);

  const isFilterActive = selectedCity || selectedCategory || debouncedSearch || dateFilter;

  // Split events for sections
  const trendingEvents = allEvents.slice(0, 3);
  const featuredEvent = allEvents.length > 0 ? allEvents[0] : null;

  return (
    <div className="w-full overflow-x-hidden flex flex-col min-h-screen">
      
      {/* Edge-to-Edge Luxury Hero Section */}
      <div className="relative h-[85vh] min-h-[600px] w-full mt-[-80px] z-0 flex flex-col items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover" 
          />
          {/* Very dark gradient overlay to ensure text pops and matches the navy theme */}
          <div className="absolute inset-0 bg-[#0b1120]/70"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-[#0b1120]/30"></div>
        </div>

        {/* Centered Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-6 animate-fade-in-up pt-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-black tracking-[0.2em] text-indigo-300 uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exclusive Access</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05]">
            Experience The <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Extraordinary.</span>
          </h1>
          
          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Secure authenticated tickets for the world's most anticipated tours, championships, and immersive performances.
          </p>

          <div className="pt-8">
            <a href="#explore" className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#0b1120] font-bold text-sm rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 duration-300">
              Explore Events
            </a>
          </div>
        </div>

        {/* Floating Filter Bar */}
        <div id="explore" className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-6 z-30">
          <div className="bg-[#1e293b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 relative">
            
            {/* City Filter */}
            <div ref={cityDropdownRef} className="relative flex-1 w-full group">
              <button 
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="w-full flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-5 py-4 transition-colors"
              >
                <MapPin className="w-5 h-5 text-indigo-400 mr-3" />
                <div className="text-left flex-grow">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Location</div>
                  <div className="text-sm text-white font-semibold">{selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : 'Any City'}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {cityDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#1e293b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                  <div className="max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { handleCitySelect(''); setCityDropdownOpen(false); }}
                      className="w-full text-left px-5 py-3 text-sm font-semibold hover:bg-white/5 transition-colors text-slate-300 border-b border-white/5"
                    >
                      All Cities
                    </button>
                    {availableCities.map(city => (
                      <button
                        key={city}
                        onClick={() => { handleCitySelect(city); setCityDropdownOpen(false); }}
                        className="w-full text-left px-5 py-3 text-sm font-semibold hover:bg-white/5 transition-colors text-slate-300 border-b border-white/5 last:border-0"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date Filter */}
            <div className="relative flex-1 w-full group">
              <div className="w-full flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-5 py-4 transition-colors">
                <Calendar className="w-5 h-5 text-teal-400 mr-3" />
                <div className="text-left flex-grow">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Date</div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                    className="bg-transparent focus:outline-none text-white text-sm font-semibold [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert cursor-pointer w-full"
                  />
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative flex-[1.5] w-full group">
              <div className="w-full flex items-center bg-white/5 hover:bg-white/10 focus-within:bg-white/10 border border-white/5 focus-within:border-indigo-500/50 rounded-2xl px-5 py-4 transition-colors">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <div className="text-left flex-grow">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Search</div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search artist, event, or venue..."
                    className="bg-transparent border-none focus:outline-none text-white placeholder-slate-500 text-sm font-semibold w-full"
                  />
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <ul className="py-2">
                    {suggestions.map((event, idx) => (
                      <li
                        key={event._id}
                        className={`px-4 py-3 cursor-pointer text-sm transition-colors flex items-center space-x-3 ${
                          idx === activeSuggestionIdx ? 'bg-indigo-600/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                        onMouseEnter={() => setActiveSuggestionIdx(idx)}
                        onClick={() => navigate(`/event/${event._id}`)}
                      >
                        <div className="w-8 h-8 rounded bg-[#0f172a] shrink-0 overflow-hidden">
                          <img src={event.bannerImage || "https://images.unsplash.com/photo-1540039155733-d7696d4eb98e?auto=format&fit=crop&q=60"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">{highlightMatch(event.title, searchInput)}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{event.city}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-6 pt-32 pb-24 space-y-24 flex-grow">
        


        {/* Active Filters Display */}
        {isFilterActive && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <span className="font-semibold text-white">{filteredEvents.length}</span> results found
            </div>
            <button
              onClick={handleResetAll}
              className="flex items-center text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filters
            </button>
          </div>
        )}

        {/* Events Grid */}
        <div className="space-y-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">Failed to load events</h3>
              <p className="text-slate-400 text-sm mt-2">{error.message}</p>
            </div>
          ) : paginatedEvents.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <Compass className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No events found</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm">
                We couldn't find any events matching your current filters. Try adjusting your search or exploring all categories.
              </p>
              <button
                onClick={handleResetAll}
                className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
              >
                View All Events
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>

              {/* Minimal Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-8">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        page === i + 1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#1e293b] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
