import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';

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

export default function Features() {
  const { data: stations = [] } = useQuery<RadioStation[]>({
    queryKey: ['/api/stations'],
    refetchInterval: 30000,
  });

  const features = [
    {
      icon: '🎵',
      title: 'High Quality Audio',
      description: 'Crystal clear 320kbps streaming with 200% volume boost for the best audio experience.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📻',
      title: '33+ Radio Stations',
      description: 'Curated collection of premium radio stations across 8 different music genres.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🌐',
      title: '24/7 Streaming',
      description: 'Bot stays active all the time with stable connection and guaranteed quality.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '⚡',
      title: 'Easy Control',
      description: 'Simple interface with slash commands to control your music.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '🔒',
      title: 'Voice Channel Security',
      description: 'Validation ensures only users in voice channel can control the music.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: '📊',
      title: 'Web Dashboard',
      description: 'Monitor and control bot through responsive web dashboard.',
      color: 'from-teal-500 to-green-500'
    }
  ];

  const genres = [
    { name: 'Electronic', count: 8, icon: '🎛️' },
    { name: 'Hip Hop', count: 5, icon: '🎤' },
    { name: 'Jazz', count: 4, icon: '🎷' },
    { name: 'Classical', count: 3, icon: '🎼' },
    { name: 'Rock', count: 6, icon: '🎸' },
    { name: 'Pop', count: 4, icon: '🎵' },
    { name: 'Ambient', count: 2, icon: '🌙' },
    { name: 'World', count: 1, icon: '🌍' }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Hero Section */}
        <div className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-6">
                Premium <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Features</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                The best Discord radio experience with advanced features for your community
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-16 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <span className="text-white text-xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Genre Section */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Music Genres</h2>
              <p className="text-xl text-gray-300">8 music categories for every taste</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {genres.map((genre, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-all">
                  <div className="text-3xl mb-3">{genre.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-1">{genre.name}</h3>
                  <p className="text-gray-400">{genre.count} stations</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Radio Stations Preview */}
        <div className="py-16 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Stasiun Radio Populer</h2>
              <p className="text-xl text-gray-300">Beberapa stasiun favorit komunitas</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.slice(0, 6).map((station) => (
                <div key={station.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={station.artwork} 
                      alt={station.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{station.name}</h3>
                      <p className="text-gray-400">{station.genre}</p>
                      <p className="text-sm text-gray-500">{station.quality}</p>
                    </div>
                  </div>
                </div>
              ))}
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
                href="/changelog"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-all text-center"
              >
                View Changelog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}