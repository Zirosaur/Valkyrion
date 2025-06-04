import { Calendar, CheckCircle, Star, Zap, Shield, Music, Globe, Settings } from 'lucide-react';
import Layout from '../components/Layout';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  changes: {
    type: 'added' | 'improved' | 'fixed' | 'removed';
    description: string;
  }[];
}

export default function Changelog() {
  const changelogData: ChangelogEntry[] = [
    {
      version: "2.2.0",
      date: "2025-06-03",
      type: "minor",
      title: "Performance Optimization & System Stability",
      changes: [
        { type: "improved", description: "Reduced frontend API call frequency for better performance" },
        { type: "improved", description: "Enhanced Discord avatar display with real CDN integration" },
        { type: "improved", description: "Optimized database queries and reduced memory usage" },
        { type: "improved", description: "Smart caching system for Discord server data" },
        { type: "improved", description: "Iterator compatibility fixes for better ES2015+ support" },
        { type: "fixed", description: "Database schema compatibility issues causing SQL errors" },
        { type: "fixed", description: "Multiple duplicate API requests on dashboard pages" },
        { type: "fixed", description: "TypeScript compilation errors in cache and storage systems" }
      ]
    },
    {
      version: "2.1.0",
      date: "2025-01-03",
      type: "major",
      title: "Dashboard Web & Server Management",
      changes: [
        { type: "added", description: "Comprehensive web dashboard for monitoring all servers" },
        { type: "added", description: "Individual server control system with real-time play/pause" },
        { type: "added", description: "Radio station selection interface directly from dashboard" },
        { type: "added", description: "Message cleanup function to clear bot spam" },
        { type: "improved", description: "Auto-refresh data every 15 seconds for real-time monitoring" },
        { type: "improved", description: "Server status display with online/offline indicators" }
      ]
    },
    {
      version: "2.0.3",
      date: "2025-01-02",
      type: "patch",
      title: "Performance & Stability Optimization",
      changes: [
        { type: "improved", description: "Stream quality optimization based on network conditions" },
        { type: "improved", description: "Automatic memory cleanup to prevent memory leaks" },
        { type: "fixed", description: "Duplicate messages bug that appeared repeatedly" },
        { type: "fixed", description: "Voice connection issues that sometimes disconnected" }
      ]
    },
    {
      version: "2.0.2",
      date: "2025-01-01",
      type: "patch",
      title: "Auto-Resume System Improvements",
      changes: [
        { type: "improved", description: "Auto-resume streaming system after bot restart" },
        { type: "improved", description: "Last played station storage for each server" },
        { type: "fixed", description: "Bot presence not updating after station change" }
      ]
    },
    {
      version: "2.0.1",
      date: "2024-12-30",
      type: "patch",
      title: "Hotfix Voice Channel Protection",
      changes: [
        { type: "fixed", description: "Voice channel validation bug that was too strict" },
        { type: "improved", description: "Better error handling for voice connections" }
      ]
    },
    {
      version: "2.0.0",
      date: "2024-12-28",
      type: "major",
      title: "Complete Rewrite & Multi-Server Support",
      changes: [
        { type: "added", description: "Multi-server support with separate state management" },
        { type: "added", description: "Modern web interface with gradient HeroSection" },
        { type: "added", description: "33+ high-quality radio stations" },
        { type: "added", description: "Station categorization system by genre" },
        { type: "added", description: "Voice channel protection for security" },
        { type: "added", description: "200% volume boost for clear audio" },
        { type: "improved", description: "More intuitive slash commands" },
        { type: "improved", description: "Auto-setup for radio and control channels" }
      ]
    },
    {
      version: "1.5.0",
      date: "2024-12-20",
      type: "minor",
      title: "Enhanced Audio Quality",
      changes: [
        { type: "added", description: "320kbps streaming for all premium stations" },
        { type: "improved", description: "More stable audio buffering" },
        { type: "fixed", description: "Audio lag on high-latency servers" }
      ]
    },
    {
      version: "1.4.2",
      date: "2024-12-15",
      type: "patch",
      title: "Stability Improvements",
      changes: [
        { type: "improved", description: "More robust reconnection logic" },
        { type: "fixed", description: "Memory leak in long-running sessions" },
        { type: "fixed", description: "Commands that sometimes didn't respond" }
      ]
    },
    {
      version: "1.4.0",
      date: "2024-12-10",
      type: "minor",
      title: "Multilingual Support",
      changes: [
        { type: "added", description: "Indonesian and English language support" },
        { type: "added", description: "Dynamic language switching on website" },
        { type: "improved", description: "User interface with language preferences" }
      ]
    },
    {
      version: "1.3.0",
      date: "2024-12-05",
      type: "minor",
      title: "Discord Integration",
      changes: [
        { type: "added", description: "Discord OAuth2 authentication" },
        { type: "added", description: "User profile management" },
        { type: "added", description: "Server selection interface" }
      ]
    },
    {
      version: "1.2.0",
      date: "2024-11-28",
      type: "minor",
      title: "Command System Overhaul",
      changes: [
        { type: "added", description: "Slash commands for all functions" },
        { type: "added", description: "/setup command for auto-configuration" },
        { type: "improved", description: "More informative command responses" }
      ]
    },
    {
      version: "1.1.0",
      date: "2024-11-20",
      type: "minor",
      title: "Station Library Expansion",
      changes: [
        { type: "added", description: "15+ new radio stations from various genres" },
        { type: "added", description: "Favorites system for frequently played stations" },
        { type: "improved", description: "Stream quality for international stations" }
      ]
    },
    {
      version: "1.0.0",
      date: "2024-11-15",
      type: "major",
      title: "Initial Release",
      changes: [
        { type: "added", description: "Discord radio bot with 18 initial stations" },
        { type: "added", description: "Basic voice channel streaming" },
        { type: "added", description: "Simple command system" },
        { type: "added", description: "24/7 uptime support" }
      ]
    }
  ];

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'improved':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'fixed':
        return <Shield className="w-4 h-4 text-orange-500" />;
      case 'removed':
        return <Settings className="w-4 h-4 text-red-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-500" />;
    }
  };

  const getVersionBadgeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'minor':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'patch':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Changelog Valkyrion
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Development history and updates of the best Discord radio bot
            </p>
          </div>



          {/* Changelog Timeline */}
          <div className="space-y-8">
            {changelogData.map((entry, index) => (
              <div key={entry.version} className="relative">
                {/* Timeline Line */}
                {index !== changelogData.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-full bg-slate-200 dark:bg-slate-700"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Timeline Dot */}
                  <div className={`w-12 h-12 rounded-full ${getVersionBadgeColor(entry.type)} flex items-center justify-center flex-shrink-0 z-10`}>
                    <span className="text-white font-bold text-sm">v{entry.version.split('.')[0]}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                          {entry.title}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getVersionBadgeColor(entry.type)}`}>
                            v{entry.version}
                          </span>
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(entry.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {entry.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="flex items-start space-x-3">
                          {getChangeIcon(change.type)}
                          <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {change.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-16 text-center bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              Ready to Try Valkyrion?
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Join thousands of users who have experienced the best Discord radio streaming
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/invite"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Invite Bot
              </a>
              <a 
                href="/features"
                className="bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
              >
                View Features
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}