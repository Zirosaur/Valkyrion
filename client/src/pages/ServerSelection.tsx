import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

interface ServerInfo {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
  isConnected: boolean;
  currentStation?: any;
  isPlaying: boolean;
}

export default function ServerSelection() {
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: servers = [], isLoading, error } = useQuery<ServerInfo[]>({
    queryKey: ['/api/servers'],
    enabled: !!user, // Only fetch when user is authenticated
  });

  const { data: botStatus } = useQuery<{
    isOnline: boolean;
    uptime?: number;
    volume: number;
  }>({
    queryKey: ['/api/bot/status'],
  });

  // Debug log
  console.log('ServerSelection - servers:', servers, 'isLoading:', isLoading, 'error:', error);

  // Show loading while checking authentication
  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">Loading servers...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show login required message for unauthenticated users
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
                <p className="text-gray-300 mb-6">
                  You must login to view and manage Discord servers.
                </p>
                <a 
                  href="/auth/discord" 
                  className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300"
                >
                  Login with Discord
                </a>
              </div>
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Select Discord Server
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Choose a Discord server to manage and access the radio bot control panel
            </p>
          </div>

          {/* Bot Status */}
          {botStatus && (
            <div className="mb-8">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${botStatus.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-gray-300">Status Bot:</span>
                    <span className={`px-2 py-1 rounded text-sm ${botStatus.isOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                      {botStatus.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{servers.length} Server</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Server Grid - Square Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {servers.map((server) => (
              <Link key={server.id} href={`/control-panel/${server.id}`}>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer aspect-square flex flex-col">
                  {/* Server Icon - Prominent */}
                  <div className="flex-1 flex items-center justify-center mb-3">
                    {server.icon ? (
                      <img 
                        src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128`}
                        alt={`${server.name} icon`}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover group-hover:scale-110 transition-transform duration-300 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl md:text-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        {server.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Server Info - Compact */}
                  <div className="text-center space-y-2">
                    <h3 className="text-sm md:text-base font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2 leading-tight">
                      {server.name}
                    </h3>
                    
                    {/* Status Badge */}
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${server.isConnected ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'}`}>
                      {server.isConnected ? "Online" : "Offline"}
                    </span>

                    {/* Quick Stats */}
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>{server.memberCount} members</div>
                      {server.isPlaying && server.currentStation && (
                        <div className="text-green-400 flex items-center justify-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          <span className="truncate max-w-full">{server.currentStation.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {servers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🖥️</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Servers</h3>
              <p className="text-gray-400 mb-6">Bot is not connected to any Discord servers yet</p>
              <Link href="/invite">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-lg font-medium transition-all">
                  Invite Bot to Server
                </button>
              </Link>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/">
                <button className="border border-slate-600 text-gray-300 hover:bg-slate-700 py-2 px-4 rounded-lg transition-all">
                  Back to Home
                </button>
              </Link>
              <Link href="/invite">
                <button className="border border-purple-600 text-purple-400 hover:bg-purple-900/20 py-2 px-4 rounded-lg transition-all">
                  Invite Bot to Another Server
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}