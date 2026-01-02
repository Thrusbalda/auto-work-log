import React from 'react';
import { MapPin, Save, RefreshCw } from 'lucide-react';
import { UserSettings, Coordinates } from '../types';

interface SettingsProps {
  settings: UserSettings;
  currentLocation: Coordinates | null;
  onSaveSettings: (settings: UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, currentLocation, onSaveSettings }) => {
  const handleSetCurrentLocation = () => {
    if (currentLocation) {
      onSaveSettings({
        ...settings,
        workLocation: currentLocation
      });
    } else {
      alert("Waiting for GPS signal...");
    }
  };

  const handleToggleAutoLog = () => {
    onSaveSettings({
      ...settings,
      autoLog: !settings.autoLog
    });
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSaveSettings({
      ...settings,
      radiusMeters: Number(e.target.value)
    });
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        
        {/* Work Location Card */}
        <div className="bg-card p-5 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-primary" size={24} />
            <h2 className="text-lg font-semibold">Work Location</h2>
          </div>
          
          <div className="mb-4 text-sm text-gray-400">
            {settings.workLocation ? (
              <div className="flex flex-col gap-1">
                <span>Lat: {settings.workLocation.latitude.toFixed(6)}</span>
                <span>Lng: {settings.workLocation.longitude.toFixed(6)}</span>
              </div>
            ) : (
              "Not set. Go to your workplace and click the button below."
            )}
          </div>

          <button
            onClick={handleSetCurrentLocation}
            disabled={!currentLocation}
            className="w-full py-3 bg-primary hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {currentLocation ? <MapPin size={18} /> : <RefreshCw size={18} className="animate-spin" />}
            Set Current Location as Work
          </button>
        </div>

        {/* Radius Setting */}
        <div className="bg-card p-5 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold mb-2">Detection Radius</h2>
          <p className="text-xs text-gray-400 mb-4">How close do you need to be to be considered "at work"?</p>
          
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="50" 
              max="1000" 
              step="50"
              value={settings.radiusMeters} 
              onChange={handleRadiusChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="font-mono w-16 text-right">{settings.radiusMeters}m</span>
          </div>
        </div>

        {/* Auto Log Toggle */}
        <div className="bg-card p-5 rounded-xl border border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Automatic Mode</h2>
            <p className="text-xs text-gray-400 mt-1">Automatically Start/Stop when entering/leaving radius.</p>
          </div>
          
          <button 
            onClick={handleToggleAutoLog}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.autoLog ? 'bg-secondary' : 'bg-gray-700'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.autoLog ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

         <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-200">
            <strong>Battery Saver Active:</strong> The app automatically adjusts tracking frequency. It checks every 5 minutes when you are far away, and every 20 seconds when you are close to work.
        </div>

      </div>
    </div>
  );
};

export default Settings;