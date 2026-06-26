import React, { useState, useEffect } from 'react';
import { getSocket } from '../socket/socket';
import { Armchair, AlertTriangle } from 'lucide-react';

const SeatMap = ({
  eventId,
  activeSection,
  setActiveSection,
  event,
  user,
  selectedSeats,
  setSelectedSeats,
  initialLockedSeats,
  bookedSeats,
  setBookedSeats,
  handleSeatClick,
  errorMsg
}) => {
  
  // lockedSeatsMap stores locks in the structure: { "section-seatNumber": { userId, lockedAt, ttlSeconds } }
  const [lockedSeatsMap, setLockedSeatsMap] = useState({});
  const [, setTick] = useState(0);

  // Populate initial locks on load
  useEffect(() => {
    const initialMap = {};
    if (initialLockedSeats) {
      initialLockedSeats.forEach((lock) => {
        const key = `${lock.section}-${lock.seatNumber}`;
        initialMap[key] = {
          userId: lock.userId,
          lockedAt: Date.now(),
          ttlSeconds: lock.ttlSeconds || 600 // Default 10 minutes if not provided
        };
      });
    }
    setLockedSeatsMap(initialMap);
  }, [initialLockedSeats]);

  // Socket triggers inside the SeatMap component
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('seat-locked', ({ section, seatNumber, userId: lockerId, lockedAt, ttlSeconds }) => {
      setLockedSeatsMap((prev) => ({
        ...prev,
        [`${section}-${seatNumber}`]: {
          userId: lockerId,
          lockedAt: lockedAt || Date.now(),
          ttlSeconds: ttlSeconds || 600
        }
      }));
    });

    socket.on('seat-released', ({ section, seatNumber }) => {
      setLockedSeatsMap((prev) => {
        const next = { ...prev };
        delete next[`${section}-${seatNumber}`];
        return next;
      });
    });

    socket.on('seats-booked', ({ seats }) => {
      setLockedSeatsMap((prev) => {
        const next = { ...prev };
        seats.forEach((s) => {
          delete next[`${s.section}-${s.seatNumber}`];
        });
        return next;
      });
    });

    return () => {
      socket.off('seat-locked');
      socket.off('seat-released');
      socket.off('seats-booked');
    };
  }, [eventId]);

  // Tick timer every second to re-calculate countdowns and expire local locks
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);

      const now = Date.now();
      let hasChanges = false;

      setLockedSeatsMap((prev) => {
        const next = { ...prev };
        for (const [key, lock] of Object.entries(prev)) {
          const remainingMs = (lock.lockedAt + lock.ttlSeconds * 1000) - now;
          
          if (remainingMs <= 0) {
            delete next[key];
            hasChanges = true;

            // Rollback from my selected seats if my lock expired
            const [section, seatNumStr] = key.split('-');
            const seatNumber = parseInt(seatNumStr, 10);
            
            setSelectedSeats((prevSelected) =>
              prevSelected.filter((s) => !(s.section === section && s.seatNumber === seatNumber))
            );
          }
        }
        return hasChanges ? next : prev;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [setSelectedSeats]);

  if (!activeSection) return null;

  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-6 md:p-10 space-y-10 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6 relative z-10">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center space-x-3 tracking-tight mb-2">
            <Armchair className="w-8 h-8 text-indigo-400" />
            <span>Select Your Seats</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium">Choose seats from the interactive layout below</p>
        </div>

        {/* Section Selector Badges */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {event.seatSections.map((section) => (
            <button
              key={section.name}
              onClick={() => {
                setActiveSection(section);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wider ${
                activeSection?.name === section.name
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-500'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              {section.name} <span className="opacity-70 ml-1">(${section.price})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12 relative z-10">
        {/* Curved Stage/Screen Representation */}
        <div className="relative max-w-2xl mx-auto py-2">
          <div className="h-2 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full opacity-60 shadow-[0_0_30px_rgba(79,70,229,0.8)]"></div>
          <div className="text-[10px] uppercase font-black text-center text-indigo-400 mt-4 tracking-[0.3em]">
            STAGE / SCREEN
          </div>
        </div>

        {/* Legend Guide */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/[0.02] border border-white/5 py-4 rounded-2xl max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <span className="w-4 h-4 rounded-md bg-[#1e293b] border border-slate-700 block"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="w-4 h-4 rounded-md bg-indigo-500 border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)] block"></span>
            <span className="text-white">Selected</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="w-4 h-4 rounded-md bg-amber-500/20 border border-amber-500/40 block"></span>
            <span>Locked</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="w-4 h-4 rounded-md bg-rose-500/20 border border-rose-500/30 block"></span>
            <span>Booked</span>
          </div>
        </div>

        {/* Local Error Alerts */}
        {errorMsg && (
          <div className="max-w-md mx-auto flex items-center justify-center space-x-2 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold text-center animate-bounce">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Seat Layout Grid */}
        <div className="max-w-5xl mx-auto overflow-x-auto p-4 bg-[#0b1120] border border-white/5 rounded-3xl shadow-inner">
          <div className="min-w-[500px] p-8 flex flex-col items-center">
            <div className="seat-grid-container w-full">
              {Array.from({ length: activeSection.totalSeats }).map((_, idx) => {
                const seatNum = idx + 1;
                const sectionName = activeSection.name;
                const key = `${sectionName}-${seatNum}`;

                const isBooked = bookedSeats.some(
                  (s) => s.section === sectionName && s.seatNumber === seatNum
                );

                const lock = lockedSeatsMap[key];
                const isLocked = !!lock;
                const isLockedByOther = isLocked && lock.userId !== user?.id;
                const isLockedByMe = isLocked && lock.userId === user?.id;

                const isSelectedByMe = selectedSeats.some(
                  (s) => s.section === sectionName && s.seatNumber === seatNum
                );

                // Compute live countdown text
                let countdownText = '';
                if (isLocked) {
                  const remainingMs = (lock.lockedAt + lock.ttlSeconds * 1000) - Date.now();
                  if (remainingMs > 0) {
                    const remainingSecs = Math.floor(remainingMs / 1000);
                    const mins = Math.floor(remainingSecs / 60);
                    const secs = remainingSecs % 60;
                    countdownText = `${mins}:${secs.toString().padStart(2, '0')}`;
                  }
                }

                let seatStyle = 'bg-[#1e293b] border-slate-700 hover:border-indigo-400 text-slate-400 hover:text-white cursor-pointer';
                let isDisabled = false;

                if (isBooked) {
                  seatStyle = 'bg-rose-500/10 border-rose-500/20 text-rose-500/30 cursor-not-allowed';
                  isDisabled = true;
                } else if (isLockedByOther) {
                  seatStyle = 'bg-amber-500/10 border-amber-500/20 text-amber-500/30 cursor-not-allowed';
                  isDisabled = true;
                } else if (isLockedByMe || isSelectedByMe) {
                  seatStyle = 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]';
                }

                return (
                  <button
                    key={seatNum}
                    disabled={isDisabled}
                    onClick={() => handleSeatClick(sectionName, seatNum)}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center font-black text-xs border transition-all duration-300 ${seatStyle}`}
                  >
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>{seatNum}</span>
                      {isLocked && countdownText && (
                        <span className="text-[8px] font-mono mt-1 leading-none block opacity-80">
                          {countdownText}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SeatMap;
