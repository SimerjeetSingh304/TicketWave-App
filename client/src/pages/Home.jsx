import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import useDebounce from '../hooks/useDebounce';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
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
  const limit = 6;
  const total = filteredEvents.length;
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const paginatedEvents = filteredEvents.slice(skip, skip + limit);

  const isFilterActive = selectedCity || selectedCategory || debouncedSearch || dateFilter;

  return (
    <div className="space-y-12">
      
      {/* Hero Header Section */}
      <div className="relative rounded-3xl overflow-hidden px-8 py-16 md:py-24 text-center border border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-600/10 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover live experiences</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            Your Gateway to <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Unforgettable Moments</span>
          </h1>
          
          <p className="text-slate-400 md:text-lg max-w-xl mx-auto">
            Book tickets to the best concerts, stand-up comedy shows, sports games, and theater events happening in your city.
          </p>

          {/* Autocomplete Input & City dropdown container */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center bg-white/5 p-2 border border-white/10 rounded-2xl md:rounded-full shadow-2xl space-y-2 md:space-y-0 md:space-x-2 max-w-2xl mx-auto relative z-30">
            
            {/* Search Input Autocomplete */}
            <div ref={searchContainerRef} className="flex-grow flex items-center px-3 relative">
              <Search className="w-5 h-5 text-slate-500 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                  setActiveSuggestionIdx(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search events, artists, comedy clubs..."
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none py-2"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setShowSuggestions(false); }}
                  className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Autocomplete Dropdown List */}
              {showSuggestions && searchInput && (
                <div className="absolute left-0 right-0 top-full mt-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 text-left">
                  {suggestions.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      No events found
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {suggestions.map((s, idx) => {
                        const isActive = idx === activeSuggestionIdx;
                        return (
                          <div
                            key={s._id}
                            onClick={() => {
                              navigate(`/event/${s._id}`);
                              setShowSuggestions(false);
                            }}
                            onMouseEnter={() => setActiveSuggestionIdx(idx)}
                            className={`px-4 py-3 border-b border-white/[0.06] last:border-b-0 cursor-pointer flex justify-between items-center transition-all ${
                              isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="text-left max-w-[70%]">
                              <p className="text-sm font-bold truncate leading-tight text-slate-100">
                                {highlightMatch(s.title, searchInput)}
                              </p>
                              <span className="text-[10px] text-slate-500 mt-1 block uppercase tracking-wide capitalize">
                                {s.venue}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-semibold text-slate-400 capitalize">
                                {s.city}
                              </span>
                              <span className="px-2 py-0.5 bg-teal-600/10 border border-teal-500/20 text-[9px] font-bold text-teal-400 rounded-full uppercase">
                                {s.category}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* City Dropdown Filter */}
            <div className="border-t md:border-t-0 md:border-l border-white/10 my-1 md:my-0"></div>
            
            <div ref={cityDropdownRef} className="relative flex items-center px-3 bg-white/5 py-1 rounded-xl">
              <MapPin className="w-4 h-4 text-teal-400 mr-2 shrink-0" />
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="bg-transparent text-sm text-slate-300 focus:outline-none flex items-center justify-between py-1.5 w-full md:w-32 text-left font-semibold"
              >
                <span>{selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : 'All Cities'}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 ml-1 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {cityDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 w-44">
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleCitySelect('')}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors border-b border-white/[0.06] ${
                        !selectedCity ? 'text-teal-400 bg-white/5' : 'text-slate-300'
                      }`}
                    >
                      All Cities
                    </button>
                    {availableCities.map((cityName) => (
                      <button
                        key={cityName}
                        onClick={() => handleCitySelect(cityName)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors border-b border-white/[0.06] last:border-b-0 ${
                          selectedCity.toLowerCase() === cityName.toLowerCase()
                            ? 'text-teal-400 bg-white/5'
                            : 'text-slate-300'
                        }`}
                      >
                        {cityName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Categories scroller & Date panel */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Categories filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none w-full md:w-auto">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === ''
                ? 'bg-teal-600 border-teal-500 text-white shadow-md'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-teal-600 border-teal-500 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Date filter & Reset */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-slate-500 mr-2" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none text-slate-300 cursor-pointer"
            />
          </div>

          {isFilterActive && (
            <button
              onClick={handleResetAll}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold hover:underline flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

      </div>

      {/* Skeletons Loading and Main Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center p-12 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-200">Failed to load events</h3>
            <p className="text-sm text-slate-500">{error.message || 'Check database connection'}</p>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.03] border border-white/[0.06] rounded-3xl">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-slate-300">No events found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            Try adjusting your search queries, clearing dates, or selecting another city filter.
          </p>
          {isFilterActive && (
            <button
              onClick={handleResetAll}
              className="mt-6 px-4 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {paginatedEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-white/10 bg-white/5 rounded-xl text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-all"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400 px-3 font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-white/10 bg-white/5 rounded-xl text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Home;
