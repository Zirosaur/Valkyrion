import { Link } from 'wouter';

interface HeroSectionProps {
  botStatus?: {
    isOnline: boolean;
    uptime: number;
  };
  serverCount: number;
  totalListeners: number;
}

export default function HeroSection({ botStatus, serverCount, totalListeners }: HeroSectionProps) {
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-full px-4 py-2 mb-8">
            <div className={`w-2 h-2 rounded-full ${botStatus?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-green-400 text-sm font-medium">
              {botStatus?.isOnline ? 'Bot Online' : 'Bot Offline'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Valkyrion
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Professional Discord Radio Bot
          </p>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Experience the ultimate Discord radio bot with 33+ high-quality radio stations, 24/7 streaming, and seamless server management across multiple communities.
            <br className="hidden md:block" />

          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link href="/invite" className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 text-center">
              <span className="relative z-10">Invite Bot</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            
            <Link href="/features" className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-lg border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 text-center">
              Explore Features
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="text-4xl md:text-5xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                {serverCount}
              </div>
              <div className="text-gray-400 font-medium">Active Servers</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="text-4xl md:text-5xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                {totalListeners}
              </div>
              <div className="text-gray-400 font-medium">Current Listeners</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="text-4xl md:text-5xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                33+
              </div>
              <div className="text-gray-400 font-medium">Radio Stations</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="text-4xl md:text-5xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                24/7
              </div>
              <div className="text-gray-400 font-medium">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}