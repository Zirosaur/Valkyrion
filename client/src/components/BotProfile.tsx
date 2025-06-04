import { useState, useEffect } from 'react';

interface BotInfo {
  id: string;
  username: string;
  tag: string;
  avatar: string | null;
  isOnline: boolean;
  serverCount: number;
}

interface BotProfileProps {
  botInfo?: BotInfo | null;
  className?: string;
}

export default function BotProfile({ botInfo, className = "" }: BotProfileProps) {
  const [imageError, setImageError] = useState(false);

  // Reset image error when botInfo changes
  useEffect(() => {
    setImageError(false);
  }, [botInfo?.avatar]);

  if (!botInfo) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 bg-gray-600 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  const fallbackAvatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(botInfo.id) % 5}.png`;
  const avatarUrl = botInfo.avatar && !imageError ? botInfo.avatar : fallbackAvatar;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <img
          src={avatarUrl}
          alt={`${botInfo.username} avatar`}
          className="w-24 h-24 rounded-full bg-gray-700 border-4 border-white/20"
          onError={() => setImageError(true)}
        />
        <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-gray-900 ${
          botInfo.isOnline ? 'bg-green-500' : 'bg-gray-500'
        }`} />
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h3 className="text-2xl font-bold text-white">
            {botInfo.username}
          </h3>
          {botInfo.isOnline && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-200">
              Online
            </span>
          )}
        </div>
        <p className="text-gray-300 text-lg">
          Discord Radio Bot
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Active in {botInfo.serverCount} servers
        </p>
      </div>
    </div>
  );
}