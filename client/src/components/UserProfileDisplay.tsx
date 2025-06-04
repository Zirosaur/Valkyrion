import { User } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  displayName?: string;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  email?: string;
}

interface UserProfileDisplayProps {
  user: UserData;
  variant?: 'desktop' | 'mobile';
  showUsername?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserProfileDisplay({ 
  user, 
  variant = 'desktop', 
  showUsername = true,
  size = 'md'
}: UserProfileDisplayProps) {
  const avatarSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const subTextSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const displayName = user.displayName || user.discordUsername;
  const avatarSize = avatarSizes[size];
  const textSize = textSizes[size];
  const subTextSize = subTextSizes[size];

  // Generate Discord avatar URL
  const getDiscordAvatarUrl = (discordId: string, avatar?: string) => {
    if (avatar) {
      return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`;
    } else {
      // Default Discord avatar based on discriminator
      const defaultAvatar = (parseInt(discordId) % 5);
      return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
    }
  };

  const avatarUrl = getDiscordAvatarUrl(user.discordId, user.discordAvatar);

  if (variant === 'mobile') {
    return (
      <div className="flex items-center space-x-3">
        <img 
          src={avatarUrl}
          alt={displayName}
          className={`${avatarSize} rounded-full`}
          onError={(e) => {
            // Fallback to default Discord avatar if image fails to load
            const defaultAvatar = (parseInt(user.discordId) % 5);
            (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
          }}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-white font-medium truncate ${textSize}`}>
            {displayName}
          </p>
          {showUsername && (
            <p className={`text-gray-400 truncate ${subTextSize}`}>
              @{user.discordUsername || user.username}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="flex items-center space-x-2">
      <img 
        src={avatarUrl}
        alt={displayName}
        className={`${avatarSize} rounded-full`}
        onError={(e) => {
          // Fallback to default Discord avatar if image fails to load
          const defaultAvatar = (parseInt(user.discordId) % 5);
          (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
        }}
      />
      <div className="flex flex-col">
        <span className={`text-white font-medium ${textSize}`}>
          {displayName}
        </span>
        {showUsername && variant === 'desktop' && (
          <span className={`text-gray-400 ${subTextSize}`}>
            @{user.discordUsername || user.username}
          </span>
        )}
      </div>
    </div>
  );
}