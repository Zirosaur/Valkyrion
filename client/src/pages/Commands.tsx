import Layout from '../components/Layout';
import { Link } from 'wouter';

export default function Commands() {
  const commandCategories = [
    {
      name: 'Radio Control',
      icon: '🎵',
      commands: [
        {
          name: '/radio status',
          description: 'Check radio bot status and current playing station',
          usage: '/radio status',
          example: '/radio status'
        },
        {
          name: '/radio dashboard',
          description: 'Get link to radio dashboard for monitoring',
          usage: '/radio dashboard',
          example: '/radio dashboard'
        }
      ]
    },
    {
      name: 'Station Management',
      icon: '📻',
      commands: [
        {
          name: '/stations',
          description: 'View available radio stations and how to control them',
          usage: '/stations',
          example: '/stations'
        }
      ]
    },
    {
      name: 'Server Setup',
      icon: '⚙️',
      commands: [
        {
          name: '/setup',
          description: 'Setup radio channels and interface for this server',
          usage: '/setup',
          example: '/setup'
        }
      ]
    },
    {
      name: 'Information',
      icon: 'ℹ️',
      commands: [
        {
          name: '/help',
          description: 'How to use the radio bot',
          usage: '/help',
          example: '/help'
        }
      ]
    }
  ];

  const features = [
    'Easy slash command interface',
    'Web dashboard control panel',
    'Multi-server support with individual volume control',
    'Auto-reconnect if disconnected',
    'Interactive radio station selection',
    'High-quality streaming audio',
    'Real-time status monitoring',
    '33+ international radio stations',
    'Automatic voice channel management'
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Hero Section */}
        <div className="relative py-20 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
              Bot Commands
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Complete guide to all available slash commands for controlling Valkyrion Radio Bot
            </p>
          </div>

          {/* Commands Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {commandCategories.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl">{category.icon}</span>
                  <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                </div>
                
                <div className="space-y-6">
                  {category.commands.map((command, cmdIndex) => (
                    <div key={cmdIndex} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="text-lg font-bold text-white mb-2">{command.name}</h4>
                      <p className="text-gray-400 mb-3">{command.description}</p>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-sm">Usage:</span>
                          <code className="bg-white/10 text-white px-2 py-1 rounded ml-2 text-sm font-mono">
                            {command.usage}
                          </code>
                        </div>
                        
                        <div>
                          <span className="text-gray-400 text-sm">Example:</span>
                          <code className="bg-green-500/20 text-green-300 px-2 py-1 rounded ml-2 text-sm font-mono">
                            {command.example}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6">Command Features</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-white">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6">Need Help?</h3>
              <div className="space-y-4">
                <p className="text-gray-400">
                  Need help with the bot? Join our community server or contact support for direct assistance from our team and community members.
                </p>
                
                <div className="space-y-3">
                  <a href="https://discord.gg/your-server" target="_blank" rel="noopener noreferrer">
                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                      Join Community Server
                    </button>
                  </a>
                  
                  <Link to="/control-panel">
                    <button className="w-full bg-white/10 text-white py-3 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300">
                      Open Web Dashboard
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>

        {/* Footer */}
        <footer className="bg-black/20 border-t border-white/10 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-white font-bold text-xl mb-2">Valkyrion Radio Bot</h3>
              <div className="text-gray-400 text-sm">
                Built with ❤️ for Discord Communities
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}