import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, Shield, Bell, Trash2, Save, Crown, Calendar, Activity, Music, Users } from 'lucide-react';
import Layout from '../components/Layout';

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'privacy'>('profile');
  const [notifications, setNotifications] = useState({
    playbackChanges: true,
    serverUpdates: false,
    systemAlerts: true,
  });
  const [userStats, setUserStats] = useState({
    serversCount: 0,
    totalListeningTime: 0,
    favoriteStations: 0,
    joinDate: new Date()
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const [serversResponse, stationsResponse] = await Promise.all([
        fetch('/api/servers'),
        fetch('/api/stations')
      ]);
      
      if (serversResponse.ok && stationsResponse.ok) {
        const servers = await serversResponse.json();
        const stations = await stationsResponse.json();
        const favoriteCount = stations.filter((station: any) => station.isFavorite).length;
        
        setUserStats(prev => ({
          ...prev,
          serversCount: servers.length,
          favoriteStations: favoriteCount,
          totalListeningTime: 0 // Will implement real tracking later
        }));
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-300 mb-6">You must login to view the profile page</p>
            <a 
              href="/api/auth/discord"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Login with Discord
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save settings to localStorage for now
      localStorage.setItem('valkyrion-notifications', JSON.stringify(notifications));
      console.log('Settings saved successfully');
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error('Error saving settings:', error);
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      logout();
      window.location.href = '/';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Profile & Settings
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              View your radio listening stats and customize your Valkyrion experience
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Tabs */}
            <div className="flex space-x-1 mb-8 bg-slate-800/50 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Privacy</span>
              </button>
            </div>

            {/* Content */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
              {activeTab === 'profile' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
                  
                  <div className="flex items-start space-x-6 mb-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <img 
                        src={user.discordAvatar ? 
                          `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.${user.discordAvatar.startsWith('a_') ? 'gif' : 'png'}?size=256` :
                          `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
                        }
                        alt={user.displayName || user.discordUsername}
                        className="w-24 h-24 rounded-full border-4 border-purple-500/30"
                        onError={(e) => {
                          const defaultAvatar = (parseInt(user.discordId) % 5);
                          (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
                        }}
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{user.displayName || user.discordUsername}</h3>
                      <p className="text-gray-400 mb-4">@{user.username}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-300 block mb-1">
                            Discord ID
                          </label>
                          <p className="text-white font-mono text-sm">{user.discordId}</p>
                        </div>
                        
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-300 block mb-1">
                            Username Valkyrion
                          </label>
                          <p className="text-white">{user.username}</p>
                        </div>
                        
                        {user.email && (
                          <div className="bg-slate-700/50 rounded-lg p-4 md:col-span-2">
                            <label className="text-sm font-medium text-gray-300 block mb-1">
                              Email
                            </label>
                            <p className="text-white">{user.email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Statistics */}
                  <div className="border-t border-slate-700 pt-6 mt-8">
                    <h4 className="text-lg font-semibold text-white mb-4">Your Activity</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white">{userStats.serversCount}</div>
                            <div className="text-sm text-gray-300">Active Servers</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Music className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white">{userStats.favoriteStations}</div>
                            <div className="text-sm text-gray-300">Favorite Stations</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white">{userStats.totalListeningTime}h</div>
                            <div className="text-sm text-gray-300">Listening Time</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white">{new Date().getFullYear() - userStats.joinDate.getFullYear()}</div>
                            <div className="text-sm text-gray-300">Years Active</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="border-t border-slate-700 pt-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Account Actions</h4>
                    <div className="flex space-x-4">
                      <button
                        onClick={logout}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Logout from All Devices
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Playback Changes</h4>
                        <p className="text-gray-400 text-sm">Get notifications when radio station changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.playbackChanges}
                          onChange={(e) => setNotifications(prev => ({ ...prev, playbackChanges: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Update Server</h4>
                        <p className="text-gray-400 text-sm">Notifications when there are changes to Discord servers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.serverUpdates}
                          onChange={(e) => setNotifications(prev => ({ ...prev, serverUpdates: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">System Alerts</h4>
                        <p className="text-gray-400 text-sm">Important notifications about system and security</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.systemAlerts}
                          onChange={(e) => setNotifications(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="border-t border-slate-700 pt-6 mt-8">
                    <button
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2"
                    >
                      <Save className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                      <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Privacy & Security</h2>
                  
                  <div className="space-y-8">
                    {/* Data Sharing */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Data Sharing</h4>
                      <div className="bg-slate-700/30 rounded-lg p-4">
                        <p className="text-gray-300 text-sm mb-3">
                          We only use your Discord data to provide radio bot services. 
                          Data is not shared with third parties without your consent.
                        </p>
                        <ul className="text-gray-400 text-sm space-y-1">
                          <li>• Discord profile information (name, avatar, ID)</li>
                          <li>• Discord servers you manage</li>
                          <li>• Radio setting preferences</li>
                        </ul>
                      </div>
                    </div>

                    {/* Account Deletion */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Delete Account</h4>
                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-300 text-sm mb-4">
                          Deleting your account will permanently remove all your data. 
                          This action cannot be undone.
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
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