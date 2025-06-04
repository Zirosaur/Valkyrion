import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Globe, Check, Volume2, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoJoin, setAutoJoin] = useState(true);
  const [highQuality, setHighQuality] = useState(true);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('valkyrion-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setNotifications(settings.notifications ?? true);
      setAutoJoin(settings.autoJoin ?? true);
      setHighQuality(settings.highQuality ?? true);
    }
  }, []);

  const handleSave = () => {
    // Save all settings to localStorage
    const settings = {
      notifications,
      autoJoin,
      highQuality
    };
    localStorage.setItem('valkyrion-settings', JSON.stringify(settings));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400">Customize your experience</p>
              </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-8">
              {/* Audio Settings */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Audio Settings</h2>
                </div>
                
                <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">High Quality Audio</h3>
                      <p className="text-gray-400 text-sm">Enable 320kbps streaming with volume boost</p>
                    </div>
                    <button
                      onClick={() => setHighQuality(!highQuality)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        highQuality ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          highQuality ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Notifications</h2>
                </div>
                
                <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Bot Notifications</h3>
                      <p className="text-gray-400 text-sm">Receive updates about bot status and new features</p>
                    </div>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bot Behavior */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Bot Behavior</h2>
                </div>
                
                <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Auto-join Voice Channel</h3>
                      <p className="text-gray-400 text-sm">Automatically join voice channel when summoned</p>
                    </div>
                    <button
                      onClick={() => setAutoJoin(!autoJoin)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoJoin ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoJoin ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Language Display */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Language</h2>
                </div>
                
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">EN</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">English</p>
                        <p className="text-sm text-gray-400">Currently active language</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Save Changes
                </button>
              </div>

              {/* Success Message */}
              {saved && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 font-medium">Settings saved successfully!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}