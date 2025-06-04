import Layout from '@/components/Layout';
import { Heart, Code, Music, Users, Globe, Star, Github, Mail } from 'lucide-react';
import { SiDiscord } from 'react-icons/si';

export default function About() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              About Valkyrion
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Premium Discord radio bot that delivers the best music experience for your community
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* About Bot */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">About the Bot</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                This is a Discord radio bot specifically designed to deliver high-quality music streaming experiences. 
                With over 33 radio stations from various genres, this bot allows your Discord server to enjoy music 
                24/7 without interruption.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Equipped with a modern web dashboard, users can easily manage playback, select favorite stations, 
                and control volume from various devices. The bot supports multiple servers simultaneously and has an 
                auto-recovery system that ensures music keeps playing.
              </p>
            </div>

            {/* Developer Info */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Independently Developed</h2>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                  <img 
                    src="https://cdn.discordapp.com/avatars/518311781374885889/f2a845b0184cf2e592034cd2e07bca62.png"
                    alt="Ziro (@valkyrieofficial) Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Ziro (@valkyrieofficial)</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
                    <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                      💡 Personal Project - Developed independently with high dedication
                    </p>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    As a passionate solo developer, I developed this bot from scratch as a personal project. 
                    This bot is the result of hard work and continuous learning in Discord.js, 
                    TypeScript, React, and Node.js technologies. Every feature is designed and built independently with attention to detail.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <strong>Important Note:</strong> Since this is an individual project, there might be bugs or limitations. 
                      I continuously strive to improve and develop this bot. Your feedback and patience are greatly appreciated!
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <a 
                      href="https://github.com/Zirosaur" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      <Github className="w-5 h-5 mr-2" />
                      GitHub
                    </a>
                    <a 
                      href="https://discord.com/invite/valkyrie-758647019396530177" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-slate-600 dark:text-slate-300 hover:text-purple-500 transition-colors"
                    >
                      <SiDiscord className="w-5 h-5 mr-2" />
                      Discord Server
                    </a>
                    <a 
                      href="mailto:sfxghazi@gmail.com" 
                      className="flex items-center text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Highlight */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Key Features</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <Music className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">33+ Radio Stations</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Various music genres from around the world</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">24/7 Uptime</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Non-stop streaming with auto-recovery</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-6 h-6 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">Multi-Server</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Manage multiple Discord servers simultaneously</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Code className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">Dashboard Web</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Modern interface for complete control</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Development Journey */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Development Journey</h2>
              </div>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Why I Built It?</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    As an active Discord user, I saw the need for a stable and easy-to-use radio bot. 
                    Many existing bots often go down or have complicated interfaces. Valkyrion was born from the desire 
                    to provide a better solution.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Challenges Faced</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Developing a Discord bot is not easy. From handling multiple voice connections, 
                    ensuring stable audio streaming, to creating a responsive web dashboard - 
                    everything was done step by step with countless trial and error.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Ongoing Commitment</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Even though this is a solo project, I am committed to continuously developing and improving Valkyrion. 
                    Every bug report and feedback from the community motivates me to make this bot even better.
                  </p>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Technology Stack</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-blue-500 font-bold">Frontend</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">React + TypeScript</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-green-500 font-bold">Backend</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Node.js + Express</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-purple-500 font-bold">Bot</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Discord.js</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-orange-500 font-bold">Database</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">PostgreSQL</div>
                </div>
              </div>
            </div>

            {/* Contact & Support */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Support & Community</h2>
              <p className="mb-4 opacity-90">
                Join the Valkyrie community to get help, share feedback, 
                and stay updated with the latest features.
              </p>
              <div className="bg-white/10 rounded-lg p-4 mb-6 text-sm">
                <p className="font-medium mb-2">Help & Bug Reports</p>
                <p className="opacity-90">
                  As a solo developer, I greatly appreciate bug reports and improvement suggestions from the community. 
                  Don't hesitate to report any issues you encounter - every feedback helps make the bot better!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <a 
                  href="https://discord.com/invite/valkyrie-758647019396530177" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Join Valkyrie Server
                </a>
                <a 
                  href="mailto:sfxghazi@gmail.com" 
                  className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Contact Developer
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}