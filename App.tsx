import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Clock, Settings as SettingsIcon } from 'lucide-react';
import Tracker from './components/Tracker';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { AppTab, Coordinates, UserSettings, WorkSession } from './types';
import { calculateDistance } from './utils';

// Default Settings
const DEFAULT_SETTINGS: UserSettings = {
  workLocation: null,
  radiusMeters: 200,
  autoLog: true,
};

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TRACKER);
  
  // Persistent State
  const [sessions, setSessions] = useState<WorkSession[]>(() => {
    const saved = localStorage.getItem('awl_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('awl_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem('awl_currentSessionId');
  });

  // Ephemeral State
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  // Trigger to manage the polling loop sequence
  const [geoUpdateTrigger, setGeoUpdateTrigger] = useState(0);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('awl_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('awl_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('awl_currentSessionId', currentSessionId);
    } else {
      localStorage.removeItem('awl_currentSessionId');
    }
  }, [currentSessionId]);

  // Geolocation Polling Function
  const fetchLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      console.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCurrentLocation(newCoords);
        setGeoUpdateTrigger(prev => prev + 1);
      },
      (error) => {
        console.error("Geo Error", error);
        // Ensure loop continues even if there is an error (e.g. signal loss)
        setGeoUpdateTrigger(prev => prev + 1);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  // Initial Fetch on Mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Dynamic Polling Interval Logic
  useEffect(() => {
    let timeoutId: number;

    const scheduleNextFetch = () => {
      let interval = 60000; // Default 1 min

      if (currentLocation && settings.workLocation) {
        const dist = calculateDistance(currentLocation, settings.workLocation);
        const radius = settings.radiusMeters;

        // Smart Battery Optimization Strategy:
        // 1. Critical Zone: Inside or near boundary (Radius + 500m). 
        //    Check frequently (20s) to catch entry/exit events accurately.
        if (dist <= radius + 500) {
           interval = 20000; 
        } 
        // 2. Approaching Zone: Within 5km.
        //    Check moderately (2 mins) as user might be driving to work.
        else if (dist <= 5000) {
           interval = 120000; 
        } 
        // 3. Far Zone: > 5km.
        //    Check rarely (5 mins) to save battery when stationary at home or far away.
        else {
           interval = 300000; 
        }
      }

      timeoutId = window.setTimeout(fetchLocation, interval);
    };

    scheduleNextFetch();

    return () => clearTimeout(timeoutId);
  }, [geoUpdateTrigger, currentLocation, settings, fetchLocation]);

  const toggleWork = useCallback(() => {
    if (currentSessionId) {
      // Stop Working
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, endTime: Date.now(), durationMinutes: (Date.now() - s.startTime) / 60000 };
        }
        return s;
      }));
      setCurrentSessionId(null);
    } else {
      // Start Working
      const newSession: WorkSession = {
        id: crypto.randomUUID(),
        startTime: Date.now(),
        endTime: null,
        durationMinutes: 0
      };
      setSessions(prev => [...prev, newSession]);
      setCurrentSessionId(newSession.id);
    }
  }, [currentSessionId]);

  // "Smart Assist" / Auto Logic
  useEffect(() => {
    if (!settings.autoLog || !settings.workLocation || !currentLocation) return;
    
    // We rely on the dynamic polling interval to govern how often this check runs.
    // When close (polling 20s), we check every 20s. When far (polling 5m), we check every 5m.

    const dist = calculateDistance(currentLocation, settings.workLocation);
    const isAtWork = dist <= settings.radiusMeters;
    const isWorking = !!currentSessionId;

    // Logic: If at work and not working -> Start
    if (isAtWork && !isWorking) {
      toggleWork();
      console.log("Auto-started work session based on location.");
    } 
    // Logic: If not at work and working -> Stop
    else if (!isAtWork && isWorking) {
      toggleWork();
      console.log("Auto-stopped work session based on location.");
    }
  }, [currentLocation, settings, currentSessionId, toggleWork]);

  const activeSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="h-full flex flex-col max-w-md mx-auto bg-dark shadow-2xl overflow-hidden relative">
      
      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative z-10">
        {activeTab === AppTab.TRACKER && (
          <Tracker 
            isWorking={!!currentSessionId} 
            currentSessionStart={activeSession ? activeSession.startTime : null}
            settings={settings}
            currentLocation={currentLocation}
            onToggleWork={toggleWork}
            sessions={sessions}
          />
        )}
        {activeTab === AppTab.REPORTS && (
          <Reports sessions={sessions} />
        )}
        {activeTab === AppTab.SETTINGS && (
          <Settings 
            settings={settings} 
            currentLocation={currentLocation} 
            onSaveSettings={setSettings} 
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-20 bg-card border-t border-gray-800 flex items-center justify-around pb-2 z-20">
        <button 
          onClick={() => setActiveTab(AppTab.TRACKER)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === AppTab.TRACKER ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Clock size={24} />
          <span className="text-xs font-medium">Track</span>
        </button>
        
        <button 
           onClick={() => setActiveTab(AppTab.REPORTS)}
           className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === AppTab.REPORTS ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-xs font-medium">Reports</span>
        </button>

        <button 
           onClick={() => setActiveTab(AppTab.SETTINGS)}
           className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === AppTab.SETTINGS ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <SettingsIcon size={24} />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </nav>
      
    </div>
  );
}

export default App;