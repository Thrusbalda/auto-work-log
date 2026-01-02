import React, { useEffect, useState } from 'react';
import { Play, Square, MapPin, Clock, Briefcase } from 'lucide-react';
import { Coordinates, UserSettings, WorkSession } from '../types';
import { calculateDistance, formatDuration } from '../utils';

interface TrackerProps {
  isWorking: boolean;
  currentSessionStart: number | null;
  settings: UserSettings;
  currentLocation: Coordinates | null;
  onToggleWork: () => void;
  sessions: WorkSession[];
}

const Tracker: React.FC<TrackerProps> = ({
  isWorking,
  currentSessionStart,
  settings,
  currentLocation,
  onToggleWork,
  sessions
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [distanceToWork, setDistanceToWork] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (isWorking && currentSessionStart) {
      interval = window.setInterval(() => {
        setElapsed(Date.now() - currentSessionStart);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isWorking, currentSessionStart]);

  // Distance effect
  useEffect(() => {
    if (currentLocation && settings.workLocation) {
      const dist = calculateDistance(currentLocation, settings.workLocation);
      setDistanceToWork(dist);
    } else {
      setDistanceToWork(null);
    }
  }, [currentLocation, settings.workLocation]);

  const isAtWork = distanceToWork !== null && distanceToWork <= settings.radiusMeters;

  // Get today's total
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysTotalMs = sessions
    .filter(s => s.startTime >= todayStart.getTime() && s.endTime !== null)
    .reduce((acc, curr) => acc + (curr.endTime! - curr.startTime), 0);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 animate-fade-in">
      
      {/* Location Status Badge */}
      <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
        isAtWork 
          ? 'bg-secondary/20 text-secondary border border-secondary/30' 
          : 'bg-gray-700 text-gray-400 border border-gray-600'
      }`}>
        <MapPin size={16} />
        {settings.workLocation 
          ? (isAtWork ? "You are at Work" : `Away from Work (${distanceToWork ? Math.round(distanceToWork) + 'm' : 'Unknown'})`)
          : "Work Location Not Set"}
      </div>

      {/* Main Timer Display */}
      <div className="text-center">
        <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Current Session</h2>
        <div className="text-6xl font-mono font-bold text-white tabular-nums tracking-tight">
          {formatDuration(elapsed)}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onToggleWork}
        className={`w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isWorking
            ? 'bg-red-500/10 border-4 border-red-500 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]'
            : 'bg-primary/10 border-4 border-primary text-primary shadow-[0_0_40px_rgba(59,130,246,0.3)]'
        }`}
      >
        {isWorking ? <Square size={64} fill="currentColor" /> : <Play size={64} fill="currentColor" className="ml-2" />}
      </button>

      <div className="text-center space-y-1">
        <p className="text-xl font-medium text-white">{isWorking ? "Working..." : "Not Working"}</p>
        <p className="text-sm text-gray-400">
          {isWorking 
             ? "Keep up the good work!" 
             : settings.autoLog 
                ? (isAtWork ? "Auto-start active..." : "Waiting to arrive...")
                : "Ready to log."}
        </p>
      </div>

      {/* Daily Summary */}
      <div className="w-full max-w-sm bg-card p-4 rounded-xl border border-gray-700 mt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Today's Total</p>
            <p className="text-lg font-bold text-white">{formatDuration(todaysTotalMs + (isWorking ? elapsed : 0))}</p>
          </div>
        </div>
         <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Sessions</p>
            <p className="text-lg font-bold text-white text-right">
              {sessions.filter(s => s.startTime >= todayStart.getTime()).length + (isWorking ? 1 : 0)}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Tracker;