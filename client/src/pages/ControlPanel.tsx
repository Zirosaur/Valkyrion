import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Volume2, Users, Wifi, Settings, X, AlertCircle, Heart } from 'lucide-react';
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';

interface ServerDetail {
  id: string;
  name: string;
  memberCount: number;
  isConnected: boolean;
  currentStation?: {
    id: number;
    name: string;
    genre: string;
    quality: string;
    artwork: string;
  };
  isPlaying: boolean;
  volume: number;
  voiceChannelId?: string;
}

interface VoiceStatus {
  inVoiceChannel: boolean;
  canControl: boolean;
  voiceChannelName?: string;
  botChannelName?: string;
  message: string;
}

interface RadioStation {
  id: number;
  name: string;
  url: string;
  genre: string;
  quality: string;
  artwork: string;
  isFavorite: boolean;
  isActive: boolean;
  listeners: number;
}

interface ToastNotification {
  id: string;
  title: string;
  description: string;
  type: 'error' | 'warning' | 'success';
}

export default function ControlPanel() {
  const { serverId } = useParams<{ serverId: string }>();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [lastWarningTime, setLastWarningTime] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<string>('Semua Kategori');

  const { data: server, isLoading: serverLoading } = useQuery<ServerDetail>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  const { data: voiceStatus } = useQuery<VoiceStatus>({
    queryKey: [`/api/servers/${serverId}/voice-status`],
    enabled: !!serverId,
    refetchInterval: 10000, // Check every 10 seconds
  });

  const { data: stations = [] } = useQuery<RadioStation[]>({
    queryKey: ['/api/stations'],
  });

  // Discord bot categorization system
  const categorizeStation = (station: RadioStation): string => {
    const genre = station.genre.toLowerCase();
    const name = station.name.toLowerCase();
    
    if (genre.includes('pop') || genre.includes('dance') || genre.includes('hits') || name.includes('pop')) {
      return 'Pop & Hits';
    } else if (genre.includes('rock') || genre.includes('metal') || genre.includes('punk') || name.includes('rock')) {
      return 'Rock & Metal';
    } else if (genre.includes('electronic') || genre.includes('edm') || genre.includes('house') || genre.includes('techno')) {
      return 'Electronic & House';
    } else if (genre.includes('chill') || genre.includes('lofi') || genre.includes('ambient') || name.includes('chill')) {
      return 'Chill & Lofi';
    } else if (genre.includes('jazz') || genre.includes('classic') || genre.includes('blues') || name.includes('jazz')) {
      return 'Jazz & Classic';
    } else if (genre.includes('alternative') || genre.includes('indie') || genre.includes('reggae')) {
      return 'Alternative';
    } else if (genre.includes('news') || genre.includes('talk') || name.includes('news')) {
      return 'Radio News';
    } else {
      return 'World Music';
    }
  };

  // Get categories from Discord bot system
  const categories = ['Semua Kategori', 'Pop & Hits', 'Rock & Metal', 'Electronic & House', 'Chill & Lofi', 'Jazz & Classic', 'World Music', 'Alternative', 'Radio News'];
  
  // Filter stations by selected category
  const filteredStations = selectedGenre === 'Semua Kategori' 
    ? stations 
    : stations.filter(station => categorizeStation(station) === selectedGenre);

  // Function to show voice channel warning with debouncing
  const showVoiceChannelWarning = () => {
    if (!voiceStatus?.canControl) {
      const now = Date.now();
      // Only show warning if at least 3 seconds have passed since last warning
      if (now - lastWarningTime < 3000) {
        return;
      }
      
      setLastWarningTime(now);
      
      const notification: ToastNotification = {
        id: now.toString(),
        title: "Akses Ditolak",
        description: voiceStatus?.message || "Anda harus bergabung ke voice channel untuk mengontrol radio",
        type: 'error'
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
  };

  // Function to remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const playStationMutation = useMutation({
    mutationFn: async ({ stationId }: { stationId: number }) => {
      const response = await fetch(`/api/servers/${serverId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId }),
      });
      if (!response.ok) throw new Error('Gagal memutar stasiun');
      return response.json();
    },
    onSuccess: () => {
      // Force immediate refresh after station change
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId] });
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
      
      // Refresh again after short delay to ensure Discord bot has updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId] });
      }, 2000);
    },
  });



  const volumeMutation = useMutation({
    mutationFn: async ({ volume }: { volume: number }) => {
      const response = await fetch(`/api/servers/${serverId}/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume }),
      });
      if (!response.ok) throw new Error('Gagal mengatur volume');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId] });
    },
  });

  const favoriteStationMutation = useMutation({
    mutationFn: async ({ stationId, isFavorite }: { stationId: number; isFavorite: boolean }) => {
      const response = await fetch(`/api/stations/${stationId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite }),
      });
      if (!response.ok) throw new Error('Failed to update favorite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
    },
  });

  if (serverLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">Loading server controls...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!server) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Server Tidak Ditemukan</h3>
              <p className="text-gray-400">Server yang Anda cari tidak tersedia atau tidak dapat diakses</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Kontrol Server
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              {server.name}
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Kelola musik dan pengaturan untuk server Discord Anda
            </p>
          </div>

          {/* Voice Channel Status */}
          {voiceStatus && (
            <div className={`border rounded-lg p-4 mb-6 ${
              voiceStatus.canControl 
                ? 'bg-green-900/20 border-green-500/50' 
                : 'bg-amber-900/20 border-amber-500/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  voiceStatus.canControl ? 'bg-green-500' : 'bg-amber-500'
                }`}></div>
                <span className={`font-medium ${
                  voiceStatus.canControl ? 'text-green-300' : 'text-amber-300'
                }`}>
                  {voiceStatus.message}
                </span>
              </div>
              {voiceStatus.inVoiceChannel && voiceStatus.voiceChannelName && (
                <p className="text-sm text-gray-400 mt-2">
                  You are in: {voiceStatus.voiceChannelName}
                  {voiceStatus.botChannelName && voiceStatus.botChannelName !== voiceStatus.voiceChannelName && (
                    <span> • Bot is in: {voiceStatus.botChannelName}</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Server Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">{server.name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${server.isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                <Wifi size={16} />
                {server.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Users size={20} />
                <span>{server.memberCount} members</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Volume2 size={20} />
                <span>Volume: {server.volume}%</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Settings size={20} />
                <span>{server.isPlaying ? "Playing" : "Stopped"}</span>
              </div>
            </div>
          </div>

          {/* Current Station */}
          {server.currentStation && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Current Station</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={server.currentStation.artwork} 
                  alt={server.currentStation.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-white">{server.currentStation.name}</h4>
                  <p className="text-gray-400">{server.currentStation.genre} • {server.currentStation.quality}</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400 font-medium">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Volume Control */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Kontrol Volume</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-400">0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    server.volume > 100 ? 'text-amber-400' : 'text-white'
                  }`}>
                    {server.volume}%
                  </span>
                  {server.volume > 100 && (
                    <span className="text-xs bg-amber-600 text-amber-100 px-2 py-1 rounded">
                      BOOST
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-400">200%</span>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={server.volume}
                  onChange={(e) => {
                    if (!voiceStatus?.canControl) {
                      showVoiceChannelWarning();
                      return;
                    }
                    volumeMutation.mutate({ volume: parseInt(e.target.value) });
                  }}
                  disabled={false}
                  className={`w-full h-3 bg-slate-700 rounded-lg appearance-none ${
                    voiceStatus?.canControl ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                  style={{
                    background: `linear-gradient(to right, 
                      #3b82f6 0%, 
                      #3b82f6 ${Math.min(server.volume, 100) / 2}%, 
                      ${server.volume > 100 ? '#f59e0b' : '#374151'} ${Math.min(server.volume, 100) / 2}%, 
                      ${server.volume > 100 ? '#f59e0b' : '#374151'} ${server.volume / 2}%, 
                      #374151 ${server.volume / 2}%, 
                      #374151 100%)`
                  }}
                />
                <div 
                  className="absolute top-0 w-0.5 h-3 bg-slate-500" 
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Normal</span>
                <span>Default (100%)</span>
                <span>Boost Mode</span>
              </div>
            </div>
          </div>

          {/* Station Selection */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-4 sm:mb-0">Pilih Stasiun Radio</h3>
              
              {/* Genre Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Filter Genre:</span>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4 text-sm text-gray-400">
              Menampilkan {filteredStations.length} dari {stations.length} stasiun radio
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStations.map((station) => (
                <div 
                  key={station.id} 
                  className={`bg-slate-700/50 border rounded-lg p-4 transition-all ${
                    !voiceStatus?.canControl 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'cursor-pointer hover:border-purple-500/50'
                  } ${
                    server.currentStation?.id === station.id ? 'border-purple-500 bg-purple-600/20' : 'border-slate-600'
                  }`}
                  onClick={() => {
                    if (!voiceStatus?.canControl) {
                      showVoiceChannelWarning();
                      return;
                    }
                    playStationMutation.mutate({ stationId: station.id });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={station.artwork} 
                      alt={station.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{station.name}</h4>
                      <p className="text-sm text-gray-400">{station.genre}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          favoriteStationMutation.mutate({ 
                            stationId: station.id, 
                            isFavorite: !station.isFavorite 
                          });
                        }}
                        className={`p-1 rounded-full transition-colors ${
                          station.isFavorite 
                            ? 'text-red-500 hover:text-red-400' 
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart 
                          size={16} 
                          fill={station.isFavorite ? 'currentColor' : 'none'} 
                        />
                      </button>
                      {server.currentStation?.id === station.id && server.isPlaying && (
                        <div className="text-green-400">
                          <Play size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toast Notifications */}
        <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`w-full bg-slate-800 border shadow-2xl rounded-lg overflow-hidden transition-all duration-300 transform translate-x-0 ${
                notification.type === 'error' 
                  ? 'border-red-500/50 bg-red-900/10' 
                  : notification.type === 'warning'
                  ? 'border-amber-500/50 bg-amber-900/10'
                  : 'border-green-500/50 bg-green-900/10'
              }`}
              style={{
                animation: 'slideInFromRight 0.3s ease-out forwards'
              }}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'error' 
                        ? 'bg-red-500' 
                        : notification.type === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-1">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {notification.description}
                    </p>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200 p-1 hover:bg-slate-700 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className={`h-1 ${
                notification.type === 'error' 
                  ? 'bg-red-500' 
                  : notification.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }`}></div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}