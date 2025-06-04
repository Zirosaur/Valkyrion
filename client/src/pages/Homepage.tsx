import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import BotProfile from '../components/BotProfile';
interface BotStatus {
  isOnline: boolean;
  uptime: number;
  currentListeners: number;
}

interface BotInfo {
  id: string;
  username: string;
  tag: string;
  avatar: string | null;
  isOnline: boolean;
  serverCount: number;
}

interface ServerInfo {
  id: string;
  name: string;
  memberCount: number;
  isConnected: boolean;
  currentStation?: any;
  isPlaying: boolean;
}

export default function Homepage() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalListeners, setTotalListeners] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statusRes, botInfoRes, publicStatsRes] = await Promise.all([
          fetch('/api/bot/status'),
          fetch('/api/bot/info'),
          fetch('/api/public/stats')
        ]);

        let status = null;
        if (statusRes.ok) {
          status = await statusRes.json();
          setBotStatus(status);
        }

        if (botInfoRes.ok) {
          const botData = await botInfoRes.json();
          // Merge bot info with status data to ensure isOnline is properly set
          const enrichedBotData = {
            ...botData,
            isOnline: (status && typeof status === 'object' && 'isOnline' in status) ? status.isOnline : (botData.isOnline || false)
          };
          setBotInfo(enrichedBotData);
        }

        if (publicStatsRes.ok) {
          const statsData = await publicStatsRes.json();
          setTotalListeners(statsData.totalListeners);
          // Create mock server array with the correct count for display purposes
          const mockServers = Array.from({ length: statsData.totalServers }, (_, i) => ({
            id: `server-${i}`,
            name: `Server ${i + 1}`,
            memberCount: 0,
            isConnected: true,
            isPlaying: true
          }));
          setServers(mockServers);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Reduced from 30s to 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">

      {/* Hero Section */}
      <HeroSection 
        botStatus={botStatus || undefined} 
        serverCount={servers.length}
        totalListeners={totalListeners}
      />

      {/* Bot Profile Section */}
      <div className="relative py-16 bg-black/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Meet Your Radio Bot
            </h2>
            <p className="text-lg text-gray-300">
              Powered by Discord technology with real-time streaming capabilities
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
            <BotProfile botInfo={botInfo} className="justify-center" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose Valkyrion?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional Discord radio bot with 33+ high-quality radio stations 
              and 24/7 uninterrupted streaming
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🎵</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">33+ Radio Stations</h3>
              <p className="text-gray-300">
                Complete collection of radio stations from various music genres for all tastes
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🌐</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">24/7 Streaming</h3>
              <p className="text-gray-300">
                Bot active around the clock with high audio quality and stable connection
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Easy to Use</h3>
              <p className="text-gray-300">
                Simple interface with category dropdown to select your favorite stations
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Voice Channel Protection</h3>
              <p className="text-gray-300">
                Security validation ensures only users in voice channel can control music
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Web Dashboard</h3>
              <p className="text-gray-300">
                Full control through web dashboard with real-time monitoring of all servers
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🎧</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">High Quality Audio</h3>
              <p className="text-gray-300">
                320kbps streaming with optimal volume boost for the best listening experience
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Try Valkyrion?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Invite the bot to your Discord server and experience the best radio streaming
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/invite"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 text-center"
            >
              Invite Bot
            </Link>
            <Link 
              href="/server-selection"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-all text-center"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="relative bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
                Valkyrion
              </h3>
              <p className="text-gray-300 mb-4 max-w-md">
                Professional Discord radio bot delivering high-quality music streaming 
                experience to communities worldwide with 24/7 reliability.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://discord.com/invite/valkyrie-758647019396530177" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
                <a 
                  href="https://github.com/Zirosaur" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="/commands" className="text-gray-400 hover:text-white transition-colors">Commands</a></li>
                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="/invite" className="text-gray-400 hover:text-white transition-colors">Add Bot</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="https://discord.com/invite/valkyrie-758647019396530177" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Discord Server</a></li>
                <li><a href="mailto:sfxghazi@gmail.com" className="text-gray-400 hover:text-white transition-colors">Email Support</a></li>
                <li><a href="https://github.com/Zirosaur" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Valkyrion. Built by Ziro (@valkyrieofficial). All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-2 md:mt-0">
              Professional Discord radio bot service
            </p>
          </div>
        </div>
      </footer>

      </div>
    </Layout>
  );
}