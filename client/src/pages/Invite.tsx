import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Layout from '../components/Layout';

interface InviteData {
  inviteUrl: string;
  permissions: string[];
}

export default function Invite() {
  const [copied, setCopied] = useState(false);

  const { data: inviteData, isLoading, error } = useQuery<InviteData>({
    queryKey: ['/api/bot/invite'],
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debugging: log the query state
  console.log('Invite query state:', { inviteData, isLoading, error });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Invite
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {" "}Valkyrion
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Add Valkyrion to your Discord server with comprehensive permissions for the best experience.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Generating invite link...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Invite Link Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Bot Invite Link</h2>
              
              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <code className="text-blue-300 text-sm break-all pr-4">
                    https://discord.com/api/oauth2/authorize?client_id=1293281550565113987&permissions=419333360920&scope=bot%20applications.commands
                  </code>
                  <button
                    onClick={() => copyToClipboard('https://discord.com/api/oauth2/authorize?client_id=1293281550565113987&permissions=419333360920&scope=bot%20applications.commands')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://discord.com/api/oauth2/authorize?client_id=1293281550565113987&permissions=419333360920&scope=bot%20applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold text-center hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  Invite to Server
                </a>
                <button
                  onClick={() => copyToClipboard('https://discord.com/api/oauth2/authorize?client_id=1293281550565113987&permissions=419333360920&scope=bot%20applications.commands')}
                  className="flex-1 bg-white/10 text-white py-3 px-6 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Required Permissions</h2>
              <p className="text-gray-400 mb-6">
                Valkyrion requires these permissions to provide the best radio experience and enable future features:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Administrator',
                  'Manage Webhooks',
                  'View Channels',
                  'Send Messages',
                  'Send Messages in Threads',
                  'Embed Links',
                  'Read Message History',
                  'Mention @everyone, @here, and All Roles',
                  'Use External Emoji',
                  'Use External Stickers',
                  'Use Application Commands',
                  'Connect',
                  'Speak',
                  'Use Voice Activity',
                  'Priority Speaker',
                  'Request to Speak'
                ].map((permission, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-white/5 rounded-lg p-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-white text-sm">{permission}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Setup Instructions</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Click Invite to Server</h3>
                    <p className="text-gray-400 text-sm">Click the button above to open Discord's authorization page.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Select Your Server</h3>
                    <p className="text-gray-400 text-sm">Choose the Discord server where you want to add Valkyrion.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Authorize Permissions</h3>
                    <p className="text-gray-400 text-sm">Review and accept the permissions. All permissions are necessary for optimal functionality.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Start Using Valkyrion</h3>
                    <p className="text-gray-400 text-sm">Use <code className="bg-white/20 px-2 py-1 rounded">/setup</code> to automatically configure radio channels, then start streaming!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
              <p className="text-gray-400 mb-6">
                Having trouble with the setup? Check out our documentation or contact support.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/commands">
                  <button className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300">
                    View Commands
                  </button>
                </Link>
                <Link href="/features">
                  <button className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300">
                    See Features
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}