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
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Armchair className="text-teal-400" />
            <span>Select Your Seats</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">Choose seats from the interactive layout below</p>
        </div>

        {/* Section Selector Badges */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {event.seatSections.map((section) => (
            <button
              key={section.name}
              onClick={() => {
                setActiveSection(section);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                activeSection?.name === section.name
                  ? 'bg-teal-600 border-teal-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {section.name} (₹{section.price})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {/* Curved Stage/Screen Representation */}
        <div className="relative max-w-lg mx-auto py-2">
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500/20 via-teal-500 to-teal-500/20 rounded-full blur-[1px]"></div>
          <div className="text-[10px] uppercase font-bold text-center text-teal-400 mt-2 tracking-widest">
            STAGE / SCREEN THIS WAY
          </div>
        </div>

        {/* Legend Guide */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-b border-white/[0.06] pb-6">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 block"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded bg-teal-600 border border-teal-500 block"></span>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/40 block"></span>
            <span>Locked (Holding)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded bg-rose-500/20 border border-rose-500/30 block"></span>
            <span>Booked</span>
          </div>
        </div>

        {/* Local Error Alerts */}
        {errorMsg && (
          <div className="max-w-md mx-auto p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs text-center animate-bounce">
            {errorMsg}
          </div>
        )}

        {/* Seat Layout Grid */}
        <div className="max-w-4xl mx-auto overflow-x-auto p-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="min-w-[450px] p-6 flex flex-col items-center">
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

                let seatStyle = 'bg-slate-800 border-slate-700 hover:border-teal-500 text-slate-400 hover:text-white cursor-pointer';
                let isDisabled = false;

                if (isBooked) {
                  seatStyle = 'bg-rose-500/20 border-rose-500/30 text-rose-500/40 cursor-not-allowed';
                  isDisabled = true;
                } else if (isLockedByOther) {
                  seatStyle = 'bg-amber-500/20 border-amber-500/40 text-amber-500/40 cursor-not-allowed';
                  isDisabled = true;
                } else if (isLockedByMe || isSelectedByMe) {
                  seatStyle = 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/30';
                }

                return (
                  <button
                    key={seatNum}
                    disabled={isDisabled}
                    onClick={() => handleSeatClick(sectionName, seatNum)}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${seatStyle}`}
                  >
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>{seatNum}</span>
                      {isLocked && countdownText && (
                        <span className="text-[9px] text-rose-400 font-normal mt-0.5 leading-none block">
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
